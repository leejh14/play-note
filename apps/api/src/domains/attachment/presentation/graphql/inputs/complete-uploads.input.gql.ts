import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RelayMutationInput } from '@libs/relay';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

@InputType('CompleteUploadFileInput')
export class CompleteUploadFileInput {
  @Field(() => String, { nullable: false })
  @IsString()
  uploadId!: string;

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
  @MaxLength(100)
  contentType!: string;

  @Field(() => Int, { nullable: false })
  @IsInt()
  @Min(0)
  size!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFileName?: string;
}

@InputType('CompleteUploadsInput')
export class CompleteUploadsInput extends RelayMutationInput {
  @Field(() => [CompleteUploadFileInput], { nullable: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteUploadFileInput)
  files!: CompleteUploadFileInput[];
}
