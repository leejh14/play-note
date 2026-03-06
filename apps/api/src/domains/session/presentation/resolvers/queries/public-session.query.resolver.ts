import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { assertGlobalIdType, ConnectionDto, EdgeDto } from '@libs/relay';
import { Public } from '@auth/decorators/public.decorator';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { GetSessionsUseCase } from '@domains/session/application/use-cases/queries/get-sessions.use-case';
import { GetSessionUseCase } from '@domains/session/application/use-cases/queries/get-session.use-case';
import { GetCommentsUseCase } from '@domains/session/application/use-cases/queries/get-comments.use-case';
import { GetMatchesBySessionUseCase } from '@domains/match/application/use-cases/queries/get-matches-by-session.use-case';
import { GetAttachmentsBySessionUseCase } from '@domains/attachment/application/use-cases/queries/get-attachments-by-session.use-case';
import { GetAttachmentsByMatchUseCase } from '@domains/attachment/application/use-cases/queries/get-attachments-by-match.use-case';
import { GetExtractionResultsByMatchUseCase } from '@domains/attachment/application/use-cases/queries/get-extraction-results-by-match.use-case';
import { SessionFilterInput } from '@domains/session/presentation/graphql/inputs/session-filter.input.gql';
import { SessionOrderInput } from '@domains/session/presentation/graphql/inputs/session-order.input.gql';
import { GetSessionsInputDto } from '@domains/session/application/dto/inputs/get-sessions.input.dto';
import { SessionIdInputDto } from '@domains/session/application/dto/inputs/session-id.input.dto';
import { MatchesBySessionInputDto } from '@domains/match/application/dto/inputs/matches-by-session.input.dto';
import { AttachmentsBySessionInputDto } from '@domains/attachment/application/dto/inputs/attachments-by-session.input.dto';
import { SessionOrderDirection } from '@domains/session/domain/repositories/session.repository.interface';
import { PublicSession } from '@domains/session/presentation/graphql/types/public-session.gql';
import { PublicSessionConnection } from '@domains/session/presentation/graphql/types/public-session-connection.gql';
import { PublicSessionGqlMapper } from '@domains/session/presentation/mappers/public-session.gql.mapper';

@Resolver(() => PublicSession)
export class PublicSessionQueryResolver {
  constructor(
    private readonly getSessionsUseCase: GetSessionsUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getMatchesBySessionUseCase: GetMatchesBySessionUseCase,
    private readonly getAttachmentsBySessionUseCase: GetAttachmentsBySessionUseCase,
    private readonly getAttachmentsByMatchUseCase: GetAttachmentsByMatchUseCase,
    private readonly getExtractionResultsByMatchUseCase: GetExtractionResultsByMatchUseCase,
  ) {}

  @Public()
  @Query(() => PublicSessionConnection, { nullable: false })
  async publicSessions(
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('before', { type: () => String, nullable: true }) before?: string,
    @Args('filter', { type: () => SessionFilterInput, nullable: true })
    filter?: SessionFilterInput,
    @Args('orderBy', { type: () => [SessionOrderInput], nullable: true })
    orderBy?: SessionOrderInput[],
  ): Promise<PublicSessionConnection> {
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

    const edges = await Promise.all(
      output.edges.map(async (edge) => {
        const node = await this.buildPublicSession(edge.node.id);
        return new EdgeDto({
          cursor: edge.cursor,
          node,
        });
      }),
    );

    return PublicSessionGqlMapper.toConnectionGql(
      new ConnectionDto({
        edges,
        pageInfo: output.pageInfo,
      }),
    );
  }

  @Public()
  @Query(() => PublicSession, { nullable: false })
  async publicSession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<PublicSession> {
    const localSessionId = this.decodeGlobalId(sessionId, 'Session');
    const data = await this.buildPublicSession(localSessionId);
    return PublicSessionGqlMapper.toGql(data);
  }

  private async buildPublicSession(sessionId: string) {
    const [session, comments, matches, attachments] = await Promise.all([
      this.getSessionUseCase.execute(
        new SessionIdInputDto({
          sessionId,
        }),
      ),
      this.getCommentsUseCase.execute(
        new SessionIdInputDto({
          sessionId,
        }),
      ),
      this.getMatchesBySessionUseCase.execute(
        new MatchesBySessionInputDto({
          sessionId,
        }),
      ),
      this.getAttachmentsBySessionUseCase.execute(
        new AttachmentsBySessionInputDto({
          sessionId,
        }),
      ),
    ]);

    const publicMatches = await Promise.all(
      matches.map(async (match) => ({
        match,
        attachments: await this.getAttachmentsByMatchUseCase.execute({
          matchId: match.id,
        }),
        extractionResults: await this.getExtractionResultsByMatchUseCase.execute({
          matchId: match.id,
        }),
      })),
    );

    return {
      session,
      comments,
      matches: publicMatches,
      attachments,
    };
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
