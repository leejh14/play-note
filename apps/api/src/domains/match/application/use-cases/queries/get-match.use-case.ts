import { Injectable, Inject } from '@nestjs/common';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { MATCH_REPOSITORY } from '@domains/match/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { MatchMapper } from '../../mappers/match.mapper';
import { MatchIdInputDto } from '../../dto/inputs/match-id.input.dto';
import { MatchDetailOutputDto } from '../../dto/outputs/match-detail.output.dto';

@Injectable()
export class GetMatchUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepository: IMatchRepository,
  ) {}

  async execute(input: MatchIdInputDto): Promise<MatchDetailOutputDto> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      throw new NotFoundException({
        message: 'Match not found',
        errorCode: 'MATCH_NOT_FOUND',
      });
    }
    return MatchMapper.toDetailDto(match);
  }
}
