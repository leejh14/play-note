import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('DeleteSessionInput')
export class DeleteSessionInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;
}
