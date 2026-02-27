import { Lane } from '@shared/domain/enums/lane.enum';

export class SetLaneInputDto {
  readonly matchId: string;
  readonly friendId: string;
  readonly lane: Lane;

  constructor(props: { matchId: string; friendId: string; lane: Lane }) {
    this.matchId = props.matchId;
    this.friendId = props.friendId;
    this.lane = props.lane;
  }
}
