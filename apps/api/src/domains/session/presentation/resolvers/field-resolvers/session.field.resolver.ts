import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { GetCommentsUseCase } from '@domains/session/application/use-cases/queries/get-comments.use-case';
import { GetMatchesBySessionUseCase } from '@domains/match/application/use-cases/queries/get-matches-by-session.use-case';
import { GetAttachmentsBySessionUseCase } from '@domains/attachment/application/use-cases/queries/get-attachments-by-session.use-case';
import { SessionIdInputDto } from '@domains/session/application/dto/inputs/session-id.input.dto';
import { MatchesBySessionInputDto } from '@domains/match/application/dto/inputs/matches-by-session.input.dto';
import { AttachmentsBySessionInputDto } from '@domains/attachment/application/dto/inputs/attachments-by-session.input.dto';
import { Session } from '@domains/session/presentation/graphql/types/session.gql';
import { Comment } from '@domains/session/presentation/graphql/types/comment.gql';
import { Match } from '@domains/match/presentation/graphql/types/match.gql';
import { Attachment } from '@domains/attachment/presentation/graphql/types/attachment.gql';
import { CommentGqlMapper } from '@domains/session/presentation/mappers/comment.gql.mapper';
import { MatchGqlMapper } from '@domains/match/presentation/mappers/match.gql.mapper';
import { AttachmentGqlMapper } from '@domains/attachment/presentation/mappers/attachment.gql.mapper';

@Resolver(() => Session)
export class SessionFieldResolver {
  constructor(
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getMatchesBySessionUseCase: GetMatchesBySessionUseCase,
    private readonly getAttachmentsBySessionUseCase: GetAttachmentsBySessionUseCase,
  ) {}

  @ResolveField(() => Boolean, { nullable: false })
  async effectiveLocked(
    @Parent() session: Session,
    @CurrentAuth() auth: AuthContext,
  ): Promise<boolean> {
    this.assertSessionAccess(auth, session.localId);
    const attachments = await this.getAttachmentsBySessionUseCase.execute(
      new AttachmentsBySessionInputDto({
        sessionId: session.localId,
      }),
    );
    return attachments.length > 0 && !session.isAdminUnlocked;
  }

  @ResolveField(() => [Comment], { nullable: false })
  async comments(
    @Parent() session: Session,
    @CurrentAuth() auth: AuthContext,
  ): Promise<Comment[]> {
    this.assertSessionAccess(auth, session.localId);
    const comments = await this.getCommentsUseCase.execute(
      new SessionIdInputDto({
        sessionId: session.localId,
      }),
    );
    return comments.map((comment) => CommentGqlMapper.toGql(comment));
  }

  @ResolveField(() => [Match], { nullable: false })
  async matches(
    @Parent() session: Session,
    @CurrentAuth() auth: AuthContext,
  ): Promise<Match[]> {
    this.assertSessionAccess(auth, session.localId);
    const matches = await this.getMatchesBySessionUseCase.execute(
      new MatchesBySessionInputDto({
        sessionId: session.localId,
      }),
    );
    return matches.map((match) => MatchGqlMapper.toGql(match));
  }

  @ResolveField(() => [Attachment], { nullable: false })
  async attachments(
    @Parent() session: Session,
    @CurrentAuth() auth: AuthContext,
  ): Promise<Attachment[]> {
    this.assertSessionAccess(auth, session.localId);
    const attachments = await this.getAttachmentsBySessionUseCase.execute(
      new AttachmentsBySessionInputDto({
        sessionId: session.localId,
      }),
    );
    return attachments.map((attachment) => AttachmentGqlMapper.toGql(attachment));
  }

  private assertSessionAccess(auth: AuthContext, sessionId: string): void {
    if (auth.sessionId !== sessionId) {
      throw new ForbiddenException({
        message: 'Access denied for session',
      });
    }
  }
}
