import { Injectable, Inject } from '@nestjs/common';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { MATCH_REPOSITORY } from '@domains/match/domain/constants';
import { MatchMapper } from '../../mappers/match.mapper';
import { MatchesBySessionInputDto } from '../../dto/inputs/matches-by-session.input.dto';
import { MatchOutputDto } from '../../dto/outputs/match.output.dto';

@Injectable()
export class GetMatchesBySessionUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepository: IMatchRepository,
  ) {}

  async execute(input: MatchesBySessionInputDto): Promise<MatchOutputDto[]> {
    const matches = await this.matchRepository.findBySessionId(input.sessionId);
    return matches.map((m) => MatchMapper.toDto(m));
  }
}
