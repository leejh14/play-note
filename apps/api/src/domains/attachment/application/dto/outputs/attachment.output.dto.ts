import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

export class AttachmentOutputDto {
  readonly id: string;
  readonly sessionId: string;
  readonly matchId: string | null;
  readonly scope: AttachmentScope;
  readonly type: AttachmentType;
  readonly s3Key: string;
  readonly contentType: string;
  readonly size: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly originalFileName: string | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    sessionId: string;
    matchId: string | null;
    scope: AttachmentScope;
    type: AttachmentType;
    s3Key: string;
    contentType: string;
    size: number;
    width: number | null;
    height: number | null;
    originalFileName: string | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.sessionId = props.sessionId;
    this.matchId = props.matchId;
    this.scope = props.scope;
    this.type = props.type;
    this.s3Key = props.s3Key;
    this.contentType = props.contentType;
    this.size = props.size;
    this.width = props.width;
    this.height = props.height;
    this.originalFileName = props.originalFileName;
    this.createdAt = props.createdAt;
  }
}
