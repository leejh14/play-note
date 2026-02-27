export class GetFriendsInputDto {
  readonly includeArchived?: boolean;
  readonly query?: string;

  constructor(props: { includeArchived?: boolean; query?: string }) {
    this.includeArchived = props.includeArchived ?? false;
    this.query = props.query;
  }
}
