import { Injectable, Inject } from '@nestjs/common';
import { IFriendContextAcl } from '@domains/session/application/acl/friend-context.acl.interface';
import { IFriendRepository } from '@domains/friend/domain/repositories/friend.repository.interface';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';

@Injectable()
export class FriendContextAcl implements IFriendContextAcl {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: IFriendRepository,
  ) {}

  async getActiveFriendIds(): Promise<string[]> {
    const friends = await this.friendRepository.findAllActive();
    return friends.map((f) => f.id);
  }
}
