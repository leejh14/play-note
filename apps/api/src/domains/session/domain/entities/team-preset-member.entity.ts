import { BaseEntity, BaseEntityProps } from '@shared/domain/base-entity';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export interface CreateTeamPresetMemberProps {
  readonly sessionId: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane?: Lane;
}

export interface TeamPresetMemberReconstituteProps extends BaseEntityProps {
  readonly sessionId: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane: Lane;
}

export class TeamPresetMember extends BaseEntity {
  private readonly _sessionId: string;
  private readonly _friendId: string;
  private _team: Team;
  private _lane: Lane;

  private constructor(props: TeamPresetMemberReconstituteProps) {
    super(props);
    this._sessionId = props.sessionId;
    this._friendId = props.friendId;
    this._team = props.team;
    this._lane = props.lane;
  }

  static create(props: CreateTeamPresetMemberProps): TeamPresetMember {
    const now = new Date();
    const id = BaseEntity.generateId();

    return new TeamPresetMember({
      id,
      sessionId: props.sessionId,
      friendId: props.friendId,
      team: props.team,
      lane: props.lane ?? Lane.UNKNOWN,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TeamPresetMemberReconstituteProps): TeamPresetMember {
    return new TeamPresetMember(props);
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get friendId(): string {
    return this._friendId;
  }

  get team(): Team {
    return this._team;
  }

  get lane(): Lane {
    return this._lane;
  }

  changeTeam(team: Team): void {
    this._team = team;
    this.touch();
  }

  changeLane(lane: Lane): void {
    this._lane = lane;
    this.touch();
  }
}
