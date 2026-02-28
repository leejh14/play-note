import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';

@ObjectType('Comment')
export class Comment {
  @Field(() => ID, { nullable: false })
  id!: string;

  sessionId!: string;

  @Field(() => String, { nullable: false })
  body!: string;

  @Field(() => String, { nullable: true })
  displayName!: string | null;

  @Field(() => DateTimeScalar, { nullable: false })
  createdAt!: Date;
}
