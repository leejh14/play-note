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
import { StatsQueryInputDto } from '../../dto/inputs/stats-query.input.dto';
import { StatsOverviewOutputDto } from '../../dto/outputs/stats-overview.output.dto';
import { FriendStatsSummaryDto } from '../../dto/outputs/friend-stats-summary.dto';

function computeMemberWon(match: MatchStatsRawDto, team: string): boolean {
  const teamAWon = match.winnerSide === match.teamASide;
  return (team === 'A' && teamAWon) || (team === 'B' && !teamAWon);
}

function computeFriendStats(
  friendId: string,
  displayName: string,
  matches: MatchStatsRawDto[],
): FriendStatsSummaryDto {
  let wins = 0;
  let losses = 0;
  const laneCounts = new Map<Lane, number>();

  for (const match of matches) {
    const member = match.members.find((m) => m.friendId === friendId);
    if (!member) continue;

    const won = computeMemberWon(match, member.team);
    if (won) wins++;
    else losses++;

    const lane = member.lane as Lane;
    laneCounts.set(lane, (laneCounts.get(lane) ?? 0) + 1);
  }

  const totalMatches = wins + losses;
  const winRate =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 1000) / 1000 : null;

  let topLane: Lane | null = null;
  let maxCount = 0;
  for (const [lane, count] of laneCounts) {
    if (count > maxCount && lane !== Lane.UNKNOWN) {
      maxCount = count;
      topLane = lane;
    }
  }

  return new FriendStatsSummaryDto({
    friendId,
    displayName,
    winRate,
    wins,
    losses,
    totalMatches,
    topLane,
  });
}

@Injectable()
export class GetStatsOverviewUseCase {
  constructor(
    @Inject(MATCH_STATS_CONTEXT_ACL) private readonly matchStatsAcl: IMatchStatsContextAcl,
    @Inject(FRIEND_STATS_CONTEXT_ACL) private readonly friendStatsAcl: IFriendStatsContextAcl,
  ) {}

  async execute(
    input: StatsQueryInputDto,
  ): Promise<StatsOverviewOutputDto> {
    const [friends, matches] = await Promise.all([
      this.friendStatsAcl.getActiveFriends({
        includeArchived: input.includeArchived,
      }),
      this.matchStatsAcl.getConfirmedMatchStats({
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    ]);

    const friendStats = friends.map((f) =>
      computeFriendStats(f.id, f.displayName, matches),
    );

    friendStats.sort((a, b) => {
      const ar = a.winRate ?? -1;
      const br = b.winRate ?? -1;
      if (br !== ar) return br - ar;
      if (b.totalMatches !== a.totalMatches)
        return b.totalMatches - a.totalMatches;
      return a.displayName.localeCompare(b.displayName);
    });

    return new StatsOverviewOutputDto({ friends: friendStats });
  }
}
