import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';

@ObjectType('SessionPreview')
export class SessionPreview {
  @Field(() => ContentType, { nullable: false })
  contentType!: ContentType;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: false })
  startsAt!: Date;
}
