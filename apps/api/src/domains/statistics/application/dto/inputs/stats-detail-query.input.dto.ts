import { StatsQueryInputDto } from './stats-query.input.dto';

export class StatsDetailQueryInputDto extends StatsQueryInputDto {
  readonly friendId: string;

  constructor(props: {
    startDate?: Date;
    endDate?: Date;
    includeArchived?: boolean;
    friendId: string;
  }) {
    super({
      startDate: props.startDate,
      endDate: props.endDate,
      includeArchived: props.includeArchived,
    });
    this.friendId = props.friendId;
  }
}
