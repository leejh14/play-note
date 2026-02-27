import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { MATCH_REPOSITORY } from '@domains/match/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { SetChampionInputDto } from '../../dto/inputs/set-champion.input.dto';

@Injectable()
export class SetChampionUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepository: IMatchRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: SetChampionInputDto): Promise<{ id: string }> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      throw new NotFoundException({
        message: 'Match not found',
        errorCode: 'MATCH_NOT_FOUND',
      });
    }
    match.setChampion(input.friendId, input.champion);
    await this.matchRepository.save(match);
    return { id: match.id };
  }
}
