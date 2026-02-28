import { toGlobalId } from '@libs/relay';
import { MatchTeamMemberOutputDto } from '@domains/match/application/dto/outputs/match-team-member.output.dto';
import { MatchTeamMember } from '@domains/match/presentation/graphql/types/match-team-member.gql';

export class MatchTeamMemberGqlMapper {
  static toGql(dto: MatchTeamMemberOutputDto): MatchTeamMember {
    const gql = new MatchTeamMember();
    gql.id = toGlobalId('MatchTeamMember', dto.id);
    gql.friendId = dto.friendId;
    gql.team = dto.team;
    gql.lane = dto.lane;
    gql.champion = dto.champion;
    return gql;
  }
}
