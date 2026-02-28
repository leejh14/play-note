import { registerEnumType } from '@nestjs/graphql';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';

registerEnumType(AttachmentScope, {
  name: 'AttachmentScope',
  description: '첨부 범위',
});
