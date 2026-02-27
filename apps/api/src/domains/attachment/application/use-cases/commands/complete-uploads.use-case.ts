import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { Attachment } from '@domains/attachment/domain/aggregates/attachment.aggregate';
import { ExtractionResult } from '@domains/attachment/domain/aggregates/extraction-result.aggregate';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { IExtractionResultRepository } from '@domains/attachment/domain/repositories/extraction-result.repository.interface';
import {
  ATTACHMENT_REPOSITORY,
  EXTRACTION_RESULT_REPOSITORY,
} from '@domains/attachment/domain/constants';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';
import { ConflictException } from '@shared/exceptions/conflict.exception';
import { GraphileWorkerService } from '@shared/infrastructure/worker/graphile-worker.service';
import { AttachmentMapper } from '../../mappers/attachment.mapper';
import { CompleteUploadsInputDto } from '../../dto/inputs/complete-uploads.input.dto';
import { AttachmentOutputDto } from '../../dto/outputs/attachment.output.dto';

const ATTACHMENT_LIMIT = 10;

@Injectable()
export class CompleteUploadsUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
    @Inject(EXTRACTION_RESULT_REPOSITORY) private readonly extractionResultRepository: IExtractionResultRepository,
    private readonly graphileWorkerService: GraphileWorkerService,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CompleteUploadsInputDto): Promise<AttachmentOutputDto[]> {
    if (input.files.length === 0) {
      return [];
    }
    const sessionId = input.files[0]!.sessionId;
    const count = await this.attachmentRepository.countBySessionIdForUpdate(
      sessionId,
    );
    const newCount = count + input.files.length;
    if (newCount > ATTACHMENT_LIMIT) {
      throw new ConflictException({
        message: 'Attachment limit exceeded',
        errorCode: 'ATTACHMENT_LIMIT_EXCEEDED',
      });
    }

    const attachments: Attachment[] = [];
    for (const file of input.files) {
      const attachment = Attachment.create({
        sessionId: file.sessionId,
        matchId: file.matchId,
        scope: file.scope,
        type: file.type,
        s3Key: file.uploadId,
        contentType: file.contentType,
        size: file.size,
        width: file.width,
        height: file.height,
        originalFileName: file.originalFileName,
      });
      attachments.push(attachment);
    }
    await this.attachmentRepository.saveMany(attachments);

    for (const attachment of attachments) {
      if (
        attachment.type === AttachmentType.LOL_RESULT_SCREEN &&
        attachment.matchId
      ) {
        const extractionResult = ExtractionResult.create({
          attachmentId: attachment.id,
          matchId: attachment.matchId,
        });
        await this.extractionResultRepository.save(extractionResult);
        await this.graphileWorkerService.addJob('lol_endscreen_extract', {
          attachmentId: attachment.id,
          matchId: attachment.matchId,
        });
      }
    }

    return attachments.map((a) => AttachmentMapper.toDto(a));
  }
}
