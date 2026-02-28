import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('DeleteAttachmentInput')
export class DeleteAttachmentInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  attachmentId!: string;
}
