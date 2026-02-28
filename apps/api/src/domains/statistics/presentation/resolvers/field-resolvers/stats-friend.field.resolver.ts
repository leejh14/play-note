import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GetFriendUseCase } from '@domains/friend/application/use-cases/queries/get-friend.use-case';
import { FriendIdInputDto } from '@domains/friend/application/dto/inputs/friend-id.input.dto';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import { FriendGqlMapper } from '@domains/friend/presentation/mappers/friend.gql.mapper';
import { FriendStatsSummary } from '@domains/statistics/presentation/graphql/types/friend-stats-summary.gql';
import { StatsDetail } from '@domains/statistics/presentation/graphql/types/stats-detail.gql';

@Resolver(() => FriendStatsSummary)
export class FriendStatsSummaryFieldResolver {
  constructor(
    private readonly getFriendUseCase: GetFriendUseCase,
  ) {}

  @ResolveField(() => Friend, { nullable: false })
  async friend(@Parent() summary: FriendStatsSummary): Promise<Friend> {
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({
        id: summary.friendId,
      }),
    );
    return FriendGqlMapper.toGql(friend);
  }
}

@Resolver(() => StatsDetail)
export class StatsDetailFieldResolver {
  constructor(
    private readonly getFriendUseCase: GetFriendUseCase,
  ) {}

  @ResolveField(() => Friend, { nullable: false })
  async friend(@Parent() detail: StatsDetail): Promise<Friend> {
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({
        id: detail.friendId,
      }),
    );
    return FriendGqlMapper.toGql(friend);
  }
}
