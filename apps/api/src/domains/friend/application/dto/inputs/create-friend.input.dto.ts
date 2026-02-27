export class CreateFriendInputDto {
  readonly displayName: string;
  readonly riotGameName?: string | null;
  readonly riotTagLine?: string | null;

  constructor(props: {
    displayName: string;
    riotGameName?: string | null;
    riotTagLine?: string | null;
  }) {
    this.displayName = props.displayName;
    this.riotGameName = props.riotGameName ?? null;
    this.riotTagLine = props.riotTagLine ?? null;
  }
}
