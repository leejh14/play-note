import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GetFriendUseCase } from '@domains/friend/application/use-cases/queries/get-friend.use-case';
import { FriendIdInputDto } from '@domains/friend/application/dto/inputs/friend-id.input.dto';
import { MatchTeamMember } from '@domains/match/presentation/graphql/types/match-team-member.gql';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import { FriendGqlMapper } from '@domains/friend/presentation/mappers/friend.gql.mapper';

@Resolver(() => MatchTeamMember)
export class MatchTeamMemberFieldResolver {
  constructor(
    private readonly getFriendUseCase: GetFriendUseCase,
  ) {}

  @ResolveField(() => Friend, { nullable: false })
  async friend(@Parent() member: MatchTeamMember): Promise<Friend> {
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({
        id: member.friendId,
      }),
    );
    return FriendGqlMapper.toGql(friend);
  }
}
