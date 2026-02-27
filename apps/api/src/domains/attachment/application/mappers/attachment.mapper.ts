import { Attachment } from '@domains/attachment/domain/aggregates/attachment.aggregate';
import { AttachmentOutputDto } from '../dto/outputs/attachment.output.dto';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

export class AttachmentMapper {
  static toDto(attachment: Attachment): AttachmentOutputDto {
    return new AttachmentOutputDto({
      id: attachment.id,
      sessionId: attachment.sessionId,
      matchId: attachment.matchId,
      scope: attachment.scope as AttachmentScope,
      type: attachment.type as AttachmentType,
      s3Key: attachment.s3Key,
      contentType: attachment.contentType,
      size: attachment.size,
      width: attachment.width,
      height: attachment.height,
      originalFileName: attachment.originalFileName,
      createdAt: attachment.createdAt,
    });
  }
}
