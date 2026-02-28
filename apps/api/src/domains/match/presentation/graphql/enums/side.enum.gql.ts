import { registerEnumType } from '@nestjs/graphql';
import { Side } from '@domains/match/domain/enums/side.enum';

registerEnumType(Side, {
  name: 'Side',
  description: '진영',
});
