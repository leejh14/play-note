import { ConnectionDto } from '@libs/relay';
import { toGlobalId } from '@libs/relay';
import { SessionOutputDto } from '@domains/session/application/dto/outputs/session.output.dto';
import { SessionDetailOutputDto } from '@domains/session/application/dto/outputs/session-detail.output.dto';
import { SessionPreviewOutputDto } from '@domains/session/application/dto/outputs/session-preview.output.dto';
import { Session } from '@domains/session/presentation/graphql/types/session.gql';
import { SessionPreview } from '@domains/session/presentation/graphql/types/session-preview.gql';
import { SessionConnection, SessionEdge } from '@domains/session/presentation/graphql/types/session-connection.gql';
import { AttendanceGqlMapper } from './attendance.gql.mapper';
import { TeamPresetMemberGqlMapper } from './team-preset-member.gql.mapper';

export class SessionGqlMapper {
  static toGql(
    dto: SessionOutputDto | SessionDetailOutputDto,
  ): Session {
    const gql = new Session();
    gql.id = toGlobalId('Session', dto.id);
    gql.localId = dto.id;
    gql.contentType = dto.contentType;
    gql.title = dto.title;
    gql.startsAt = dto.startsAt;
    gql.status = dto.status;
    gql.isAdminUnlocked = 'isAdminUnlocked' in dto ? dto.isAdminUnlocked : false;
    gql.attendingCount =
      'attendingCount' in dto ? dto.attendingCount : dto.attendances.length;
    gql.matchCount = 'matchCount' in dto ? dto.matchCount : 0;
    gql.effectiveLocked = false;
    gql.attendances =
      'attendances' in dto
        ? dto.attendances.map((attendance) => AttendanceGqlMapper.toGql(attendance))
        : [];
    gql.teamPresetMembers =
      'teamPresetMembers' in dto
        ? dto.teamPresetMembers.map((member) =>
            TeamPresetMemberGqlMapper.toGql(member),
          )
        : [];
    gql.matches = [];
    gql.attachments = [];
    gql.comments = [];
    gql.createdAt = dto.createdAt;
    gql.updatedAt = dto.createdAt;
    return gql;
  }

  static toConnectionGql(
    connection: ConnectionDto<SessionOutputDto>,
  ): SessionConnection {
    const gql = new SessionConnection();
    gql.edges = connection.edges.map((edge) => {
      const gqlEdge = new SessionEdge();
      gqlEdge.cursor = edge.cursor;
      gqlEdge.node = SessionGqlMapper.toGql(edge.node);
      return gqlEdge;
    });
    gql.pageInfo = connection.pageInfo;
    return gql;
  }

  static toPreviewGql(dto: SessionPreviewOutputDto): SessionPreview {
    const gql = new SessionPreview();
    gql.contentType = dto.contentType;
    gql.title = dto.title;
    gql.startsAt = dto.startsAt;
    return gql;
  }

  static toSessionIdGql(localId: string): string {
    return toGlobalId('Session', localId);
  }
}
