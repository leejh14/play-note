import {
  Query,
  Resolver,
  Args,
  ID,
  InterfaceType,
  Field,
  Context,
} from '@nestjs/graphql';
import { fromGlobalId } from '@libs/relay';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { AuthContext } from '@auth/types/auth-context.type';
import { RequestWithAuth } from '@auth/types/request-with-auth.type';

@InterfaceType('Node', {
  description: 'Relay Global Object Identification 인터페이스',
})
export abstract class Node {
  @Field(() => ID, { nullable: false })
  id!: string;
}

type NodeFetcher = (input: {
  id: string;
  auth: AuthContext;
}) => Promise<unknown>;

@Resolver(() => Node)
export class NodeResolver {
  private readonly fetchers = new Map<string, NodeFetcher>();

  registerNodeFetcher(typeName: string, fetcher: NodeFetcher): void {
    this.fetchers.set(typeName, fetcher);
  }

  @Query(() => Node, { nullable: true, description: 'Relay node query' })
  async node(
    @Args('id', { type: () => ID }) globalId: string,
    @Context() context: { req?: RequestWithAuth },
  ): Promise<unknown> {
    const auth = this.getAuthContext(context);
    const { typeName, localId } = this.parseGlobalId(globalId);
    const fetcher = this.fetchers.get(typeName);
    if (!fetcher) {
      return null;
    }
    return fetcher({ id: localId, auth });
  }

  @Query(() => [Node], {
    nullable: 'items',
    description: 'Relay nodes query',
  })
  async nodes(
    @Args('ids', { type: () => [ID] }) globalIds: string[],
    @Context() context: { req?: RequestWithAuth },
  ): Promise<Array<unknown | null>> {
    const auth = this.getAuthContext(context);
    return Promise.all(
      globalIds.map(async (globalId) => {
        const { typeName, localId } = this.parseGlobalId(globalId);
        const fetcher = this.fetchers.get(typeName);
        if (!fetcher) {
          return null;
        }
        return fetcher({ id: localId, auth });
      }),
    );
  }

  private getAuthContext(context: { req?: RequestWithAuth }): AuthContext {
    const auth = context.req?.auth;
    if (!auth) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
      });
    }
    return auth;
  }

  private parseGlobalId(globalId: string): {
    typeName: string;
    localId: string;
  } {
    try {
      return fromGlobalId(globalId);
    } catch {
      throw new ValidationException({
        message: 'Invalid global id',
      });
    }
  }
}
