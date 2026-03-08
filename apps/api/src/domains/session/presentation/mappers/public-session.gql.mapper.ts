import { ConnectionDto } from '@libs/relay';
import { SessionDetailOutputDto } from '@domains/session/application/dto/outputs/session-detail.output.dto';
import { CommentOutputDto } from '@domains/session/application/dto/outputs/comment.output.dto';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';
import { MatchOutputDto } from '@domains/match/application/dto/outputs/match.output.dto';
import { AttachmentOutputDto } from '@domains/attachment/application/dto/outputs/attachment.output.dto';
import { ExtractionResultOutputDto } from '@domains/attachment/application/dto/outputs/extraction-result.output.dto';
import { AttendanceGqlMapper } from './attendance.gql.mapper';
import { TeamPresetMemberGqlMapper } from './team-preset-member.gql.mapper';
import { CommentGqlMapper } from './comment.gql.mapper';
import { MatchTeamMemberGqlMapper } from '@domains/match/presentation/mappers/match-team-member.gql.mapper';
import { ExtractionResultGqlMapper } from '@domains/attachment/presentation/mappers/extraction-result.gql.mapper';
import {
  PublicAttachment,
  PublicMatch,
  PublicSession,
} from '@domains/session/presentation/graphql/types/public-session.gql';
import {
  PublicSessionConnection,
  PublicSessionEdge,
} from '@domains/session/presentation/graphql/types/public-session-connection.gql';

type PublicMatchData = {
  match: MatchOutputDto;
  attachments: AttachmentOutputDto[];
  extractionResults: ExtractionResultOutputDto[];
};

type PublicSessionData = {
  session: SessionDetailOutputDto;
  comments: CommentOutputDto[];
  attachments: AttachmentOutputDto[];
  matches: PublicMatchData[];
};

export class PublicSessionGqlMapper {
  static toGql(data: PublicSessionData): PublicSession {
    const gql = new PublicSession();
    gql.localId = data.session.id;
    gql.contentType = data.session.contentType;
    gql.title = data.session.title;
    gql.startsAt = data.session.startsAt;
    gql.status = data.session.status;
    gql.isStructureLocked = data.session.isStructureLocked;
    gql.effectiveLocked = data.session.isStructureLocked;
    gql.attendingCount = data.session.attendances.filter(
      (attendance) => attendance.status === AttendanceStatus.ATTENDING,
    ).length;
    gql.matchCount = data.matches.length;
    gql.attendances = data.session.attendances.map((attendance) =>
      AttendanceGqlMapper.toGql(attendance),
    );
    gql.teamPresetMembers = data.session.teamPresetMembers.map((member) =>
      TeamPresetMemberGqlMapper.toGql(member),
    );
    gql.matches = data.matches.map((match) => this.toPublicMatch(match));
    gql.attachments = data.attachments.map((attachment) =>
      this.toPublicAttachment(attachment),
    );
    gql.comments = data.comments.map((comment) => CommentGqlMapper.toGql(comment));
    gql.createdAt = data.session.createdAt;
    return gql;
  }

  static toConnectionGql(
    connection: ConnectionDto<PublicSessionData>,
  ): PublicSessionConnection {
    const gql = new PublicSessionConnection();
    gql.edges = connection.edges.map((edge) => {
      const gqlEdge = new PublicSessionEdge();
      gqlEdge.cursor = edge.cursor;
      gqlEdge.node = PublicSessionGqlMapper.toGql(edge.node);
      return gqlEdge;
    });
    gql.pageInfo = connection.pageInfo;
    return gql;
  }

  private static toPublicMatch(data: PublicMatchData): PublicMatch {
    const gql = new PublicMatch();
    gql.localId = data.match.id;
    gql.matchNo = data.match.matchNo;
    gql.status = data.match.status;
    gql.winnerSide = data.match.winnerSide;
    gql.winnerTeam = data.match.winnerTeam;
    gql.teamASide = data.match.teamASide;
    gql.isConfirmed = data.match.isConfirmed;
    gql.teamMembers = data.match.teamMembers.map((member) =>
      MatchTeamMemberGqlMapper.toGql(member),
    );
    gql.attachments = data.attachments.map((attachment) =>
      this.toPublicAttachment(attachment),
    );
    gql.extractionResults = data.extractionResults.map((result) =>
      ExtractionResultGqlMapper.toGql(result),
    );
    gql.createdAt = data.match.createdAt;
    return gql;
  }

  private static toPublicAttachment(dto: AttachmentOutputDto): PublicAttachment {
    const gql = new PublicAttachment();
    gql.localId = dto.id;
    gql.type = dto.type;
    gql.originalFileName = dto.originalFileName;
    return gql;
  }
}
