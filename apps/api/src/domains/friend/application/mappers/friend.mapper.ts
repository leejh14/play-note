import { Friend } from '@domains/friend/domain/aggregates/friend.aggregate';
import { FriendOutputDto } from '../dto/outputs/friend.output.dto';

export class FriendMapper {
  static toDto(friend: Friend): FriendOutputDto {
    return new FriendOutputDto({
      id: friend.id,
      displayName: friend.displayName,
      riotGameName: friend.riotGameName,
      riotTagLine: friend.riotTagLine,
      isArchived: friend.isArchived,
      createdAt: friend.createdAt,
      updatedAt: friend.updatedAt,
    });
  }
}
