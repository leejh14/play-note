import { Field, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function createEdgeType<T>(
  NodeClass: Type<T>,
): Type<{ node: T; cursor: string }> {
  @ObjectType(`${NodeClass.name}Edge`, { isAbstract: false })
  class EdgeType {
    @Field(() => NodeClass, { nullable: false })
    node!: T;

    @Field(() => String, { nullable: false })
    cursor!: string;
  }

  return EdgeType;
}
