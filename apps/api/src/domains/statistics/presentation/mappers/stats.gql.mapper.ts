import { StatsOverviewOutputDto } from '@domains/statistics/application/dto/outputs/stats-overview.output.dto';
import { StatsDetailOutputDto } from '@domains/statistics/application/dto/outputs/stats-detail.output.dto';
import { StatsOverview } from '@domains/statistics/presentation/graphql/types/stats-overview.gql';
import { FriendStatsSummary } from '@domains/statistics/presentation/graphql/types/friend-stats-summary.gql';
import { StatsDetail } from '@domains/statistics/presentation/graphql/types/stats-detail.gql';
import { LaneDistribution } from '@domains/statistics/presentation/graphql/types/lane-distribution.gql';
import { ChampionStats } from '@domains/statistics/presentation/graphql/types/champion-stats.gql';

export class StatsGqlMapper {
  static toOverviewGql(output: StatsOverviewOutputDto): StatsOverview {
    const gql = new StatsOverview();
    gql.friends = output.friends.map((friend) => {
      const item = new FriendStatsSummary();
      item.friendId = friend.friendId;
      item.winRate = friend.winRate;
      item.wins = friend.wins;
      item.losses = friend.losses;
      item.totalMatches = friend.totalMatches;
      item.topLane = friend.topLane;
      return item;
    });
    return gql;
  }

  static toDetailGql(output: StatsDetailOutputDto, friendId: string): StatsDetail {
    const gql = new StatsDetail();
    gql.friendId = friendId;
    gql.winRate = output.summary.winRate;
    gql.totalMatches = output.summary.totalMatches;
    gql.topLane = output.summary.topLane;
    gql.laneDistribution = output.laneDistribution.map((item) => {
      const lane = new LaneDistribution();
      lane.lane = item.lane;
      lane.playCount = item.playCount;
      return lane;
    });
    gql.topChampions = output.topChampions.map((item) => {
      const champion = new ChampionStats();
      champion.champion = item.champion;
      champion.wins = item.wins;
      champion.games = item.games;
      champion.winRate = item.winRate;
      return champion;
    });
    return gql;
  }
}
