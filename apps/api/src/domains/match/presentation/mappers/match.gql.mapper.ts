import { toGlobalId } from '@libs/relay';
import { MatchOutputDto } from '@domains/match/application/dto/outputs/match.output.dto';
import { MatchDetailOutputDto } from '@domains/match/application/dto/outputs/match-detail.output.dto';
import { Match } from '@domains/match/presentation/graphql/types/match.gql';
import { MatchTeamMemberGqlMapper } from './match-team-member.gql.mapper';

export class MatchGqlMapper {
  static toGql(dto: MatchOutputDto | MatchDetailOutputDto): Match {
    const gql = new Match();
    gql.id = MatchGqlMapper.toMatchIdGql(dto.id);
    gql.localId = dto.id;
    gql.sessionId = dto.sessionId;
    gql.matchNo = dto.matchNo;
    gql.status = dto.status;
    gql.winnerSide = dto.winnerSide;
    gql.teamASide = dto.teamASide;
    gql.isConfirmed = dto.isConfirmed;
    gql.teamMembers = dto.teamMembers.map((member) =>
      MatchTeamMemberGqlMapper.toGql(member),
    );
    gql.attachments = [];
    gql.extractionResults = [];
    gql.createdAt = dto.createdAt;
    return gql;
  }

  static toMatchIdGql(localId: string): string {
    return toGlobalId('Match', localId);
  }
}
