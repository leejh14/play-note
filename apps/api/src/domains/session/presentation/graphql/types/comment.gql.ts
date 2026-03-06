import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Comment')
export class Comment {
  @Field(() => ID, { nullable: false })
  id!: string;

  sessionId!: string;

  @Field(() => String, { nullable: false })
  body!: string;

  @Field(() => String, { nullable: true })
  displayName!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: false })
  createdAt!: Date;
}
