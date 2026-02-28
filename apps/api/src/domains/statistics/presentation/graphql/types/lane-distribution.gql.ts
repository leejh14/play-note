import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Lane } from '@shared/domain/enums/lane.enum';

@ObjectType('LaneDistribution')
export class LaneDistribution {
  @Field(() => Lane, { nullable: false })
  lane!: Lane;

  @Field(() => Int, { nullable: false })
  playCount!: number;
}
