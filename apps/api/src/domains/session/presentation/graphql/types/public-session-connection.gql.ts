import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoGql } from '@libs/relay';
import { PublicSession } from './public-session.gql';

@ObjectType('PublicSessionEdge')
export class PublicSessionEdge {
  @Field(() => String, { nullable: false })
  cursor!: string;

  @Field(() => PublicSession, { nullable: false })
  node!: PublicSession;
}

@ObjectType('PublicSessionConnection')
export class PublicSessionConnection {
  @Field(() => [PublicSessionEdge], { nullable: false })
  edges!: PublicSessionEdge[];

  @Field(() => PageInfoGql, { nullable: false })
  pageInfo!: PageInfoGql;
}
