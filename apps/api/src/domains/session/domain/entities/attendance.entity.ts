import { BaseEntity, BaseEntityProps } from '@shared/domain/base-entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';

export interface CreateAttendanceProps {
  readonly sessionId: string;
  readonly friendId: string;
}

export interface AttendanceReconstituteProps extends BaseEntityProps {
  readonly sessionId: string;
  readonly friendId: string;
  readonly status: AttendanceStatus;
}

export class Attendance extends BaseEntity {
  private readonly _sessionId: string;
  private readonly _friendId: string;
  private _status: AttendanceStatus;

  private constructor(props: AttendanceReconstituteProps) {
    super(props);
    this._sessionId = props.sessionId;
    this._friendId = props.friendId;
    this._status = props.status;
  }

  static create(props: CreateAttendanceProps): Attendance {
    const now = new Date();
    const id = BaseEntity.generateId();

    return new Attendance({
      id,
      sessionId: props.sessionId,
      friendId: props.friendId,
      status: AttendanceStatus.UNDECIDED,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AttendanceReconstituteProps): Attendance {
    return new Attendance(props);
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get friendId(): string {
    return this._friendId;
  }

  get status(): AttendanceStatus {
    return this._status;
  }

  setStatus(status: AttendanceStatus): void {
    this._status = status;
    this.touch();
  }
}
