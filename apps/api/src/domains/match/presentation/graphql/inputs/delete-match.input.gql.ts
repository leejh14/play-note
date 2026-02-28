import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('DeleteMatchInput')
export class DeleteMatchInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  matchId!: string;
}
