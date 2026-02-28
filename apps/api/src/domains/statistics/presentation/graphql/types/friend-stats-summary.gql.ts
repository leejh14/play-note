import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Lane } from '@shared/domain/enums/lane.enum';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';

@ObjectType('FriendStatsSummary')
export class FriendStatsSummary {
  friendId!: string;

  @Field(() => Friend, { nullable: false })
  friend?: Friend;

  @Field(() => Float, { nullable: true })
  winRate!: number | null;

  @Field(() => Int, { nullable: false })
  wins!: number;

  @Field(() => Int, { nullable: false })
  losses!: number;

  @Field(() => Int, { nullable: false })
  totalMatches!: number;

  @Field(() => Lane, { nullable: true })
  topLane!: Lane | null;
}
