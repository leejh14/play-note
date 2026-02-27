import { FriendStatsSummaryDto } from './friend-stats-summary.dto';

export class StatsOverviewOutputDto {
  readonly friends: FriendStatsSummaryDto[];

  constructor(props: { friends: FriendStatsSummaryDto[] }) {
    this.friends = props.friends;
  }
}
