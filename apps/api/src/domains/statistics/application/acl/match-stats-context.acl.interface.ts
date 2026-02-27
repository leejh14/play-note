import { Lane } from '@shared/domain/enums/lane.enum';

export interface MatchStatsMemberRawDto {
  readonly friendId: string;
  readonly team: string;
  readonly lane: Lane;
  readonly champion: string | null;
}

export interface MatchStatsRawDto {
  readonly matchId: string;
  readonly sessionId: string;
  readonly winnerSide: string;
  readonly teamASide: string;
  readonly members: MatchStatsMemberRawDto[];
}

export interface IMatchStatsContextAcl {
  getConfirmedMatchStats(input: {
    friendId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MatchStatsRawDto[]>;
}
