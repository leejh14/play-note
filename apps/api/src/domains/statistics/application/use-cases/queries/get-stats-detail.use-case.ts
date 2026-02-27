import { Injectable, Inject } from '@nestjs/common';
import {
  IMatchStatsContextAcl,
  MatchStatsRawDto,
} from '../../acl/match-stats-context.acl.interface';
import { IFriendStatsContextAcl } from '../../acl/friend-stats-context.acl.interface';
import {
  MATCH_STATS_CONTEXT_ACL,
  FRIEND_STATS_CONTEXT_ACL,
} from '@domains/statistics/domain/constants';
import { Lane } from '@shared/domain/enums/lane.enum';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { StatsDetailQueryInputDto } from '../../dto/inputs/stats-detail-query.input.dto';
import {
  StatsDetailOutputDto,
  StatsDetailSummaryDto,
  LaneDistributionDto,
  TopChampionDto,
} from '../../dto/outputs/stats-detail.output.dto';

function computeMemberWon(match: MatchStatsRawDto, team: string): boolean {
  const teamAWon = match.winnerSide === match.teamASide;
  return (team === 'A' && teamAWon) || (team === 'B' && !teamAWon);
}

@Injectable()
export class GetStatsDetailUseCase {
  constructor(
    @Inject(MATCH_STATS_CONTEXT_ACL) private readonly matchStatsAcl: IMatchStatsContextAcl,
    @Inject(FRIEND_STATS_CONTEXT_ACL) private readonly friendStatsAcl: IFriendStatsContextAcl,
  ) {}

  async execute(
    input: StatsDetailQueryInputDto,
  ): Promise<StatsDetailOutputDto> {
    const friends = await this.friendStatsAcl.getActiveFriends({
      includeArchived: input.includeArchived,
    });
    const friend = friends.find((f) => f.id === input.friendId);
    if (!friend) {
      throw new NotFoundException({
        message: 'Friend not found',
        errorCode: 'FRIEND_NOT_FOUND',
      });
    }

    const matches = await this.matchStatsAcl.getConfirmedMatchStats({
      friendId: input.friendId,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    let wins = 0;
    let losses = 0;
    const laneCounts = new Map<Lane, number>();
    const championStats = new Map<
      string,
      { wins: number; games: number }
    >();

    for (const match of matches) {
      const member = match.members.find((m) => m.friendId === input.friendId);
      if (!member) continue;

      const won = computeMemberWon(match, member.team);
      if (won) wins++;
      else losses++;

      const lane = member.lane as Lane;
      laneCounts.set(lane, (laneCounts.get(lane) ?? 0) + 1);

      const champ = member.champion ?? 'Unknown';
      const existing = championStats.get(champ) ?? { wins: 0, games: 0 };
      championStats.set(champ, {
        wins: existing.wins + (won ? 1 : 0),
        games: existing.games + 1,
      });
    }

    const totalMatches = wins + losses;
    const winRate =
      totalMatches > 0 ? Math.round((wins / totalMatches) * 1000) / 1000 : null;

    let topLane: Lane | null = null;
    let maxLaneCount = 0;
    for (const [lane, count] of laneCounts) {
      if (count > maxLaneCount && lane !== Lane.UNKNOWN) {
        maxLaneCount = count;
        topLane = lane;
      }
    }

    const laneDistribution = Array.from(laneCounts.entries())
      .filter(([lane]) => lane !== Lane.UNKNOWN)
      .map(([lane, playCount]) => new LaneDistributionDto({ lane, playCount }))
      .sort((a, b) => b.playCount - a.playCount);

    const topChampions = Array.from(championStats.entries())
      .map(([champion, { wins: w, games }]) => ({
        champion,
        wins: w,
        games,
        winRate: games > 0 ? Math.round((w / games) * 1000) / 1000 : 0,
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 10)
      .map(
        (c) =>
          new TopChampionDto({
            champion: c.champion,
            wins: c.wins,
            games: c.games,
            winRate: c.winRate,
          }),
      );

    const summary = new StatsDetailSummaryDto({
      winRate,
      totalMatches,
      topLane,
    });

    return new StatsDetailOutputDto({
      summary,
      laneDistribution,
      topChampions,
    });
  }
}
