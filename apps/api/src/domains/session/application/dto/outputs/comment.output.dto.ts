export class CommentOutputDto {
  readonly id: string;
  readonly sessionId: string;
  readonly body: string;
  readonly displayName: string | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    sessionId: string;
    body: string;
    displayName: string | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.sessionId = props.sessionId;
    this.body = props.body;
    this.displayName = props.displayName;
    this.createdAt = props.createdAt;
  }
}
