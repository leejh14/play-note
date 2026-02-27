import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export class TeamPresetMemberOutputDto {
  readonly id: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane: Lane;

  constructor(props: {
    id: string;
    friendId: string;
    team: Team;
    lane: Lane;
  }) {
    this.id = props.id;
    this.friendId = props.friendId;
    this.team = props.team;
    this.lane = props.lane;
  }
}
