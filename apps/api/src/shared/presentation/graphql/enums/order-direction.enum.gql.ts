import { registerEnumType } from '@nestjs/graphql';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(OrderDirection, {
  name: 'OrderDirection',
  description: '정렬 방향',
});
