import { Query, Resolver, Args, ID, InterfaceType, Field } from '@nestjs/graphql';

@InterfaceType('Node', {
  description: 'Relay Global Object Identification 인터페이스',
})
export abstract class Node {
  @Field(() => ID, { nullable: false })
  id!: string;
}

type NodeFetcher = (id: string) => Promise<unknown>;

@Resolver(() => Node)
export class NodeResolver {
  private readonly fetchers = new Map<string, NodeFetcher>();

  registerNodeFetcher(typeName: string, fetcher: NodeFetcher): void {
    this.fetchers.set(typeName, fetcher);
  }

  @Query(() => Node, { nullable: true, description: 'Relay node query' })
  async node(
    @Args('id', { type: () => ID }) globalId: string,
  ): Promise<unknown> {
    const { typeName, localId } = fromGlobalId(globalId);
    const fetcher = this.fetchers.get(typeName);
    if (!fetcher) return null;
    return fetcher(localId);
  }
}

export function toGlobalId(typeName: string, localId: string): string {
  return Buffer.from(`${typeName}:${localId}`).toString('base64');
}

export function fromGlobalId(globalId: string): {
  typeName: string;
  localId: string;
} {
  const decoded = Buffer.from(globalId, 'base64').toString('utf-8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid global ID format: ${globalId}`);
  }
  return {
    typeName: decoded.substring(0, separatorIndex),
    localId: decoded.substring(separatorIndex + 1),
  };
}

export function assertGlobalIdType(
  globalId: string,
  expectedType: string,
): string {
  const { typeName, localId } = fromGlobalId(globalId);
  if (typeName !== expectedType) {
    throw new Error(
      `Expected global ID type "${expectedType}" but got "${typeName}"`,
    );
  }
  return localId;
}
