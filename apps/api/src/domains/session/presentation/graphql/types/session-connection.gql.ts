import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoGql } from '@libs/relay';
import { Session } from './session.gql';

@ObjectType('SessionEdge')
export class SessionEdge {
  @Field(() => String, { nullable: false })
  cursor!: string;

  @Field(() => Session, { nullable: false })
  node!: Session;
}

@ObjectType('SessionConnection')
export class SessionConnection {
  @Field(() => [SessionEdge], { nullable: false })
  edges!: SessionEdge[];

  @Field(() => PageInfoGql, { nullable: false })
  pageInfo!: PageInfoGql;
}
