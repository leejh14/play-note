import { registerEnumType } from '@nestjs/graphql';
import { Lane } from '@shared/domain/enums/lane.enum';

registerEnumType(Lane, {
  name: 'Lane',
  description: '라인',
});
