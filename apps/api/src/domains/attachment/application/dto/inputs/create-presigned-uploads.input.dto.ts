import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

export class CreatePresignedUploadItemDto {
  readonly matchId?: string | null;
  readonly scope: AttachmentScope;
  readonly type: AttachmentType;
  readonly contentType: string;
  readonly originalFileName?: string | null;

  constructor(props: {
    matchId?: string | null;
    scope: AttachmentScope;
    type: AttachmentType;
    contentType: string;
    originalFileName?: string | null;
  }) {
    this.matchId = props.matchId ?? null;
    this.scope = props.scope;
    this.type = props.type;
    this.contentType = props.contentType;
    this.originalFileName = props.originalFileName ?? null;
  }
}

export class CreatePresignedUploadsInputDto {
  readonly sessionId: string;
  readonly files: CreatePresignedUploadItemDto[];

  constructor(props: {
    sessionId: string;
    files: CreatePresignedUploadItemDto[];
  }) {
    this.sessionId = props.sessionId;
    this.files = props.files;
  }
}
