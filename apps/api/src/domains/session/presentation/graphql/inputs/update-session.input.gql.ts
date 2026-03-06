import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

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

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  startsAt?: Date;
}
