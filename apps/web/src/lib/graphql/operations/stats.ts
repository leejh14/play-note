import { gql } from "@apollo/client";

export const STATS_OVERVIEW_QUERY = gql`
  query StatsOverview($input: StatsOverviewInput) {
    statsOverview(input: $input) {
      friends {
        friendId
        friend {
          id
          displayName
        }
        winRate
        wins
        losses
        totalMatches
        topLane
      }
    }
  }
`;

export const STATS_DETAIL_QUERY = gql`
  query StatsDetail($input: StatsDetailInput!) {
    statsDetail(input: $input) {
      friendId
      friend {
        id
        displayName
        riotGameName
        riotTagLine
      }
      winRate
      totalMatches
      topLane
      laneDistribution {
        lane
        playCount
      }
      topChampions {
        champion
        wins
        games
        winRate
      }
    }
  }
`;
