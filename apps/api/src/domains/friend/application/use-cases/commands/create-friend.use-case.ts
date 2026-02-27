import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { Friend } from '@domains/friend/domain/aggregates/friend.aggregate';
import { IFriendRepository } from '@domains/friend/domain/repositories/friend.repository.interface';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';
import { CreateFriendInputDto } from '../../dto/inputs/create-friend.input.dto';

@Injectable()
export class CreateFriendUseCase {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: IFriendRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CreateFriendInputDto): Promise<{ id: string }> {
    const friend = Friend.create({
      displayName: input.displayName,
      riotGameName: input.riotGameName,
      riotTagLine: input.riotTagLine,
    });
    await this.friendRepository.save(friend);
    return { id: friend.id };
  }
}
