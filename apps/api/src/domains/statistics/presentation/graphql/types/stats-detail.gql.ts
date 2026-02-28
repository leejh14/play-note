import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Lane } from '@shared/domain/enums/lane.enum';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import { LaneDistribution } from './lane-distribution.gql';
import { ChampionStats } from './champion-stats.gql';

@ObjectType('StatsDetail')
export class StatsDetail {
  friendId!: string;

  @Field(() => Friend, { nullable: false })
  friend?: Friend;

  @Field(() => Float, { nullable: true })
  winRate!: number | null;

  @Field(() => Int, { nullable: false })
  totalMatches!: number;

  @Field(() => Lane, { nullable: true })
  topLane!: Lane | null;

  @Field(() => [LaneDistribution], { nullable: false })
  laneDistribution!: LaneDistribution[];

  @Field(() => [ChampionStats], { nullable: false })
  topChampions!: ChampionStats[];
}
