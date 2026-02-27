import { BaseEntityProps } from '@shared/domain/base-entity';
import { AggregateRoot } from '@shared/domain/aggregate-root';
import { AttachmentScope } from '../enums/attachment-scope.enum';
import { AttachmentType } from '../enums/attachment-type.enum';

export interface CreateAttachmentProps {
  readonly sessionId: string;
  readonly matchId?: string | null;
  readonly scope: AttachmentScope;
  readonly type: AttachmentType;
  readonly s3Key: string;
  readonly contentType: string;
  readonly size: number;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly originalFileName?: string | null;
}

export interface AttachmentReconstituteProps extends BaseEntityProps {
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
}

export class Attachment extends AggregateRoot {
  private readonly _sessionId: string;
  private readonly _matchId: string | null;
  private readonly _scope: AttachmentScope;
  private readonly _type: AttachmentType;
  private readonly _s3Key: string;
  private readonly _contentType: string;
  private readonly _size: number;
  private readonly _width: number | null;
  private readonly _height: number | null;
  private readonly _originalFileName: string | null;

  private constructor(props: AttachmentReconstituteProps) {
    super(props);
    this._sessionId = props.sessionId;
    this._matchId = props.matchId;
    this._scope = props.scope;
    this._type = props.type;
    this._s3Key = props.s3Key;
    this._contentType = props.contentType;
    this._size = props.size;
    this._width = props.width;
    this._height = props.height;
    this._originalFileName = props.originalFileName;
  }

  static create(props: CreateAttachmentProps): Attachment {
    const now = new Date();
    const id = AggregateRoot.generateId();

    return new Attachment({
      id,
      sessionId: props.sessionId,
      matchId: props.matchId ?? null,
      scope: props.scope,
      type: props.type,
      s3Key: props.s3Key,
      contentType: props.contentType,
      size: props.size,
      width: props.width ?? null,
      height: props.height ?? null,
      originalFileName: props.originalFileName?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AttachmentReconstituteProps): Attachment {
    return new Attachment(props);
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get matchId(): string | null {
    return this._matchId;
  }

  get scope(): AttachmentScope {
    return this._scope;
  }

  get type(): AttachmentType {
    return this._type;
  }

  get s3Key(): string {
    return this._s3Key;
  }

  get contentType(): string {
    return this._contentType;
  }

  get size(): number {
    return this._size;
  }

  get width(): number | null {
    return this._width;
  }

  get height(): number | null {
    return this._height;
  }

  get originalFileName(): string | null {
    return this._originalFileName;
  }
}
