export class CreateCommentInputDto {
  readonly sessionId: string;
  readonly body: string;
  readonly displayName?: string | null;

  constructor(props: {
    sessionId: string;
    body: string;
    displayName?: string | null;
  }) {
    this.sessionId = props.sessionId;
    this.body = props.body;
    this.displayName = props.displayName ?? null;
  }
}
