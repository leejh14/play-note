import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('DeleteCommentInput')
export class DeleteCommentInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  commentId!: string;
}
