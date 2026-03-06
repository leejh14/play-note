import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';

@InputType('CreateSessionInput')
export class CreateSessionInput extends RelayMutationInput {
  @Field(() => ContentType, { nullable: false })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @Field(() => GraphQLISODateTime, { nullable: false })
  @IsDate()
  startsAt!: Date;
}
