export class FriendOutputDto {
  readonly id: string;
  readonly displayName: string;
  readonly riotGameName: string | null;
  readonly riotTagLine: string | null;
  readonly isArchived: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    displayName: string;
    riotGameName: string | null;
    riotTagLine: string | null;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.displayName = props.displayName;
    this.riotGameName = props.riotGameName;
    this.riotTagLine = props.riotTagLine;
    this.isArchived = props.isArchived;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
