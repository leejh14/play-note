export class ConnectionArgsDto {
  readonly first?: number;
  readonly after?: string;
  readonly last?: number;
  readonly before?: string;

  constructor(props: {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
  }) {
    this.first = props.first;
    this.after = props.after;
    this.last = props.last;
    this.before = props.before;
  }
}
