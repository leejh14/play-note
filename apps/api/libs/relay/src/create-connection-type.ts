import { Field, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

@ObjectType('PageInfo')
export class PageInfoGql {
  @Field(() => Boolean, { nullable: false })
  hasNextPage!: boolean;

  @Field(() => Boolean, { nullable: false })
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor!: string | null;

  @Field(() => String, { nullable: true })
  endCursor!: string | null;
}

export function createConnectionType<T extends object>(
  EdgeClass: Type<T>,
): Type<{ edges: T[]; pageInfo: PageInfoGql }> {
  const edgeName = EdgeClass.name;
  const connectionName = edgeName.replace(/Edge$/, 'Connection');

  @ObjectType(connectionName, { isAbstract: false })
  class ConnectionType {
    @Field(() => [EdgeClass], { nullable: false })
    edges!: T[];

    @Field(() => PageInfoGql, { nullable: false })
    pageInfo!: PageInfoGql;
  }

  return ConnectionType as Type<{ edges: T[]; pageInfo: PageInfoGql }>;
}
