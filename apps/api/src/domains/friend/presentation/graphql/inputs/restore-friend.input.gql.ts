import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('RestoreFriendInput')
export class RestoreFriendInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;
}
