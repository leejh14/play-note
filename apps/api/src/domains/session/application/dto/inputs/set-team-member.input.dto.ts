import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export class SetTeamMemberInputDto {
  readonly sessionId: string;
  readonly friendId: string;
  readonly team: Team | null;
  readonly lane?: Lane;
  readonly expectedUpdatedAt: Date;

  constructor(props: {
    sessionId: string;
    friendId: string;
    team?: Team | null;
    lane?: Lane;
    expectedUpdatedAt: Date;
  }) {
    this.sessionId = props.sessionId;
    this.friendId = props.friendId;
    this.team = props.team ?? null;
    this.lane = props.lane;
    this.expectedUpdatedAt = props.expectedUpdatedAt;
  }
}
