import { Injectable, Inject } from '@nestjs/common';
import { IFriendRepository } from '@domains/friend/domain/repositories/friend.repository.interface';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { FriendMapper } from '../../mappers/friend.mapper';
import { FriendIdInputDto } from '../../dto/inputs/friend-id.input.dto';
import { FriendOutputDto } from '../../dto/outputs/friend.output.dto';

@Injectable()
export class GetFriendUseCase {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: IFriendRepository,
  ) {}

  async execute(input: FriendIdInputDto): Promise<FriendOutputDto> {
    const friend = await this.friendRepository.findById(input.id);
    if (!friend) {
      throw new NotFoundException({ message: 'Friend not found', errorCode: 'FRIEND_NOT_FOUND' });
    }
    return FriendMapper.toDto(friend);
  }
}
