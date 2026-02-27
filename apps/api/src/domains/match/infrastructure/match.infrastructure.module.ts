import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MatchOrmEntity } from './persistence/match.orm-entity';
import { MatchTeamMemberOrmEntity } from './persistence/match-team-member.orm-entity';
import { MikroMatchRepository } from './persistence/mikro-match.repository';
import { SessionContextAcl } from './acl/session-context.acl';
import { MATCH_REPOSITORY } from '@domains/match/domain/constants';
import { SessionInfrastructureModule } from '@domains/session/infrastructure/session.infrastructure.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MatchOrmEntity, MatchTeamMemberOrmEntity]),
    SessionInfrastructureModule,
  ],
  providers: [
    { provide: MATCH_REPOSITORY, useClass: MikroMatchRepository },
    SessionContextAcl,
  ],
  exports: [MATCH_REPOSITORY, SessionContextAcl],
})
export class MatchInfrastructureModule {}
