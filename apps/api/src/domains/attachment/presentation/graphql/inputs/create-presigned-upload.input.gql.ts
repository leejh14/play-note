import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

@InputType('CreatePresignedUploadInput')
export class CreatePresignedUploadInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  matchId?: string;

  @Field(() => AttachmentScope, { nullable: false })
  @IsEnum(AttachmentScope)
  scope!: AttachmentScope;

  @Field(() => AttachmentType, { nullable: false })
  @IsEnum(AttachmentType)
  type!: AttachmentType;

  @Field(() => String, { nullable: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contentType!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFileName?: string;
}
