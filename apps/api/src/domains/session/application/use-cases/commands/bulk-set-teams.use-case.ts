import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { SESSION_ERROR_CODES } from '@domains/session/domain/constants';
import { ConflictException } from '@shared/exceptions/conflict.exception';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { BulkSetTeamsInputDto } from '../../dto/inputs/bulk-set-teams.input.dto';

@Injectable()
export class BulkSetTeamsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: BulkSetTeamsInputDto): Promise<{ id: string }> {
    const session = await this.sessionRepository.findByIdForUpdate(input.sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }
    if (session.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new ConflictException({
        message: 'Session has been updated by another user',
        errorCode: SESSION_ERROR_CODES.SESSION_CONFLICT,
      });
    }
    session.checkStructureChangeAllowed();
    session.bulkSetTeams(
      input.assignments.map((a) => ({
        friendId: a.friendId,
        team: a.team,
        lane: a.lane,
      })),
    );
    await this.sessionRepository.save(session);
    return { id: session.id };
  }
}
