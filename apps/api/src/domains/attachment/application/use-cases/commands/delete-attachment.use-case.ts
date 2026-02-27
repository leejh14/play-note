import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { GraphileWorkerService } from '@shared/infrastructure/worker/graphile-worker.service';
import { AttachmentIdInputDto } from '../../dto/inputs/attachment-id.input.dto';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
    private readonly graphileWorkerService: GraphileWorkerService,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: AttachmentIdInputDto): Promise<void> {
    const attachment = await this.attachmentRepository.findById(
      input.attachmentId,
    );
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errorCode: 'ATTACHMENT_NOT_FOUND',
      });
    }
    const s3Key = attachment.s3Key;
    await this.attachmentRepository.delete(attachment);

    await this.graphileWorkerService.addJob('cleanup_s3_objects', {
      s3Keys: [s3Key],
    });
  }
}
