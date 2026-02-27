import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { MATCH_REPOSITORY } from '@domains/match/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { SetLaneInputDto } from '../../dto/inputs/set-lane.input.dto';

@Injectable()
export class SetLaneUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepository: IMatchRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: SetLaneInputDto): Promise<{ id: string }> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      throw new NotFoundException({
        message: 'Match not found',
        errorCode: 'MATCH_NOT_FOUND',
      });
    }
    match.setLane(input.friendId, input.lane);
    await this.matchRepository.save(match);
    return { id: match.id };
  }
}
