import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('MarkDoneInput')
export class MarkDoneInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;
}
