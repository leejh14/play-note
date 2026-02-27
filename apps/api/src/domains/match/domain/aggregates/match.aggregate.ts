import { BaseEntityProps } from '@shared/domain/base-entity';
import { AggregateRoot } from '@shared/domain/aggregate-root';
import { MatchStatus } from '../enums/match-status.enum';
import { Side } from '../enums/side.enum';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';
import { MatchTeamMember } from '../entities/match-team-member.entity';
import { ConfirmedMatchUndeletableException } from '../exceptions/confirmed-match-undeletable.exception';

export interface CreateMatchTeamMemberInput {
  readonly friendId: string;
  readonly team: Team;
  readonly lane?: Lane;
}

export interface CreateMatchProps {
  readonly sessionId: string;
  readonly matchNo: number;
  readonly teamMembers: CreateMatchTeamMemberInput[];
}

export interface MatchReconstituteProps extends BaseEntityProps {
  readonly sessionId: string;
  readonly matchNo: number;
  readonly status: MatchStatus;
  readonly winnerSide: Side;
  readonly teamASide: Side;
  readonly isConfirmed: boolean;
  readonly teamMembers: MatchTeamMember[];
}

export interface ConfirmResultProps {
  readonly winnerSide: Side;
  readonly teamASide: Side;
}

export class Match extends AggregateRoot {
  private readonly _sessionId: string;
  private readonly _matchNo: number;
  private _status: MatchStatus;
  private _winnerSide: Side;
  private _teamASide: Side;
  private _isConfirmed: boolean;
  private readonly _teamMembers: MatchTeamMember[] = [];

  private constructor(props: MatchReconstituteProps) {
    super(props);
    this._sessionId = props.sessionId;
    this._matchNo = props.matchNo;
    this._status = props.status;
    this._winnerSide = props.winnerSide;
    this._teamASide = props.teamASide;
    this._isConfirmed = props.isConfirmed;
    this._teamMembers.push(...props.teamMembers);
  }

  static create(props: CreateMatchProps): Match {
    const now = new Date();
    const id = AggregateRoot.generateId();

    const teamMembers = props.teamMembers.map((m) =>
      MatchTeamMember.create({
        matchId: id,
        friendId: m.friendId,
        team: m.team,
        lane: m.lane,
      }),
    );

    return new Match({
      id,
      sessionId: props.sessionId,
      matchNo: props.matchNo,
      status: MatchStatus.DRAFT,
      winnerSide: Side.UNKNOWN,
      teamASide: Side.UNKNOWN,
      isConfirmed: false,
      teamMembers,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MatchReconstituteProps): Match {
    return new Match(props);
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get matchNo(): number {
    return this._matchNo;
  }

  get status(): MatchStatus {
    return this._status;
  }

  get winnerSide(): Side {
    return this._winnerSide;
  }

  get teamASide(): Side {
    return this._teamASide;
  }

  get isConfirmed(): boolean {
    return this._isConfirmed;
  }

  setLane(friendId: string, lane: Lane): void {
    const member = this._teamMembers.find((m) => m.friendId === friendId);
    if (member) {
      member.changeLane(lane);
      this.touch();
    }
  }

  setChampion(friendId: string, champion: string | null): void {
    const member = this._teamMembers.find((m) => m.friendId === friendId);
    if (member) {
      member.changeChampion(champion);
      this.touch();
    }
  }

  confirmResult(props: ConfirmResultProps): void {
    this._winnerSide = props.winnerSide;
    this._teamASide = props.teamASide;
    this._status = MatchStatus.COMPLETED;
    this._isConfirmed = true;
    this.touch();
  }

  getTeamMembers(): MatchTeamMember[] {
    return [...this._teamMembers];
  }

  getMemberByFriendId(friendId: string): MatchTeamMember | null {
    return this._teamMembers.find((m) => m.friendId === friendId) ?? null;
  }

  ensureDeletable(): void {
    if (this._isConfirmed) {
      throw new ConfirmedMatchUndeletableException();
    }
  }
}
