import { Injectable, Inject } from '@nestjs/common';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';
import { ConflictException } from '@shared/exceptions/conflict.exception';
import { S3StorageService } from '@shared/infrastructure/storage/s3-storage.service';
import { CreatePresignedUploadsInputDto } from '../../dto/inputs/create-presigned-uploads.input.dto';
import { uuidv7 } from 'uuidv7';

const ATTACHMENT_LIMIT = 10;

@Injectable()
export class CreatePresignedUploadsUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(input: CreatePresignedUploadsInputDto): Promise<{
    uploads: { uploadId: string; presignedUrl: string }[];
  }> {
    const count = await this.attachmentRepository.countBySessionId(
      input.sessionId,
    );
    const newCount = count + input.files.length;
    if (newCount > ATTACHMENT_LIMIT) {
      throw new ConflictException({
        message: 'Attachment limit exceeded',
        errorCode: 'ATTACHMENT_LIMIT_EXCEEDED',
      });
    }
    const uploads = await Promise.all(
      input.files.map(async (file) => {
        const uploadId = `sessions/${input.sessionId}/attachments/${uuidv7()}`;
        const presignedUrl =
          await this.s3StorageService.generatePresignedPutUrl(
            uploadId,
            file.contentType,
          );
        return { uploadId, presignedUrl };
      }),
    );
    return { uploads };
  }
}
