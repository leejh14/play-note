export class UpdateFriendInputDto {
  readonly id: string;
  readonly displayName?: string | null;
  readonly riotGameName?: string | null;
  readonly riotTagLine?: string | null;

  constructor(props: {
    id: string;
    displayName?: string | null;
    riotGameName?: string | null;
    riotTagLine?: string | null;
  }) {
    this.id = props.id;
    this.displayName = props.displayName;
    this.riotGameName = props.riotGameName;
    this.riotTagLine = props.riotTagLine;
  }
}
