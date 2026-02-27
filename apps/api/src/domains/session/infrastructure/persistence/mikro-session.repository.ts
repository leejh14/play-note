import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConnectionDto, EdgeDto, PageInfoDto } from '@libs/relay';
import { Session } from '@domains/session/domain/aggregates/session.aggregate';
import {
  ISessionRepository,
  FindAllSessionArgs,
  SessionOrderField,
} from '@domains/session/domain/repositories/session.repository.interface';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';
import { Attendance } from '@domains/session/domain/entities/attendance.entity';
import { TeamPresetMember } from '@domains/session/domain/entities/team-preset-member.entity';
import { SessionOrmEntity } from './session.orm-entity';
import { AttendanceOrmEntity } from './attendance.orm-entity';
import { TeamPresetMemberOrmEntity } from './team-preset-member.orm-entity';

@Injectable()
export class MikroSessionRepository implements ISessionRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Session | null> {
    const orm = await this.em.findOne(SessionOrmEntity, { id }, {
      populate: ['attendances', 'teamPresetMembers'],
    });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const orm = await this.em.findOne(
      SessionOrmEntity,
      { $or: [{ editorToken: token }, { adminToken: token }] },
      { populate: ['attendances', 'teamPresetMembers'] },
    );
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findAll(args: FindAllSessionArgs): Promise<ConnectionDto<Session>> {
    const where: Record<string, unknown> = {};
    if (args.filter?.contentType !== undefined) {
      where.contentType = args.filter.contentType;
    }

    const orderBy = this.buildOrderBy(args.orderBy);
    const cursorOpts: Parameters<EntityManager['findByCursor']>[2] = {
      orderBy,
      first: args.first,
      after: args.after,
      last: args.last,
      before: args.before,
    };

    const cursor = await this.em.findByCursor(SessionOrmEntity, where, cursorOpts);

    const items = cursor.items as SessionOrmEntity[];
    const sessions = items.map((o) => this.toDomainEntity(o));

    const edges = sessions.map((s, i) => new EdgeDto({
      node: s,
      cursor: cursor.from(items[i]),
    }));

    const pageInfo = new PageInfoDto({
      hasNextPage: cursor.hasNextPage,
      hasPreviousPage: cursor.hasPrevPage,
      startCursor: cursor.startCursor,
      endCursor: cursor.endCursor,
    });

    return new ConnectionDto({ edges, pageInfo });
  }

  async save(session: Session): Promise<void> {
    const orm = this.toOrmEntity(session);
    const existing = await this.em.findOne(SessionOrmEntity, { id: session.id });
    if (existing) {
      existing.contentType = orm.contentType;
      existing.title = orm.title;
      existing.startsAt = orm.startsAt;
      existing.status = orm.status;
      existing.isAdminUnlocked = orm.isAdminUnlocked;
      existing.updatedAt = orm.updatedAt;
      existing.attendances.removeAll();
      for (const a of orm.attendances.getItems()) {
        a.session = existing;
        existing.attendances.add(a);
      }
      existing.teamPresetMembers.removeAll();
      for (const t of orm.teamPresetMembers.getItems()) {
        t.session = existing;
        existing.teamPresetMembers.add(t);
      }
      await this.em.flush();
    } else {
      await this.em.persistAndFlush(orm);
    }
  }

  async delete(session: Session): Promise<void> {
    const orm = await this.em.findOne(SessionOrmEntity, { id: session.id });
    if (orm) {
      await this.em.removeAndFlush(orm);
    }
  }

  private buildOrderBy(
    orderBy?: { field: SessionOrderField; direction: 'ASC' | 'DESC' }[],
  ): Record<string, 'asc' | 'desc'> {
    const defaults: Record<string, 'asc' | 'desc'> = {
      startsAt: 'asc',
      status: 'asc',
      id: 'asc',
    };
    if (!orderBy?.length) return defaults;

    const result: Record<string, 'asc' | 'desc'> = {};
    for (const o of orderBy) {
      const dir = o.direction === 'DESC' ? 'desc' : 'asc';
      if (o.field === 'STARTS_AT') result.startsAt = dir;
      else if (o.field === 'CREATED_AT') result.createdAt = dir;
      else if (o.field === 'DATE_PROXIMITY') result.startsAt = dir;
      else if (o.field === 'STATUS_PRIORITY') result.status = dir;
    }
    result.id = orderBy[orderBy.length - 1]?.direction === 'DESC' ? 'desc' : 'asc';
    return result;
  }

  private toDomainEntity(orm: SessionOrmEntity): Session {
    const attendances = orm.attendances.getItems().map((a) =>
      Attendance.reconstitute({
        id: a.id,
        sessionId: orm.id,
        friendId: a.friendId,
        status: a.status as AttendanceStatus,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }),
    );
    const teamPresetMembers = orm.teamPresetMembers.getItems().map((t) =>
      TeamPresetMember.reconstitute({
        id: t.id,
        sessionId: orm.id,
        friendId: t.friendId,
        team: t.team as Team,
        lane: t.lane as Lane,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }),
    );
    return Session.reconstitute({
      id: orm.id,
      contentType: orm.contentType as ContentType,
      title: orm.title,
      startsAt: orm.startsAt,
      status: orm.status as SessionStatus,
      editorToken: orm.editorToken,
      adminToken: orm.adminToken,
      isAdminUnlocked: orm.isAdminUnlocked,
      attendances,
      teamPresetMembers,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrmEntity(session: Session): SessionOrmEntity {
    const orm = new SessionOrmEntity();
    orm.id = session.id;
    orm.contentType = session.contentType;
    orm.title = session.title;
    orm.startsAt = session.startsAt;
    orm.status = session.status;
    orm.editorToken = session.editorToken;
    orm.adminToken = session.adminToken;
    orm.isAdminUnlocked = session.isAdminUnlocked;
    orm.createdAt = session.createdAt;
    orm.updatedAt = session.updatedAt;

    const attendances = session.getAttendances().map((a) => {
      const ea = new AttendanceOrmEntity();
      ea.id = a.id;
      ea.session = orm;
      ea.friendId = a.friendId;
      ea.status = a.status;
      ea.createdAt = a.createdAt;
      ea.updatedAt = a.updatedAt;
      return ea;
    });
    const teamPresetMembers = session.getTeamPresetMembers().map((t) => {
      const et = new TeamPresetMemberOrmEntity();
      et.id = t.id;
      et.session = orm;
      et.friendId = t.friendId;
      et.team = t.team;
      et.lane = t.lane;
      et.createdAt = t.createdAt;
      et.updatedAt = t.updatedAt;
      return et;
    });

    orm.attendances.set(attendances);
    orm.teamPresetMembers.set(teamPresetMembers);
    return orm;
  }
}
