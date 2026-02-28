import { registerEnumType } from '@nestjs/graphql';
import { MatchStatus } from '@domains/match/domain/enums/match-status.enum';

registerEnumType(MatchStatus, {
  name: 'MatchStatus',
  description: '매치 상태',
});
