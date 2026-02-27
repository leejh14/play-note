import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export class MatchTeamMemberOutputDto {
  readonly id: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane: Lane;
  readonly champion: string | null;

  constructor(props: {
    id: string;
    friendId: string;
    team: Team;
    lane: Lane;
    champion: string | null;
  }) {
    this.id = props.id;
    this.friendId = props.friendId;
    this.team = props.team;
    this.lane = props.lane;
    this.champion = props.champion;
  }
}
