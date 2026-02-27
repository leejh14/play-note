export class UpdateSessionInputDto {
  readonly sessionId: string;
  readonly title?: string | null;
  readonly startsAt?: Date;

  constructor(props: {
    sessionId: string;
    title?: string | null;
    startsAt?: Date;
  }) {
    this.sessionId = props.sessionId;
    this.title = props.title;
    this.startsAt = props.startsAt;
  }
}
