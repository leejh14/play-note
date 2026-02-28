import { toGlobalId } from '@libs/relay';
import { AttachmentOutputDto } from '@domains/attachment/application/dto/outputs/attachment.output.dto';
import { Attachment } from '@domains/attachment/presentation/graphql/types/attachment.gql';

export class AttachmentGqlMapper {
  static toGql(dto: AttachmentOutputDto): Attachment {
    const gql = new Attachment();
    gql.id = AttachmentGqlMapper.toAttachmentIdGql(dto.id);
    gql.localId = dto.id;
    gql.sessionId = dto.sessionId;
    gql.matchId = dto.matchId;
    gql.scope = dto.scope;
    gql.type = dto.type;
    gql.s3Key = dto.s3Key;
    gql.url = '';
    gql.contentType = dto.contentType;
    gql.size = dto.size;
    gql.width = dto.width;
    gql.height = dto.height;
    gql.originalFileName = dto.originalFileName;
    gql.extractionResult = null;
    gql.createdAt = dto.createdAt;
    return gql;
  }

  static toAttachmentIdGql(localId: string): string {
    return toGlobalId('Attachment', localId);
  }
}
