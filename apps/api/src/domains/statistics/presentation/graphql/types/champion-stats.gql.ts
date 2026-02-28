import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ChampionStats')
export class ChampionStats {
  @Field(() => String, { nullable: false })
  champion!: string;

  @Field(() => Int, { nullable: false })
  wins!: number;

  @Field(() => Int, { nullable: false })
  games!: number;

  @Field(() => Float, { nullable: false })
  winRate!: number;
}
