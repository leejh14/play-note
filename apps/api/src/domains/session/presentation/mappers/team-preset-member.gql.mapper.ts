import { toGlobalId } from '@libs/relay';
import { TeamPresetMemberOutputDto } from '@domains/session/application/dto/outputs/team-preset-member.output.dto';
import { TeamPresetMember } from '@domains/session/presentation/graphql/types/team-preset-member.gql';

export class TeamPresetMemberGqlMapper {
  static toGql(dto: TeamPresetMemberOutputDto): TeamPresetMember {
    const gql = new TeamPresetMember();
    gql.id = toGlobalId('TeamPresetMember', dto.id);
    gql.friendId = dto.friendId;
    gql.team = dto.team;
    gql.lane = dto.lane;
    return gql;
  }
}
