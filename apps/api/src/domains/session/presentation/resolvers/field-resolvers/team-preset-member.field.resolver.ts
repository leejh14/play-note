import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GetFriendUseCase } from '@domains/friend/application/use-cases/queries/get-friend.use-case';
import { FriendIdInputDto } from '@domains/friend/application/dto/inputs/friend-id.input.dto';
import { TeamPresetMember } from '@domains/session/presentation/graphql/types/team-preset-member.gql';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import { FriendGqlMapper } from '@domains/friend/presentation/mappers/friend.gql.mapper';

@Resolver(() => TeamPresetMember)
export class TeamPresetMemberFieldResolver {
  constructor(
    private readonly getFriendUseCase: GetFriendUseCase,
  ) {}

  @ResolveField(() => Friend, { nullable: false })
  async friend(@Parent() member: TeamPresetMember): Promise<Friend> {
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({
        id: member.friendId,
      }),
    );
    return FriendGqlMapper.toGql(friend);
  }
}
