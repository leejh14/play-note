import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { IFriendRepository } from '@domains/friend/domain/repositories/friend.repository.interface';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { FriendIdInputDto } from '../../dto/inputs/friend-id.input.dto';

@Injectable()
export class RestoreFriendUseCase {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: IFriendRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: FriendIdInputDto): Promise<void> {
    const friend = await this.friendRepository.findById(input.id);
    if (!friend) {
      throw new NotFoundException({ message: 'Friend not found', errorCode: 'FRIEND_NOT_FOUND' });
    }
    friend.restore();
    await this.friendRepository.save(friend);
  }
}
