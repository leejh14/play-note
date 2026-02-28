import { Field, ObjectType } from '@nestjs/graphql';
import { FriendStatsSummary } from './friend-stats-summary.gql';

@ObjectType('StatsOverview')
export class StatsOverview {
  @Field(() => [FriendStatsSummary], { nullable: false })
  friends!: FriendStatsSummary[];
}
