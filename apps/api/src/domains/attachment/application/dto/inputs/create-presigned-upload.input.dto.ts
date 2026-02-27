import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

export class CreatePresignedUploadInputDto {
  readonly sessionId: string;
  readonly matchId?: string | null;
  readonly scope: AttachmentScope;
  readonly type: AttachmentType;
  readonly contentType: string;
  readonly originalFileName?: string | null;

  constructor(props: {
    sessionId: string;
    matchId?: string | null;
    scope: AttachmentScope;
    type: AttachmentType;
    contentType: string;
    originalFileName?: string | null;
  }) {
    this.sessionId = props.sessionId;
    this.matchId = props.matchId ?? null;
    this.scope = props.scope;
    this.type = props.type;
    this.contentType = props.contentType;
    this.originalFileName = props.originalFileName ?? null;
  }
}
