import { registerEnumType } from '@nestjs/graphql';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';

registerEnumType(ContentType, {
  name: 'ContentType',
  description: '세션 콘텐츠 타입',
});
