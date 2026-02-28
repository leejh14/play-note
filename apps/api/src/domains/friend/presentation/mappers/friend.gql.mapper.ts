import { toGlobalId } from '@libs/relay';
import { FriendOutputDto } from '@domains/friend/application/dto/outputs/friend.output.dto';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';

export class FriendGqlMapper {
  static toGql(dto: FriendOutputDto): Friend {
    const gql = new Friend();
    gql.id = FriendGqlMapper.toFriendIdGql(dto.id);
    gql.displayName = dto.displayName;
    gql.riotGameName = dto.riotGameName;
    gql.riotTagLine = dto.riotTagLine;
    gql.isArchived = dto.isArchived;
    gql.createdAt = dto.createdAt;
    gql.updatedAt = dto.updatedAt;
    return gql;
  }

  static toFriendIdGql(localId: string): string {
    return toGlobalId('Friend', localId);
  }
}
