import { BaseEntityProps } from '@shared/domain/base-entity';
import { AggregateRoot } from '@shared/domain/aggregate-root';
import { ContentType } from '../enums/content-type.enum';
import { SessionStatus } from '../enums/session-status.enum';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';
import { Attendance } from '../entities/attendance.entity';
import { TeamPresetMember } from '../entities/team-preset-member.entity';
import { SessionToken } from '../value-objects/session-token.vo';
import { InvalidStateTransitionException } from '../exceptions/invalid-state-transition.exception';
import { SessionReadonlyException } from '../exceptions/session-readonly.exception';
import { SessionLockedException } from '../exceptions/session-locked.exception';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';

export interface CreateSessionProps {
  readonly contentType: ContentType;
  readonly title?: string | null;
  readonly startsAt: Date;
  readonly activeFriendIds: string[];
}

export interface SessionReconstituteProps extends BaseEntityProps {
  readonly contentType: ContentType;
  readonly title: string | null;
  readonly startsAt: Date;
  readonly status: SessionStatus;
  readonly editorToken: string;
  readonly adminToken: string;
  readonly isAdminUnlocked: boolean;
  readonly attendances: Attendance[];
  readonly teamPresetMembers: TeamPresetMember[];
}

export interface UpdateSessionInfoProps {
  readonly title?: string | null;
  readonly startsAt?: Date;
}

export interface SetTeamMemberProps {
  readonly team: Team;
  readonly lane?: Lane;
}

export interface BulkSetTeamsAssignment {
  readonly friendId: string;
  readonly team: Team;
  readonly lane?: Lane;
}

export class Session extends AggregateRoot {
  private _contentType: ContentType;
  private _title: string | null;
  private _startsAt: Date;
  private _status: SessionStatus;
  private readonly _editorToken: string;
  private readonly _adminToken: string;
  private _isAdminUnlocked: boolean;
  private readonly _attendances: Attendance[] = [];
  private readonly _teamPresetMembers: TeamPresetMember[] = [];

  private constructor(props: SessionReconstituteProps) {
    super(props);
    this._contentType = props.contentType;
    this._title = props.title;
    this._startsAt = props.startsAt;
    this._status = props.status;
    this._editorToken = props.editorToken;
    this._adminToken = props.adminToken;
    this._isAdminUnlocked = props.isAdminUnlocked;
    this._attendances.push(...props.attendances);
    this._teamPresetMembers.push(...props.teamPresetMembers);
  }

  static create(props: CreateSessionProps): Session {
    const now = new Date();
    const id = AggregateRoot.generateId();
    const editorToken = SessionToken.generate().value;
    const adminToken = SessionToken.generate().value;

    const attendances = props.activeFriendIds.map((friendId) =>
      Attendance.create({
        sessionId: id,
        friendId,
      }),
    );

    return new Session({
      id,
      contentType: props.contentType,
      title: props.title?.trim() ?? null,
      startsAt: props.startsAt,
      status: SessionStatus.SCHEDULED,
      editorToken,
      adminToken,
      isAdminUnlocked: false,
      attendances,
      teamPresetMembers: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SessionReconstituteProps): Session {
    return new Session(props);
  }

  get contentType(): ContentType {
    return this._contentType;
  }

  get title(): string | null {
    return this._title;
  }

  get startsAt(): Date {
    return this._startsAt;
  }

  get status(): SessionStatus {
    return this._status;
  }

  get editorToken(): string {
    return this._editorToken;
  }

  get adminToken(): string {
    return this._adminToken;
  }

  get isAdminUnlocked(): boolean {
    return this._isAdminUnlocked;
  }

  confirm(): void {
    if (this._status !== SessionStatus.SCHEDULED) {
      throw new InvalidStateTransitionException({
        message: 'Can only confirm a scheduled session',
      });
    }
    this._status = SessionStatus.CONFIRMED;
    this.touch();
  }

  markDone(): void {
    if (this._status !== SessionStatus.CONFIRMED) {
      throw new InvalidStateTransitionException({
        message: 'Can only mark done a confirmed session',
      });
    }
    this._status = SessionStatus.DONE;
    this.touch();
  }

  reopen(): void {
    if (this._status !== SessionStatus.DONE) {
      throw new InvalidStateTransitionException({
        message: 'Can only reopen a done session',
      });
    }
    this._status = SessionStatus.CONFIRMED;
    this.touch();
  }

  updateInfo(props: UpdateSessionInfoProps): void {
    if (this._status === SessionStatus.DONE) {
      throw new SessionReadonlyException();
    }
    if (props.title !== undefined) {
      this._title = props.title?.trim() ?? null;
    }
    if (props.startsAt !== undefined) {
      this._startsAt = props.startsAt;
    }
    this.touch();
  }

  setAttendance(friendId: string, status: AttendanceStatus): void {
    const attendance = this._attendances.find((a) => a.friendId === friendId);
    if (attendance) {
      attendance.setStatus(status);
      this.touch();
    }
  }

  getAttendances(): Attendance[] {
    return [...this._attendances];
  }

  setTeamMember(friendId: string, props: SetTeamMemberProps): void {
    const existing = this._teamPresetMembers.find((m) => m.friendId === friendId);
    if (existing) {
      existing.changeTeam(props.team);
      existing.changeLane(props.lane ?? Lane.UNKNOWN);
    } else {
      const member = TeamPresetMember.create({
        sessionId: this.id,
        friendId,
        team: props.team,
        lane: props.lane,
      });
      this._teamPresetMembers.push(member);
    }
    this.touch();
  }

  bulkSetTeams(assignments: BulkSetTeamsAssignment[]): void {
    for (const a of assignments) {
      this.setTeamMember(a.friendId, {
        team: a.team,
        lane: a.lane,
      });
    }
  }

  removeTeamMember(friendId: string): void {
    const index = this._teamPresetMembers.findIndex((m) => m.friendId === friendId);
    if (index >= 0) {
      this._teamPresetMembers.splice(index, 1);
      this.touch();
    }
  }

  getTeamPresetMembers(): TeamPresetMember[] {
    return [...this._teamPresetMembers];
  }

  getTeamPresetByTeam(team: Team): TeamPresetMember[] {
    return this._teamPresetMembers.filter((m) => m.team === team);
  }

  checkStructureChangeAllowed(attachmentCount: number): void {
    const effectiveLocked =
      attachmentCount > 0 && !this._isAdminUnlocked;
    if (effectiveLocked) {
      throw new SessionLockedException();
    }
  }

  adminUnlock(): void {
    this._isAdminUnlocked = true;
    this.touch();
  }

  adminRelock(): void {
    this._isAdminUnlocked = false;
    this.touch();
  }

  validateToken(token: string): 'editor' | 'admin' {
    if (token === this._editorToken) return 'editor';
    if (token === this._adminToken) return 'admin';
    throw new UnauthorizedException({ message: 'Invalid session token' });
  }
}
