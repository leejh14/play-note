import { Module } from '@nestjs/common';
import { MatchStatsContextAcl } from './acl/match-stats-context.acl';
import { FriendStatsContextAcl } from './acl/friend-stats-context.acl';
import { FriendInfrastructureModule } from '@domains/friend/infrastructure/friend.infrastructure.module';
import { MatchInfrastructureModule } from '@domains/match/infrastructure/match.infrastructure.module';

@Module({
  imports: [FriendInfrastructureModule, MatchInfrastructureModule],
  providers: [MatchStatsContextAcl, FriendStatsContextAcl],
  exports: [MatchStatsContextAcl, FriendStatsContextAcl],
})
export class StatisticsInfrastructureModule {}
