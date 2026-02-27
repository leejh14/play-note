export class SetChampionInputDto {
  readonly matchId: string;
  readonly friendId: string;
  readonly champion: string | null;

  constructor(props: {
    matchId: string;
    friendId: string;
    champion: string | null;
  }) {
    this.matchId = props.matchId;
    this.friendId = props.friendId;
    this.champion = props.champion;
  }
}
