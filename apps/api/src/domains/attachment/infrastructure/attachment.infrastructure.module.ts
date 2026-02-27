import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AttachmentOrmEntity } from './persistence/attachment.orm-entity';
import { ExtractionResultOrmEntity } from './persistence/extraction-result.orm-entity';
import { MikroAttachmentRepository } from './persistence/mikro-attachment.repository';
import { MikroExtractionResultRepository } from './persistence/mikro-extraction-result.repository';
import { PythonCliExtractionService } from './extraction/python-cli-extraction.service';
import {
  ATTACHMENT_REPOSITORY,
  EXTRACTION_RESULT_REPOSITORY,
  EXTRACTION_SERVICE,
} from '@domains/attachment/domain/constants';

@Module({
  imports: [
    MikroOrmModule.forFeature([AttachmentOrmEntity, ExtractionResultOrmEntity]),
  ],
  providers: [
    { provide: ATTACHMENT_REPOSITORY, useClass: MikroAttachmentRepository },
    {
      provide: EXTRACTION_RESULT_REPOSITORY,
      useClass: MikroExtractionResultRepository,
    },
    { provide: EXTRACTION_SERVICE, useClass: PythonCliExtractionService },
  ],
  exports: [
    ATTACHMENT_REPOSITORY,
    EXTRACTION_RESULT_REPOSITORY,
    EXTRACTION_SERVICE,
  ],
})
export class AttachmentInfrastructureModule {}
