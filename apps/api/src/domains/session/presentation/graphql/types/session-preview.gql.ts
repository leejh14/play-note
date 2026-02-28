import { Field, ObjectType } from '@nestjs/graphql';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';

@ObjectType('SessionPreview')
export class SessionPreview {
  @Field(() => ContentType, { nullable: false })
  contentType!: ContentType;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => DateTimeScalar, { nullable: false })
  startsAt!: Date;
}
