import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { SessionOrmEntity } from "./persistence/session.orm-entity";
import { AttendanceOrmEntity } from "./persistence/attendance.orm-entity";
import { TeamPresetMemberOrmEntity } from "./persistence/team-preset-member.orm-entity";
import { CommentOrmEntity } from "./persistence/comment.orm-entity";
import { MikroSessionRepository } from "./persistence/mikro-session.repository";
import { MikroCommentRepository } from "./persistence/mikro-comment.repository";
import { MikroSessionTokenReader } from "./persistence/mikro-session-token.reader";
import { FriendContextAcl } from "./acl/friend-context.acl";
import { SESSION_TOKEN_READER } from "@auth/constants/tokens";
import {
  SESSION_REPOSITORY,
  COMMENT_REPOSITORY,
  FRIEND_CONTEXT_ACL,
} from "@domains/session/domain/constants";
import { FriendInfrastructureModule } from "@domains/friend/infrastructure/friend.infrastructure.module";

@Module({
  imports: [
    MikroOrmModule.forFeature([
      SessionOrmEntity,
      AttendanceOrmEntity,
      TeamPresetMemberOrmEntity,
      CommentOrmEntity,
    ]),
    FriendInfrastructureModule,
  ],
  providers: [
    { provide: SESSION_REPOSITORY, useClass: MikroSessionRepository },
    { provide: COMMENT_REPOSITORY, useClass: MikroCommentRepository },
    { provide: SESSION_TOKEN_READER, useClass: MikroSessionTokenReader },
    { provide: FRIEND_CONTEXT_ACL, useClass: FriendContextAcl },
  ],
  exports: [
    SESSION_REPOSITORY,
    COMMENT_REPOSITORY,
    SESSION_TOKEN_READER,
    FRIEND_CONTEXT_ACL,
  ],
})
export class SessionInfrastructureModule {}
