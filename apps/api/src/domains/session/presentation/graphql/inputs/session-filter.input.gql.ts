import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';

@InputType('SessionFilter')
export class SessionFilterInput {
  @Field(() => ContentType, { nullable: true })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;
}
