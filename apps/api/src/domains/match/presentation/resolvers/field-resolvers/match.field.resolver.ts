import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { GetSessionUseCase } from '@domains/session/application/use-cases/queries/get-session.use-case';
import { GetAttachmentsByMatchUseCase } from '@domains/attachment/application/use-cases/queries/get-attachments-by-match.use-case';
import { GetExtractionResultsByMatchUseCase } from '@domains/attachment/application/use-cases/queries/get-extraction-results-by-match.use-case';
import { SessionIdInputDto } from '@domains/session/application/dto/inputs/session-id.input.dto';
import { Match } from '@domains/match/presentation/graphql/types/match.gql';
import { Session } from '@domains/session/presentation/graphql/types/session.gql';
import { Attachment } from '@domains/attachment/presentation/graphql/types/attachment.gql';
import { ExtractionResult } from '@domains/attachment/presentation/graphql/types/extraction-result.gql';
import { SessionGqlMapper } from '@domains/session/presentation/mappers/session.gql.mapper';
import { AttachmentGqlMapper } from '@domains/attachment/presentation/mappers/attachment.gql.mapper';
import { ExtractionResultGqlMapper } from '@domains/attachment/presentation/mappers/extraction-result.gql.mapper';

@Resolver(() => Match)
export class MatchFieldResolver {
  constructor(
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getAttachmentsByMatchUseCase: GetAttachmentsByMatchUseCase,
    private readonly getExtractionResultsByMatchUseCase: GetExtractionResultsByMatchUseCase,
  ) {}

  @ResolveField(() => Session, { nullable: false })
  async session(
    @Parent() match: Match,
    @CurrentAuth() auth: AuthContext,
  ): Promise<Session> {
    this.assertSessionAccess(auth, match.sessionId);
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: match.sessionId,
      }),
    );
    return SessionGqlMapper.toGql(session);
  }

  @ResolveField(() => [Attachment], { nullable: false })
  async attachments(
    @Parent() match: Match,
    @CurrentAuth() auth: AuthContext,
  ): Promise<Attachment[]> {
    this.assertSessionAccess(auth, match.sessionId);
    const attachments = await this.getAttachmentsByMatchUseCase.execute({
      matchId: match.localId,
    });
    return attachments.map((attachment) => AttachmentGqlMapper.toGql(attachment));
  }

  @ResolveField(() => [ExtractionResult], { nullable: false })
  async extractionResults(
    @Parent() match: Match,
    @CurrentAuth() auth: AuthContext,
  ): Promise<ExtractionResult[]> {
    this.assertSessionAccess(auth, match.sessionId);
    const results = await this.getExtractionResultsByMatchUseCase.execute({
      matchId: match.localId,
    });
    return results.map((result) => ExtractionResultGqlMapper.toGql(result));
  }

  private assertSessionAccess(auth: AuthContext, sessionId: string): void {
    if (auth.sessionId !== sessionId) {
      throw new ForbiddenException({
        message: 'Access denied for session',
      });
    }
  }
}
