import { Module } from '@nestjs/common';
import { MatchStatsContextAcl } from './acl/match-stats-context.acl';
import { FriendStatsContextAcl } from './acl/friend-stats-context.acl';
import {
  MATCH_STATS_CONTEXT_ACL,
  FRIEND_STATS_CONTEXT_ACL,
} from '@domains/statistics/domain/constants';
import { FriendInfrastructureModule } from '@domains/friend/infrastructure/friend.infrastructure.module';
import { MatchInfrastructureModule } from '@domains/match/infrastructure/match.infrastructure.module';

@Module({
  imports: [FriendInfrastructureModule, MatchInfrastructureModule],
  providers: [
    { provide: MATCH_STATS_CONTEXT_ACL, useClass: MatchStatsContextAcl },
    { provide: FRIEND_STATS_CONTEXT_ACL, useClass: FriendStatsContextAcl },
  ],
  exports: [MATCH_STATS_CONTEXT_ACL, FRIEND_STATS_CONTEXT_ACL],
})
export class StatisticsInfrastructureModule {}
