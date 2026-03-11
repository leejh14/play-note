import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('ConfirmSessionInput')
export class ConfirmSessionInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => GraphQLISODateTime, { nullable: false })
  @IsDate()
  expectedUpdatedAt!: Date;
}
