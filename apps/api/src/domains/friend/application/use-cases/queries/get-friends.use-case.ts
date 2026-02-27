import { Injectable, Inject } from '@nestjs/common';
import { IFriendRepository } from '@domains/friend/domain/repositories/friend.repository.interface';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';
import { FriendMapper } from '../../mappers/friend.mapper';
import { GetFriendsInputDto } from '../../dto/inputs/get-friends.input.dto';
import { FriendOutputDto } from '../../dto/outputs/friend.output.dto';

@Injectable()
export class GetFriendsUseCase {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: IFriendRepository,
  ) {}

  async execute(input: GetFriendsInputDto): Promise<FriendOutputDto[]> {
    const friends = await this.friendRepository.findAll({
      includeArchived: input.includeArchived,
      query: input.query,
    });
    return friends.map((f) => FriendMapper.toDto(f));
  }
}
