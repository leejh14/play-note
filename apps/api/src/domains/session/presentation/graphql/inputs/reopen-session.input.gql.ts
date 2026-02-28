import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('ReopenSessionInput')
export class ReopenSessionInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;
}
