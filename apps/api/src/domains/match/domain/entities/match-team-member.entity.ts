import { BaseEntity, BaseEntityProps } from '@shared/domain/base-entity';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export interface CreateMatchTeamMemberProps {
  readonly matchId: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane?: Lane;
}

export interface MatchTeamMemberReconstituteProps extends BaseEntityProps {
  readonly matchId: string;
  readonly friendId: string;
  readonly team: Team;
  readonly lane: Lane;
  readonly champion: string | null;
}

export class MatchTeamMember extends BaseEntity {
  private readonly _matchId: string;
  private readonly _friendId: string;
  private readonly _team: Team;
  private _lane: Lane;
  private _champion: string | null;

  private constructor(props: MatchTeamMemberReconstituteProps) {
    super(props);
    this._matchId = props.matchId;
    this._friendId = props.friendId;
    this._team = props.team;
    this._lane = props.lane;
    this._champion = props.champion;
  }

  static create(props: CreateMatchTeamMemberProps): MatchTeamMember {
    const now = new Date();
    const id = BaseEntity.generateId();

    return new MatchTeamMember({
      id,
      matchId: props.matchId,
      friendId: props.friendId,
      team: props.team,
      lane: props.lane ?? Lane.UNKNOWN,
      champion: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MatchTeamMemberReconstituteProps): MatchTeamMember {
    return new MatchTeamMember(props);
  }

  get matchId(): string {
    return this._matchId;
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

  get champion(): string | null {
    return this._champion;
  }

  changeLane(lane: Lane): void {
    this._lane = lane;
    this.touch();
  }

  changeChampion(champion: string | null): void {
    this._champion = champion?.trim() ?? null;
    this.touch();
  }
}
