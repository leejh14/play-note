import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export class SetTeamMemberInputDto {
  readonly sessionId: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane?: Lane;

  constructor(props: {
    sessionId: string;
    friendId: string;
    team: Team;
    lane?: Lane;
  }) {
    this.sessionId = props.sessionId;
    this.friendId = props.friendId;
    this.team = props.team;
    this.lane = props.lane;
  }
}
