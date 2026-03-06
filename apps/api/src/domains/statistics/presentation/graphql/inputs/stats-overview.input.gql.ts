import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType('StatsOverviewInput')
export class StatsOverviewInput {
  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  endDate?: Date;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;
}
