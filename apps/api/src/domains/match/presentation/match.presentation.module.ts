import { Module } from '@nestjs/common';
import { SharedPresentationModule } from '@shared/presentation/shared.presentation.module';
import { MatchApplicationModule } from '@domains/match/application/match.application.module';
import { SessionApplicationModule } from '@domains/session/application/session.application.module';
import { FriendApplicationModule } from '@domains/friend/application/friend.application.module';
import { AttachmentApplicationModule } from '@domains/attachment/application/attachment.application.module';
import { MatchMutationResolver } from './resolvers/mutations/match.mutation.resolver';
import { MatchFieldResolver } from './resolvers/field-resolvers/match.field.resolver';
import { MatchTeamMemberFieldResolver } from './resolvers/field-resolvers/match-team-member.field.resolver';
import '@domains/match/presentation/graphql/enums/match-status.enum.gql';
import '@domains/match/presentation/graphql/enums/side.enum.gql';
import '@shared/presentation/graphql/enums/team.enum.gql';
import '@shared/presentation/graphql/enums/lane.enum.gql';

@Module({
  imports: [
    SharedPresentationModule,
    MatchApplicationModule,
    SessionApplicationModule,
    FriendApplicationModule,
    AttachmentApplicationModule,
  ],
  providers: [
    MatchMutationResolver,
    MatchFieldResolver,
    MatchTeamMemberFieldResolver,
  ],
})
export class MatchPresentationModule {}
