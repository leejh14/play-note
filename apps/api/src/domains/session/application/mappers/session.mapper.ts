import { Session } from '@domains/session/domain/aggregates/session.aggregate';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';
import { SessionOutputDto } from '../dto/outputs/session.output.dto';
import { SessionDetailOutputDto } from '../dto/outputs/session-detail.output.dto';
import { SessionPreviewOutputDto } from '../dto/outputs/session-preview.output.dto';
import { AttendanceOutputDto } from '../dto/outputs/attendance.output.dto';
import { TeamPresetMemberOutputDto } from '../dto/outputs/team-preset-member.output.dto';

export class SessionMapper {
  static toDto(
    session: Session,
    attendingCount: number,
    matchCount: number,
  ): SessionOutputDto {
    return new SessionOutputDto({
      id: session.id,
      contentType: session.contentType,
      title: session.title,
      startsAt: session.startsAt,
      status: session.status,
      attendingCount,
      matchCount,
      createdAt: session.createdAt,
    });
  }

  static toDetailDto(session: Session): SessionDetailOutputDto {
    const attendances = session.getAttendances().map(
      (a) =>
        new AttendanceOutputDto({
          id: a.id,
          friendId: a.friendId,
          status: a.status,
        }),
    );
    const teamPresetMembers = session.getTeamPresetMembers().map(
      (t) =>
        new TeamPresetMemberOutputDto({
          id: t.id,
          friendId: t.friendId,
          team: t.team,
          lane: t.lane,
        }),
    );
    return new SessionDetailOutputDto({
      id: session.id,
      contentType: session.contentType,
      title: session.title,
      startsAt: session.startsAt,
      status: session.status,
      isAdminUnlocked: session.isAdminUnlocked,
      editorToken: session.editorToken,
      adminToken: session.adminToken,
      attendances,
      teamPresetMembers,
      createdAt: session.createdAt,
    });
  }

  static toPreviewDto(session: Session): SessionPreviewOutputDto {
    return new SessionPreviewOutputDto({
      contentType: session.contentType,
      title: session.title,
      startsAt: session.startsAt,
    });
  }

  static attendingCount(session: Session): number {
    return session
      .getAttendances()
      .filter((a) => a.status === AttendanceStatus.ATTENDING).length;
  }
}
