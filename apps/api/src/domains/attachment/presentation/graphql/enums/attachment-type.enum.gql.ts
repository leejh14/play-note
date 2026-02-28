import { registerEnumType } from '@nestjs/graphql';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

registerEnumType(AttachmentType, {
  name: 'AttachmentType',
  description: '첨부 타입',
});
