import { Lane } from '@shared/domain/enums/lane.enum';

export class FriendStatsSummaryDto {
  readonly friendId: string;
  readonly displayName: string;
  readonly winRate: number | null;
  readonly wins: number;
  readonly losses: number;
  readonly totalMatches: number;
  readonly topLane: Lane | null;

  constructor(props: {
    friendId: string;
    displayName: string;
    winRate: number | null;
    wins: number;
    losses: number;
    totalMatches: number;
    topLane: Lane | null;
  }) {
    this.friendId = props.friendId;
    this.displayName = props.displayName;
    this.winRate = props.winRate;
    this.wins = props.wins;
    this.losses = props.losses;
    this.totalMatches = props.totalMatches;
    this.topLane = props.topLane;
  }
}
