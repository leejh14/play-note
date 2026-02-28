import {
  Args,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { assertGlobalIdType } from '@libs/relay';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { RequireAdmin } from '@auth/decorators/require-admin.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { CreateSessionUseCase } from '@domains/session/application/use-cases/commands/create-session.use-case';
import { ConfirmSessionUseCase } from '@domains/session/application/use-cases/commands/confirm-session.use-case';
import { UpdateSessionUseCase } from '@domains/session/application/use-cases/commands/update-session.use-case';
import { MarkDoneUseCase } from '@domains/session/application/use-cases/commands/mark-done.use-case';
import { ReopenSessionUseCase } from '@domains/session/application/use-cases/commands/reopen-session.use-case';
import { DeleteSessionUseCase } from '@domains/session/application/use-cases/commands/delete-session.use-case';
import { SetAttendanceUseCase } from '@domains/session/application/use-cases/commands/set-attendance.use-case';
import { SetTeamMemberUseCase } from '@domains/session/application/use-cases/commands/set-team-member.use-case';
import { BulkSetTeamsUseCase } from '@domains/session/application/use-cases/commands/bulk-set-teams.use-case';
import { CreateCommentUseCase } from '@domains/session/application/use-cases/commands/create-comment.use-case';
import { DeleteCommentUseCase } from '@domains/session/application/use-cases/commands/delete-comment.use-case';
import { AdminUnlockUseCase } from '@domains/session/application/use-cases/commands/admin-unlock.use-case';
import { GetSessionUseCase } from '@domains/session/application/use-cases/queries/get-session.use-case';
import { GetCommentUseCase } from '@domains/session/application/use-cases/queries/get-comment.use-case';
import { CreateSessionInputDto } from '@domains/session/application/dto/inputs/create-session.input.dto';
import { SessionIdInputDto } from '@domains/session/application/dto/inputs/session-id.input.dto';
import { UpdateSessionInputDto } from '@domains/session/application/dto/inputs/update-session.input.dto';
import { SetAttendanceInputDto } from '@domains/session/application/dto/inputs/set-attendance.input.dto';
import { SetTeamMemberInputDto } from '@domains/session/application/dto/inputs/set-team-member.input.dto';
import { BulkSetTeamsInputDto } from '@domains/session/application/dto/inputs/bulk-set-teams.input.dto';
import { CreateCommentInputDto } from '@domains/session/application/dto/inputs/create-comment.input.dto';
import { CommentIdInputDto } from '@domains/session/application/dto/inputs/comment-id.input.dto';
import { Session } from '@domains/session/presentation/graphql/types/session.gql';
import { Comment } from '@domains/session/presentation/graphql/types/comment.gql';
import {
  CreateSessionPayload,
  ConfirmSessionPayload,
  UpdateSessionPayload,
  MarkDonePayload,
  ReopenSessionPayload,
  DeleteSessionPayload,
  SetAttendancePayload,
  SetTeamMemberPayload,
  BulkSetTeamsPayload,
  CreateCommentPayload,
  DeleteCommentPayload,
  AdminUnlockPayload,
} from '@domains/session/presentation/graphql/types/session-mutation.payload.gql';
import { CreateSessionInput } from '@domains/session/presentation/graphql/inputs/create-session.input.gql';
import { ConfirmSessionInput } from '@domains/session/presentation/graphql/inputs/confirm-session.input.gql';
import { UpdateSessionInput } from '@domains/session/presentation/graphql/inputs/update-session.input.gql';
import { MarkDoneInput } from '@domains/session/presentation/graphql/inputs/mark-done.input.gql';
import { ReopenSessionInput } from '@domains/session/presentation/graphql/inputs/reopen-session.input.gql';
import { DeleteSessionInput } from '@domains/session/presentation/graphql/inputs/delete-session.input.gql';
import { SetAttendanceInput } from '@domains/session/presentation/graphql/inputs/set-attendance.input.gql';
import { SetTeamMemberInput } from '@domains/session/presentation/graphql/inputs/set-team-member.input.gql';
import { BulkSetTeamsInput } from '@domains/session/presentation/graphql/inputs/bulk-set-teams.input.gql';
import { CreateCommentInput } from '@domains/session/presentation/graphql/inputs/create-comment.input.gql';
import { DeleteCommentInput } from '@domains/session/presentation/graphql/inputs/delete-comment.input.gql';
import { AdminUnlockInput } from '@domains/session/presentation/graphql/inputs/admin-unlock.input.gql';
import { SessionGqlMapper } from '@domains/session/presentation/mappers/session.gql.mapper';
import { CommentGqlMapper } from '@domains/session/presentation/mappers/comment.gql.mapper';

@Resolver()
export class SessionMutationResolver {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly confirmSessionUseCase: ConfirmSessionUseCase,
    private readonly updateSessionUseCase: UpdateSessionUseCase,
    private readonly markDoneUseCase: MarkDoneUseCase,
    private readonly reopenSessionUseCase: ReopenSessionUseCase,
    private readonly deleteSessionUseCase: DeleteSessionUseCase,
    private readonly setAttendanceUseCase: SetAttendanceUseCase,
    private readonly setTeamMemberUseCase: SetTeamMemberUseCase,
    private readonly bulkSetTeamsUseCase: BulkSetTeamsUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly adminUnlockUseCase: AdminUnlockUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getCommentUseCase: GetCommentUseCase,
  ) {}

  @Mutation(() => CreateSessionPayload, { nullable: false })
  async createSession(
    @Args('input', { type: () => CreateSessionInput })
    input: CreateSessionInput,
  ): Promise<CreateSessionPayload> {
    const output = await this.createSessionUseCase.execute(
      new CreateSessionInputDto({
        contentType: input.contentType,
        title: input.title,
        startsAt: input.startsAt,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );

    return Object.assign(new CreateSessionPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
      editorToken: output.editorToken,
      adminToken: output.adminToken,
    });
  }

  @Mutation(() => ConfirmSessionPayload, { nullable: false })
  async confirmSession(
    @Args('input', { type: () => ConfirmSessionInput })
    input: ConfirmSessionInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<ConfirmSessionPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.confirmSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new ConfirmSessionPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @Mutation(() => UpdateSessionPayload, { nullable: false })
  async updateSession(
    @Args('input', { type: () => UpdateSessionInput })
    input: UpdateSessionInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<UpdateSessionPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.updateSessionUseCase.execute(
      new UpdateSessionInputDto({
        sessionId,
        title: input.title,
        startsAt: input.startsAt,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new UpdateSessionPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @Mutation(() => MarkDonePayload, { nullable: false })
  async markDone(
    @Args('input', { type: () => MarkDoneInput })
    input: MarkDoneInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<MarkDonePayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.markDoneUseCase.execute(
      new SessionIdInputDto({
        sessionId,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new MarkDonePayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @RequireAdmin()
  @Mutation(() => ReopenSessionPayload, { nullable: false })
  async reopenSession(
    @Args('input', { type: () => ReopenSessionInput })
    input: ReopenSessionInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<ReopenSessionPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.reopenSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new ReopenSessionPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @RequireAdmin()
  @Mutation(() => DeleteSessionPayload, { nullable: false })
  async deleteSession(
    @Args('input', { type: () => DeleteSessionInput })
    input: DeleteSessionInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<DeleteSessionPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    await this.deleteSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId,
      }),
    );
    return Object.assign(new DeleteSessionPayload(), {
      clientMutationId: input.clientMutationId,
      deletedSessionLocalId: sessionId,
    });
  }

  @Mutation(() => SetAttendancePayload, { nullable: false })
  async setAttendance(
    @Args('input', { type: () => SetAttendanceInput })
    input: SetAttendanceInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<SetAttendancePayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    const output = await this.setAttendanceUseCase.execute(
      new SetAttendanceInputDto({
        sessionId,
        friendId,
        status: input.status,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new SetAttendancePayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @Mutation(() => SetTeamMemberPayload, { nullable: false })
  async setTeamMember(
    @Args('input', { type: () => SetTeamMemberInput })
    input: SetTeamMemberInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<SetTeamMemberPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    const output = await this.setTeamMemberUseCase.execute(
      new SetTeamMemberInputDto({
        sessionId,
        friendId,
        team: input.team,
        lane: input.lane,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new SetTeamMemberPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @Mutation(() => BulkSetTeamsPayload, { nullable: false })
  async bulkSetTeams(
    @Args('input', { type: () => BulkSetTeamsInput })
    input: BulkSetTeamsInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<BulkSetTeamsPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.bulkSetTeamsUseCase.execute(
      new BulkSetTeamsInputDto({
        sessionId,
        assignments: input.assignments.map((assignment) => ({
          friendId: this.decodeGlobalId(assignment.friendId, 'Friend'),
          team: assignment.team,
          lane: assignment.lane,
        })),
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new BulkSetTeamsPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
  }

  @Mutation(() => CreateCommentPayload, { nullable: false })
  async createComment(
    @Args('input', { type: () => CreateCommentInput })
    input: CreateCommentInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<CreateCommentPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.createCommentUseCase.execute(
      new CreateCommentInputDto({
        sessionId,
        body: input.body,
        displayName: input.displayName,
      }),
    );
    const comment = await this.getCommentUseCase.execute(
      new CommentIdInputDto({
        commentId: output.id,
      }),
    );
    return Object.assign(new CreateCommentPayload(), {
      clientMutationId: input.clientMutationId,
      commentId: output.id,
      comment: CommentGqlMapper.toGql(comment),
    });
  }

  @Mutation(() => DeleteCommentPayload, { nullable: false })
  async deleteComment(
    @Args('input', { type: () => DeleteCommentInput })
    input: DeleteCommentInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<DeleteCommentPayload> {
    const commentId = this.decodeGlobalId(input.commentId, 'Comment');
    const comment = await this.getCommentUseCase.execute(
      new CommentIdInputDto({
        commentId,
      }),
    );
    this.assertSessionAccess(auth, comment.sessionId);

    await this.deleteCommentUseCase.execute(
      new CommentIdInputDto({
        commentId,
      }),
    );
    return Object.assign(new DeleteCommentPayload(), {
      clientMutationId: input.clientMutationId,
      deletedCommentLocalId: commentId,
    });
  }

  @RequireAdmin()
  @Mutation(() => AdminUnlockPayload, { nullable: false })
  async adminUnlock(
    @Args('input', { type: () => AdminUnlockInput })
    input: AdminUnlockInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<AdminUnlockPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.adminUnlockUseCase.execute(
      new SessionIdInputDto({
        sessionId,
      }),
    );
    const session = await this.getSessionUseCase.execute(
      new SessionIdInputDto({
        sessionId: output.id,
      }),
    );
    return Object.assign(new AdminUnlockPayload(), {
      clientMutationId: input.clientMutationId,
      sessionId: output.id,
      session: SessionGqlMapper.toGql(session),
    });
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
