import { registerEnumType } from '@nestjs/graphql';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';

registerEnumType(SessionStatus, {
  name: 'SessionStatus',
  description: '세션 상태',
});
