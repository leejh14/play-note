import { Injectable, Inject } from '@nestjs/common';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';

export interface IAttachmentContextAcl {
  countBySessionId(sessionId: string): Promise<number>;
}

@Injectable()
export class AttachmentContextAcl implements IAttachmentContextAcl {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
  ) {}

  async countBySessionId(sessionId: string): Promise<number> {
    return this.attachmentRepository.countBySessionId(sessionId);
  }
}
