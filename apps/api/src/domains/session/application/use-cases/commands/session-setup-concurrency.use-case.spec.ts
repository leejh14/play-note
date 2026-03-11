import { EntityManager } from '@mikro-orm/core';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';
import { Session } from '@domains/session/domain/aggregates/session.aggregate';
import { Attendance } from '@domains/session/domain/entities/attendance.entity';
import { TeamPresetMember } from '@domains/session/domain/entities/team-preset-member.entity';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';
import type { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SetAttendanceUseCase } from './set-attendance.use-case';
import { SetTeamMemberUseCase } from './set-team-member.use-case';
import { BulkSetTeamsUseCase } from './bulk-set-teams.use-case';
import { ConfirmSessionUseCase } from './confirm-session.use-case';
import { SetAttendanceInputDto } from '../../dto/inputs/set-attendance.input.dto';
import { SetTeamMemberInputDto } from '../../dto/inputs/set-team-member.input.dto';
import { BulkSetTeamsInputDto } from '../../dto/inputs/bulk-set-teams.input.dto';
import { ConfirmSessionInputDto } from '../../dto/inputs/confirm-session.input.dto';

describe('session setup concurrency guards', () => {
  it('rejects stale attendance updates', async () => {
    const session = buildSession();
    const repository = buildRepository(session);
    const useCase = new SetAttendanceUseCase(
      repository,
      buildEntityManager(),
    );

    await expect(
      useCase.execute(
        new SetAttendanceInputDto({
          sessionId: session.id,
          friendId: 'friend-1',
          status: AttendanceStatus.ATTENDING,
          expectedUpdatedAt: new Date('2026-03-09T08:59:59.000Z'),
        }),
      ),
    ).rejects.toMatchObject({
      errorCode: 'SESSION_CONFLICT',
    });

    expect(repository.findByIdForUpdate).toHaveBeenCalledWith(session.id);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects stale team member updates', async () => {
    const session = buildSession();
    const repository = buildRepository(session);
    const useCase = new SetTeamMemberUseCase(
      repository,
      buildEntityManager(),
    );

    await expect(
      useCase.execute(
        new SetTeamMemberInputDto({
          sessionId: session.id,
          friendId: 'friend-1',
          team: Team.A,
          lane: Lane.TOP,
          expectedUpdatedAt: new Date('2026-03-09T08:59:59.000Z'),
        }),
      ),
    ).rejects.toMatchObject({
      errorCode: 'SESSION_CONFLICT',
    });

    expect(repository.findByIdForUpdate).toHaveBeenCalledWith(session.id);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects stale bulk team updates', async () => {
    const session = buildSession();
    const repository = buildRepository(session);
    const useCase = new BulkSetTeamsUseCase(
      repository,
      buildEntityManager(),
    );

    await expect(
      useCase.execute(
        new BulkSetTeamsInputDto({
          sessionId: session.id,
          expectedUpdatedAt: new Date('2026-03-09T08:59:59.000Z'),
          assignments: [
            {
              friendId: 'friend-1',
              team: Team.A,
              lane: Lane.TOP,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      errorCode: 'SESSION_CONFLICT',
    });

    expect(repository.findByIdForUpdate).toHaveBeenCalledWith(session.id);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects stale confirm requests', async () => {
    const session = buildSession();
    const repository = buildRepository(session);
    const useCase = new ConfirmSessionUseCase(
      repository,
      buildEntityManager(),
    );

    await expect(
      useCase.execute(
        new ConfirmSessionInputDto({
          sessionId: session.id,
          expectedUpdatedAt: new Date('2026-03-09T08:59:59.000Z'),
        }),
      ),
    ).rejects.toMatchObject({
      errorCode: 'SESSION_CONFLICT',
    });

    expect(repository.findByIdForUpdate).toHaveBeenCalledWith(session.id);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

function buildRepository(session: Session): jest.Mocked<ISessionRepository> {
  return {
    findById: jest.fn(),
    findByIdForUpdate: jest.fn().mockResolvedValue(session),
    findByToken: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function buildEntityManager(): EntityManager {
  return Object.assign(Object.create(EntityManager.prototype), {
    transactional: async <T>(callback: () => Promise<T>) => callback(),
    getContext() {
      return this;
    },
  }) as EntityManager;
}

function buildSession(): Session {
  const createdAt = new Date('2026-03-09T08:00:00.000Z');
  const updatedAt = new Date('2026-03-09T09:00:00.000Z');

  return Session.reconstitute({
    id: 'session-1',
    contentType: ContentType.LOL,
    title: 'Session 1',
    startsAt: new Date('2026-03-10T10:00:00.000Z'),
    status: SessionStatus.SCHEDULED,
    editorToken: 'editor-token',
    adminToken: 'admin-token',
    isStructureLocked: false,
    attendances: [
      Attendance.reconstitute({
        id: 'attendance-1',
        sessionId: 'session-1',
        friendId: 'friend-1',
        status: AttendanceStatus.UNDECIDED,
        createdAt,
        updatedAt,
      }),
    ],
    teamPresetMembers: [
      TeamPresetMember.reconstitute({
        id: 'preset-1',
        sessionId: 'session-1',
        friendId: 'friend-1',
        team: Team.B,
        lane: Lane.JG,
        createdAt,
        updatedAt,
      }),
    ],
    createdAt,
    updatedAt,
  });
}
