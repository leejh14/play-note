import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';

export class AttendanceOutputDto {
  readonly id: string;
  readonly friendId: string;
  readonly status: AttendanceStatus;

  constructor(props: {
    id: string;
    friendId: string;
    status: AttendanceStatus;
  }) {
    this.id = props.id;
    this.friendId = props.friendId;
    this.status = props.status;
  }
}
