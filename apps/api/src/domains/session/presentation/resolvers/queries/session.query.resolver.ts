import {
  Args,
  ID,
  Int,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { OnModuleInit } from '@nestjs/common';
import {
  assertGlobalIdType,
  ConnectionDto,
  PageInfoDto,
} from '@libs/relay';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { Public } from '@auth/decorators/public.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { NodeResolver } from '@shared/presentation/graphql/relay/node.resolver';
import { GetSessionsUseCase } from '@domains/session/application/use-cases/queries/get-sessions.use-case';
import { GetSessionUseCase } from '@domains/session/application/use-cases/queries/get-session.use-case';
import { GetSessionPreviewUseCase } from '@domains/session/application/use-cases/queries/get-session-preview.use-case';
import { GetSessionsInputDto } from '@domains/session/application/dto/inputs/get-sessions.input.dto';
import { SessionIdInputDto } from '@domains/session/application/dto/inputs/session-id.input.dto';
import { SessionOrderDirection } from '@domains/session/domain/repositories/session.repository.interface';
import { Session } from '@domains/session/presentation/graphql/types/session.gql';
import { SessionPreview } from '@domains/session/presentation/graphql/types/session-preview.gql';
import { SessionConnection } from '@domains/session/presentation/graphql/types/session-connection.gql';
import { SessionFilterInput } from '@domains/session/presentation/graphql/inputs/session-filter.input.gql';
import { SessionOrderInput } from '@domains/session/presentation/graphql/inputs/session-order.input.gql';
import { SessionGqlMapper } from '@domains/session/presentation/mappers/session.gql.mapper';

@Resolver(() => Session)
export class SessionQueryResolver implements OnModuleInit {
  constructor(
    private readonly getSessionsUseCase: GetSessionsUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getSessionPreviewUseCase: GetSessionPreviewUseCase,
    private readonly nodeResolver: NodeResolver,
  ) {}

  onModuleInit(): void {
    this.nodeResolver.registerNodeFetcher(
      'Session',
      async (input) => {
        this.assertSessionAccess(input.auth, input.id);
        try {
          const session = await this.getSessionUseCase.execute(
            new SessionIdInputDto({
              sessionId: input.id,
            }),
          );
          return SessionGqlMapper.toGql(session);
        } catch (error: unknown) {
          if (error instanceof NotFoundException) {
            return null;
          }
          throw error;
        }
      },
    );
  }

  @Query(() => SessionConnection, { nullable: false })
  async sessions(
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('before', { type: () => String, nullable: true }) before?: string,
    @Args('filter', { type: () => SessionFilterInput, nullable: true })
    filter?: SessionFilterInput,
    @Args('orderBy', { type: () => [SessionOrderInput], nullable: true })
    orderBy?: SessionOrderInput[],
    @CurrentAuth() auth?: AuthContext,
  ): Promise<SessionConnection> {
    const output = await this.getSessionsUseCase.execute(
      new GetSessionsInputDto({
        first,
        after,
        last,
        before,
        filter: filter
          ? {
              contentType: filter.contentType,
            }
          : undefined,
        orderBy: orderBy?.map((item) => ({
          field: item.field,
          direction: item.direction as SessionOrderDirection,
        })),
      }),
    );

    const filteredEdges = output.edges.filter(
      (edge) => edge.node.id === auth?.sessionId,
    );
    const startCursor = filteredEdges[0]?.cursor ?? null;
    const endCursor =
      filteredEdges.length > 0
        ? filteredEdges[filteredEdges.length - 1]!.cursor
        : null;
    const filteredConnection = new ConnectionDto({
      edges: filteredEdges,
      pageInfo: new PageInfoDto({
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor,
        endCursor,
      }),
    });

    return SessionGqlMapper.toConnectionGql(filteredConnection);
  }

  @Query(() => Session, { nullable: false })
  async session(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @CurrentAuth() auth: AuthContext,
  ): Promise<Session> {
    const localSessionId = this.decodeGlobalId(sessionId, 'Session');
    this.assertSessionAccess(auth, localSessionId);

    const output = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: localSessionId,
      }),
    );
    return SessionGqlMapper.toGql(output);
  }

  @Public()
  @Query(() => SessionPreview, { nullable: false })
  async sessionPreview(
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<SessionPreview> {
    const localSessionId = this.decodeGlobalId(sessionId, 'Session');
    const output = await this.getSessionPreviewUseCase.execute(
      new SessionIdInputDto({
        sessionId: localSessionId,
      }),
    );
    return SessionGqlMapper.toPreviewGql(output);
  }

  private assertSessionAccess(auth: AuthContext, sessionId: string): void {
    if (auth.sessionId !== sessionId) {
      throw new ForbiddenException({
        message: 'Access denied for session',
      });
    }
  }

  private decodeGlobalId(globalId: string, expectedType: string): string {
    try {
      return assertGlobalIdType(globalId, expectedType);
    } catch {
      throw new ValidationException({
        message: `Invalid ${expectedType} id`,
      });
    }
  }
}
