import { Module } from '@nestjs/common';
import { GraphileWorkerModule } from '@shared/infrastructure/worker/graphile-worker.module';
import { SessionInfrastructureModule } from '@domains/session/infrastructure/session.infrastructure.module';
import { AttachmentInfrastructureModule } from '@domains/attachment/infrastructure/attachment.infrastructure.module';
import { MatchInfrastructureModule } from '@domains/match/infrastructure/match.infrastructure.module';
import { CreateSessionUseCase } from './use-cases/commands/create-session.use-case';
import { UpdateSessionUseCase } from './use-cases/commands/update-session.use-case';
import { ConfirmSessionUseCase } from './use-cases/commands/confirm-session.use-case';
import { MarkDoneUseCase } from './use-cases/commands/mark-done.use-case';
import { ReopenSessionUseCase } from './use-cases/commands/reopen-session.use-case';
import { DeleteSessionUseCase } from './use-cases/commands/delete-session.use-case';
import { AdminUnlockUseCase } from './use-cases/commands/admin-unlock.use-case';
import { SetAttendanceUseCase } from './use-cases/commands/set-attendance.use-case';
import { SetTeamMemberUseCase } from './use-cases/commands/set-team-member.use-case';
import { BulkSetTeamsUseCase } from './use-cases/commands/bulk-set-teams.use-case';
import { CreateCommentUseCase } from './use-cases/commands/create-comment.use-case';
import { DeleteCommentUseCase } from './use-cases/commands/delete-comment.use-case';
import { GetSessionsUseCase } from './use-cases/queries/get-sessions.use-case';
import { GetSessionUseCase } from './use-cases/queries/get-session.use-case';
import { GetSessionPreviewUseCase } from './use-cases/queries/get-session-preview.use-case';
import { GetCommentsUseCase } from './use-cases/queries/get-comments.use-case';
import { GetCommentUseCase } from './use-cases/queries/get-comment.use-case';

@Module({
  imports: [
    GraphileWorkerModule,
    SessionInfrastructureModule,
    AttachmentInfrastructureModule,
    MatchInfrastructureModule,
  ],
  providers: [
    CreateSessionUseCase,
    UpdateSessionUseCase,
    ConfirmSessionUseCase,
    MarkDoneUseCase,
    ReopenSessionUseCase,
    DeleteSessionUseCase,
    AdminUnlockUseCase,
    SetAttendanceUseCase,
    SetTeamMemberUseCase,
    BulkSetTeamsUseCase,
    CreateCommentUseCase,
    DeleteCommentUseCase,
    GetSessionsUseCase,
    GetSessionUseCase,
    GetSessionPreviewUseCase,
    GetCommentUseCase,
    GetCommentsUseCase,
  ],
  exports: [
    CreateSessionUseCase,
    UpdateSessionUseCase,
    ConfirmSessionUseCase,
    MarkDoneUseCase,
    ReopenSessionUseCase,
    DeleteSessionUseCase,
    AdminUnlockUseCase,
    SetAttendanceUseCase,
    SetTeamMemberUseCase,
    BulkSetTeamsUseCase,
    CreateCommentUseCase,
    DeleteCommentUseCase,
    GetSessionsUseCase,
    GetSessionUseCase,
    GetSessionPreviewUseCase,
    GetCommentUseCase,
    GetCommentsUseCase,
  ],
})
export class SessionApplicationModule {}
