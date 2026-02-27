import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';

export class SetAttendanceInputDto {
  readonly sessionId: string;
  readonly friendId: string;
  readonly status: AttendanceStatus;

  constructor(props: {
    sessionId: string;
    friendId: string;
    status: AttendanceStatus;
  }) {
    this.sessionId = props.sessionId;
    this.friendId = props.friendId;
    this.status = props.status;
  }
}
