import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { Match } from '@domains/match/domain/aggregates/match.aggregate';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { MATCH_REPOSITORY, SESSION_CONTEXT_ACL } from '@domains/match/domain/constants';
import { ISessionContextAcl } from '../../acl/session-context.acl.interface';
import { CreateMatchFromPresetInputDto } from '../../dto/inputs/create-match-from-preset.input.dto';

@Injectable()
export class CreateMatchFromPresetUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepository: IMatchRepository,
    @Inject(SESSION_CONTEXT_ACL) private readonly sessionContextAcl: ISessionContextAcl,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CreateMatchFromPresetInputDto): Promise<{ id: string }> {
    await this.sessionContextAcl.checkStructureChangeAllowed(input.sessionId);
    const teamPreset = await this.sessionContextAcl.getTeamPreset(
      input.sessionId,
    );
    const matchNo = await this.matchRepository.getNextMatchNo(input.sessionId);
    const match = Match.create({
      sessionId: input.sessionId,
      matchNo,
      teamMembers: teamPreset.map((m) => ({
        friendId: m.friendId,
        team: m.team,
        lane: m.lane,
      })),
    });
    await this.matchRepository.save(match);
    return { id: match.id };
  }
}
