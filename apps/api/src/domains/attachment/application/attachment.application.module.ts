import { Module } from '@nestjs/common';
import { GraphileWorkerModule } from '@shared/infrastructure/worker/graphile-worker.module';
import { StorageModule } from '@shared/infrastructure/storage/storage.module';
import { AttachmentInfrastructureModule } from '@domains/attachment/infrastructure/attachment.infrastructure.module';
import { CreatePresignedUploadUseCase } from './use-cases/commands/create-presigned-upload.use-case';
import { CreatePresignedUploadsUseCase } from './use-cases/commands/create-presigned-uploads.use-case';
import { CompleteUploadUseCase } from './use-cases/commands/complete-upload.use-case';
import { CompleteUploadsUseCase } from './use-cases/commands/complete-uploads.use-case';
import { DeleteAttachmentUseCase } from './use-cases/commands/delete-attachment.use-case';
import { GetAttachmentsBySessionUseCase } from './use-cases/queries/get-attachments-by-session.use-case';
import { GetExtractionResultUseCase } from './use-cases/queries/get-extraction-result.use-case';

@Module({
  imports: [
    GraphileWorkerModule,
    StorageModule,
    AttachmentInfrastructureModule,
  ],
  providers: [
    CreatePresignedUploadUseCase,
    CreatePresignedUploadsUseCase,
    CompleteUploadUseCase,
    CompleteUploadsUseCase,
    DeleteAttachmentUseCase,
    GetAttachmentsBySessionUseCase,
    GetExtractionResultUseCase,
  ],
  exports: [
    CreatePresignedUploadUseCase,
    CreatePresignedUploadsUseCase,
    CompleteUploadUseCase,
    CompleteUploadsUseCase,
    DeleteAttachmentUseCase,
    GetAttachmentsBySessionUseCase,
    GetExtractionResultUseCase,
  ],
})
export class AttachmentApplicationModule {}
