import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType('StatsDetailInput')
export class StatsDetailInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  endDate?: Date;
}
