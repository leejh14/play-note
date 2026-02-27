export class MatchesBySessionInputDto {
  readonly sessionId: string;

  constructor(props: { sessionId: string }) {
    this.sessionId = props.sessionId;
  }
}
