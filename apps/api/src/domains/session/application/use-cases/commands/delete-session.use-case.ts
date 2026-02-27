import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { GraphileWorkerService } from '@shared/infrastructure/worker/graphile-worker.service';
import { SessionIdInputDto } from '../../dto/inputs/session-id.input.dto';

@Injectable()
export class DeleteSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
    private readonly graphileWorkerService: GraphileWorkerService,
    private readonly em: EntityManager,
  ) {}

  async execute(input: SessionIdInputDto): Promise<void> {
    const s3Keys = await this.em.transactional(async () => {
      const session = await this.sessionRepository.findById(input.sessionId);
      if (!session) {
        throw new NotFoundException({
          message: 'Session not found',
          errorCode: 'SESSION_NOT_FOUND',
        });
      }
      const keys = await this.attachmentRepository.findS3KeysBySessionId(
        input.sessionId,
      );
      await this.sessionRepository.delete(session);
      return keys;
    });

    if (s3Keys.length > 0) {
      await this.graphileWorkerService.addJob('cleanup_s3_objects', {
        s3Keys,
      });
    }
  }
}
