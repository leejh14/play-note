import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { SetTeamMemberInputDto } from '../../dto/inputs/set-team-member.input.dto';

@Injectable()
export class SetTeamMemberUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: SetTeamMemberInputDto): Promise<{ id: string }> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }
    session.checkStructureChangeAllowed();
    if (input.team === null) {
      session.removeTeamMember(input.friendId);
    } else {
      session.setTeamMember(input.friendId, {
        team: input.team,
        lane: input.lane,
      });
    }
    await this.sessionRepository.save(session);
    return { id: session.id };
  }
}
