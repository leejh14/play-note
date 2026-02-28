import { ObjectType, Field, ID } from '@nestjs/graphql';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';
import { Node } from '@shared/presentation/graphql/relay/node.resolver';

@ObjectType('Friend', {
  implements: () => [Node],
})
export class Friend implements Node {
  @Field(() => ID, { nullable: false })
  id!: string;

  @Field(() => String, { nullable: false })
  displayName!: string;

  @Field(() => String, { nullable: true })
  riotGameName!: string | null;

  @Field(() => String, { nullable: true })
  riotTagLine!: string | null;

  @Field(() => Boolean, { nullable: false })
  isArchived!: boolean;

  @Field(() => DateTimeScalar, { nullable: false })
  createdAt!: Date;

  @Field(() => DateTimeScalar, { nullable: false })
  updatedAt!: Date;
}
