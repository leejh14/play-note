import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';

@InputType('UpdateSessionInput')
export class UpdateSessionInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @Field(() => DateTimeScalar, { nullable: true })
  @IsOptional()
  startsAt?: Date;
}
