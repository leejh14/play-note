import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('CreateCommentInput')
export class CreateCommentInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => String, { nullable: false })
  @IsString()
  @MinLength(1)
  body!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
