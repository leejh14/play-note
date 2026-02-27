import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IFriendRepository } from '@domains/friend/domain/repositories/friend.repository.interface';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';

export interface FriendSummaryDto {
  readonly id: string;
  readonly displayName: string;
}

export interface IFriendStatsContextAcl {
  getActiveFriends(input: { includeArchived?: boolean }): Promise<FriendSummaryDto[]>;
}

@Injectable()
export class FriendStatsContextAcl implements IFriendStatsContextAcl {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: IFriendRepository,
  ) {}

  async getActiveFriends(input: {
    includeArchived?: boolean;
  }): Promise<FriendSummaryDto[]> {
    const friends = await this.friendRepository.findAll({
      includeArchived: input.includeArchived ?? false,
    });
    return friends.map((f) => ({
      id: f.id,
      displayName: f.displayName,
    }));
  }
}
