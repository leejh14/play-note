import { Module } from '@nestjs/common';
import { SharedPresentationModule } from '@shared/presentation/shared.presentation.module';
import { SessionApplicationModule } from '@domains/session/application/session.application.module';
import { FriendApplicationModule } from '@domains/friend/application/friend.application.module';
import { MatchApplicationModule } from '@domains/match/application/match.application.module';
import { AttachmentApplicationModule } from '@domains/attachment/application/attachment.application.module';
import { SessionQueryResolver } from './resolvers/queries/session.query.resolver';
import { SessionMutationResolver } from './resolvers/mutations/session.mutation.resolver';
import { SessionFieldResolver } from './resolvers/field-resolvers/session.field.resolver';
import { AttendanceFieldResolver } from './resolvers/field-resolvers/attendance.field.resolver';
import { TeamPresetMemberFieldResolver } from './resolvers/field-resolvers/team-preset-member.field.resolver';
import '@domains/session/presentation/graphql/enums/content-type.enum.gql';
import '@domains/session/presentation/graphql/enums/session-status.enum.gql';
import '@domains/session/presentation/graphql/enums/attendance-status.enum.gql';
import '@domains/session/presentation/graphql/enums/session-order-field.enum.gql';
import '@shared/presentation/graphql/enums/team.enum.gql';
import '@shared/presentation/graphql/enums/lane.enum.gql';

@Module({
  imports: [
    SharedPresentationModule,
    SessionApplicationModule,
    FriendApplicationModule,
    MatchApplicationModule,
    AttachmentApplicationModule,
  ],
  providers: [
    SessionQueryResolver,
    SessionMutationResolver,
    SessionFieldResolver,
    AttendanceFieldResolver,
    TeamPresetMemberFieldResolver,
  ],
})
export class SessionPresentationModule {}
