export class CreateMatchFromPresetInputDto {
  readonly sessionId: string;

  constructor(props: { sessionId: string }) {
    this.sessionId = props.sessionId;
  }
}
