import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MatchOrmEntity } from './persistence/match.orm-entity';
import { MatchTeamMemberOrmEntity } from './persistence/match-team-member.orm-entity';
import { MikroMatchRepository } from './persistence/mikro-match.repository';
import { SessionContextAcl } from './acl/session-context.acl';
import { MATCH_REPOSITORY, SESSION_CONTEXT_ACL } from '@domains/match/domain/constants';
import { SessionInfrastructureModule } from '@domains/session/infrastructure/session.infrastructure.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MatchOrmEntity, MatchTeamMemberOrmEntity]),
    SessionInfrastructureModule,
  ],
  providers: [
    { provide: MATCH_REPOSITORY, useClass: MikroMatchRepository },
    { provide: SESSION_CONTEXT_ACL, useClass: SessionContextAcl },
  ],
  exports: [MATCH_REPOSITORY, SESSION_CONTEXT_ACL],
})
export class MatchInfrastructureModule {}
