import { Injectable, Inject } from '@nestjs/common';
import { IAttachmentContextAcl } from '@domains/session/application/acl/attachment-context.acl.interface';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';

@Injectable()
export class AttachmentContextAcl implements IAttachmentContextAcl {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
  ) {}

  async countBySessionId(sessionId: string): Promise<number> {
    return this.attachmentRepository.countBySessionId(sessionId);
  }
}
