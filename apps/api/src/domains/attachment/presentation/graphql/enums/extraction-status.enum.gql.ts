import { registerEnumType } from '@nestjs/graphql';
import { ExtractionStatus } from '@domains/attachment/domain/enums/extraction-status.enum';

registerEnumType(ExtractionStatus, {
  name: 'ExtractionStatus',
  description: '추출 상태',
});
