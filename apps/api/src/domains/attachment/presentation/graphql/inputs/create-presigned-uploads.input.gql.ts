import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RelayMutationInput } from '@libs/relay';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

@InputType('PresignedUploadFileInput')
export class PresignedUploadFileInput {
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

@InputType('CreatePresignedUploadsInput')
export class CreatePresignedUploadsInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => [PresignedUploadFileInput], { nullable: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignedUploadFileInput)
  files!: PresignedUploadFileInput[];
}
