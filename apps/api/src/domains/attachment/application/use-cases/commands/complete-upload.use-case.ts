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
import { CompleteUploadInputDto } from '../../dto/inputs/complete-upload.input.dto';
import { AttachmentOutputDto } from '../../dto/outputs/attachment.output.dto';

const ATTACHMENT_LIMIT = 10;

@Injectable()
export class CompleteUploadUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
    @Inject(EXTRACTION_RESULT_REPOSITORY) private readonly extractionResultRepository: IExtractionResultRepository,
    private readonly graphileWorkerService: GraphileWorkerService,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CompleteUploadInputDto): Promise<AttachmentOutputDto> {
    const count = await this.attachmentRepository.countBySessionIdForUpdate(
      input.sessionId,
    );
    if (count + 1 > ATTACHMENT_LIMIT) {
      throw new ConflictException({
        message: 'Attachment limit exceeded',
        errorCode: 'ATTACHMENT_LIMIT_EXCEEDED',
      });
    }
    const attachment = Attachment.create({
      sessionId: input.sessionId,
      matchId: input.matchId,
      scope: input.scope,
      type: input.type,
      s3Key: input.uploadId,
      contentType: input.contentType,
      size: input.size,
      width: input.width,
      height: input.height,
      originalFileName: input.originalFileName,
    });
    await this.attachmentRepository.save(attachment);

    if (input.type === AttachmentType.LOL_RESULT_SCREEN && input.matchId) {
      const extractionResult = ExtractionResult.create({
        attachmentId: attachment.id,
        matchId: input.matchId,
      });
      await this.extractionResultRepository.save(extractionResult);
      await this.graphileWorkerService.addJob('lol_endscreen_extract', {
        attachmentId: attachment.id,
        matchId: input.matchId,
      });
    }

    return AttachmentMapper.toDto(attachment);
  }
}
