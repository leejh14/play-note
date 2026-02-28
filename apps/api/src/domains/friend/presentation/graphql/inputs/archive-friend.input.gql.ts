import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('ArchiveFriendInput')
export class ArchiveFriendInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;
}
