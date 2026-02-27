import { Lane } from '@shared/domain/enums/lane.enum';

export class StatsDetailSummaryDto {
  readonly winRate: number | null;
  readonly totalMatches: number;
  readonly topLane: Lane | null;

  constructor(props: {
    winRate: number | null;
    totalMatches: number;
    topLane: Lane | null;
  }) {
    this.winRate = props.winRate;
    this.totalMatches = props.totalMatches;
    this.topLane = props.topLane;
  }
}

export class LaneDistributionDto {
  readonly lane: Lane;
  readonly playCount: number;

  constructor(props: { lane: Lane; playCount: number }) {
    this.lane = props.lane;
    this.playCount = props.playCount;
  }
}

export class TopChampionDto {
  readonly champion: string;
  readonly wins: number;
  readonly games: number;
  readonly winRate: number;

  constructor(props: {
    champion: string;
    wins: number;
    games: number;
    winRate: number;
  }) {
    this.champion = props.champion;
    this.wins = props.wins;
    this.games = props.games;
    this.winRate = props.winRate;
  }
}

export class StatsDetailOutputDto {
  readonly summary: StatsDetailSummaryDto;
  readonly laneDistribution: LaneDistributionDto[];
  readonly topChampions: TopChampionDto[];

  constructor(props: {
    summary: StatsDetailSummaryDto;
    laneDistribution: LaneDistributionDto[];
    topChampions: TopChampionDto[];
  }) {
    this.summary = props.summary;
    this.laneDistribution = props.laneDistribution;
    this.topChampions = props.topChampions;
  }
}
