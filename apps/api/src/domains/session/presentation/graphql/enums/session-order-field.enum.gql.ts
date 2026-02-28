import { registerEnumType } from '@nestjs/graphql';

export enum SessionOrderField {
  DATE_PROXIMITY = 'DATE_PROXIMITY',
  STARTS_AT = 'STARTS_AT',
  STATUS_PRIORITY = 'STATUS_PRIORITY',
  CREATED_AT = 'CREATED_AT',
}

registerEnumType(SessionOrderField, {
  name: 'SessionOrderField',
  description: '세션 정렬 필드',
});
