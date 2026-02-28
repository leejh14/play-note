import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';

@InputType('StatsOverviewInput')
export class StatsOverviewInput {
  @Field(() => DateTimeScalar, { nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field(() => DateTimeScalar, { nullable: true })
  @IsOptional()
  endDate?: Date;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;
}
