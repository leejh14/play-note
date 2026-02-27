import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

export class CompleteUploadInputDto {
  readonly uploadId: string;
  readonly sessionId: string;
  readonly matchId?: string | null;
  readonly scope: AttachmentScope;
  readonly type: AttachmentType;
  readonly contentType: string;
  readonly size: number;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly originalFileName?: string | null;

  constructor(props: {
    uploadId: string;
    sessionId: string;
    matchId?: string | null;
    scope: AttachmentScope;
    type: AttachmentType;
    contentType: string;
    size: number;
    width?: number | null;
    height?: number | null;
    originalFileName?: string | null;
  }) {
    this.uploadId = props.uploadId;
    this.sessionId = props.sessionId;
    this.matchId = props.matchId ?? null;
    this.scope = props.scope;
    this.type = props.type;
    this.contentType = props.contentType;
    this.size = props.size;
    this.width = props.width ?? null;
    this.height = props.height ?? null;
    this.originalFileName = props.originalFileName ?? null;
  }
}
