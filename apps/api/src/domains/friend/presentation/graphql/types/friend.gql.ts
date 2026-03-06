import { ObjectType, Field, GraphQLISODateTime, ID } from '@nestjs/graphql';
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

  @Field(() => GraphQLISODateTime, { nullable: false })
  createdAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: false })
  updatedAt!: Date;
}
