import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';

@InputType('StatsDetailInput')
export class StatsDetailInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => DateTimeScalar, { nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field(() => DateTimeScalar, { nullable: true })
  @IsOptional()
  endDate?: Date;
}
