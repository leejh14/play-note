import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Match } from '@domains/match/domain/aggregates/match.aggregate';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { MatchStatus } from '@domains/match/domain/enums/match-status.enum';
import { Side } from '@domains/match/domain/enums/side.enum';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';
import { MatchTeamMember } from '@domains/match/domain/entities/match-team-member.entity';
import { MatchOrmEntity } from './match.orm-entity';
import { MatchTeamMemberOrmEntity } from './match-team-member.orm-entity';
import { SessionOrmEntity } from '@domains/session/infrastructure/persistence/session.orm-entity';

@Injectable()
export class MikroMatchRepository implements IMatchRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Match | null> {
    const orm = await this.em.findOne(MatchOrmEntity, { id }, {
      populate: ['teamMembers'],
    });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findBySessionId(sessionId: string): Promise<Match[]> {
    const list = await this.em.find(MatchOrmEntity, {
      session: { id: sessionId },
    }, { populate: ['teamMembers'] });
    return list.map((o) => this.toDomainEntity(o));
  }

  async getNextMatchNo(sessionId: string): Promise<number> {
    const last = await this.em.findOne(
      MatchOrmEntity,
      { session: { id: sessionId } },
      { orderBy: { matchNo: 'desc' }, fields: ['matchNo'] },
    );
    return last ? last.matchNo + 1 : 1;
  }

  async save(match: Match): Promise<void> {
    const orm = this.toOrmEntity(match);
    const existing = await this.em.findOne(MatchOrmEntity, { id: match.id });
    if (existing) {
      existing.session = this.em.getReference(SessionOrmEntity, match.sessionId);
      existing.matchNo = orm.matchNo;
      existing.status = orm.status;
      existing.winnerSide = orm.winnerSide;
      existing.teamASide = orm.teamASide;
      existing.isConfirmed = orm.isConfirmed;
      existing.updatedAt = orm.updatedAt;
      existing.teamMembers.removeAll();
      for (const m of orm.teamMembers.getItems()) {
        m.match = existing;
        existing.teamMembers.add(m);
      }
      await this.em.flush();
    } else {
      await this.em.persistAndFlush(orm);
    }
  }

  async delete(match: Match): Promise<void> {
    const orm = await this.em.findOne(MatchOrmEntity, { id: match.id });
    if (orm) {
      await this.em.removeAndFlush(orm);
    }
  }

  private toDomainEntity(orm: MatchOrmEntity): Match {
    const teamMembers = orm.teamMembers.getItems().map((m) =>
      MatchTeamMember.reconstitute({
        id: m.id,
        matchId: orm.id,
        friendId: m.friendId,
        team: m.team as Team,
        lane: m.lane as Lane,
        champion: m.champion,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }),
    );
    return Match.reconstitute({
      id: orm.id,
      sessionId: orm.session.id,
      matchNo: orm.matchNo,
      status: orm.status as MatchStatus,
      winnerSide: orm.winnerSide as Side,
      teamASide: orm.teamASide as Side,
      isConfirmed: orm.isConfirmed,
      teamMembers,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrmEntity(match: Match): MatchOrmEntity {
    const orm = new MatchOrmEntity();
    orm.id = match.id;
    orm.session = this.em.getReference(SessionOrmEntity, match.sessionId);
    orm.matchNo = match.matchNo;
    orm.status = match.status;
    orm.winnerSide = match.winnerSide;
    orm.teamASide = match.teamASide;
    orm.isConfirmed = match.isConfirmed;
    orm.createdAt = match.createdAt;
    orm.updatedAt = match.updatedAt;

    const members = match.getTeamMembers().map((m) => {
      const em = new MatchTeamMemberOrmEntity();
      em.id = m.id;
      em.match = orm;
      em.friendId = m.friendId;
      em.team = m.team;
      em.lane = m.lane;
      em.champion = m.champion;
      em.createdAt = m.createdAt;
      em.updatedAt = m.updatedAt;
      return em;
    });
    orm.teamMembers.set(members);
    return orm;
  }
}
