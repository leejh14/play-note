import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';

export class SetAttendanceInputDto {
  readonly sessionId: string;
  readonly friendId: string;
  readonly status: AttendanceStatus;
  readonly expectedUpdatedAt: Date;

  constructor(props: {
    sessionId: string;
    friendId: string;
    status: AttendanceStatus;
    expectedUpdatedAt: Date;
  }) {
    this.sessionId = props.sessionId;
    this.friendId = props.friendId;
    this.status = props.status;
    this.expectedUpdatedAt = props.expectedUpdatedAt;
  }
}
