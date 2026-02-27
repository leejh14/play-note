export class MatchIdInputDto {
  readonly matchId: string;

  constructor(props: { matchId: string }) {
    this.matchId = props.matchId;
  }
}
