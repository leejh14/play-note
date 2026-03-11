export class ConfirmSessionInputDto {
  readonly sessionId: string;
  readonly expectedUpdatedAt: Date;

  constructor(props: { sessionId: string; expectedUpdatedAt: Date }) {
    this.sessionId = props.sessionId;
    this.expectedUpdatedAt = props.expectedUpdatedAt;
  }
}
