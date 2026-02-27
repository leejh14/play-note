import { BaseEntityProps } from '@shared/domain/base-entity';
import { AggregateRoot } from '@shared/domain/aggregate-root';

export interface CreateCommentProps {
  readonly sessionId: string;
  readonly body: string;
  readonly displayName?: string | null;
}

export interface CommentReconstituteProps extends BaseEntityProps {
  readonly sessionId: string;
  readonly body: string;
  readonly displayName: string | null;
}

export class Comment extends AggregateRoot {
  private readonly _sessionId: string;
  private readonly _body: string;
  private readonly _displayName: string | null;

  private constructor(props: CommentReconstituteProps) {
    super(props);
    this._sessionId = props.sessionId;
    this._body = props.body;
    this._displayName = props.displayName;
  }

  static create(props: CreateCommentProps): Comment {
    const now = new Date();
    const id = AggregateRoot.generateId();

    if (!props.body?.trim()) {
      throw new Error('Comment body cannot be empty');
    }

    return new Comment({
      id,
      sessionId: props.sessionId,
      body: props.body.trim(),
      displayName: props.displayName?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CommentReconstituteProps): Comment {
    return new Comment(props);
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get body(): string {
    return this._body;
  }

  get displayName(): string | null {
    return this._displayName;
  }
}
