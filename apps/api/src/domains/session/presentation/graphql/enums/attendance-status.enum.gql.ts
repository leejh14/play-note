import { registerEnumType } from '@nestjs/graphql';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
  description: '참가 상태',
});
