export class StatsQueryInputDto {
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly includeArchived?: boolean;

  constructor(props: {
    startDate?: Date;
    endDate?: Date;
    includeArchived?: boolean;
  }) {
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.includeArchived = props.includeArchived ?? false;
  }
}
