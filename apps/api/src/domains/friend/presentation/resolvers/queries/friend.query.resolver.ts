import {
  Args,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { OnModuleInit } from '@nestjs/common';
import { GetFriendsUseCase } from '@domains/friend/application/use-cases/queries/get-friends.use-case';
import { GetFriendUseCase } from '@domains/friend/application/use-cases/queries/get-friend.use-case';
import { GetFriendsInputDto } from '@domains/friend/application/dto/inputs/get-friends.input.dto';
import { FriendIdInputDto } from '@domains/friend/application/dto/inputs/friend-id.input.dto';
import { NodeResolver } from '@shared/presentation/graphql/relay/node.resolver';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import { FriendGqlMapper } from '@domains/friend/presentation/mappers/friend.gql.mapper';

@Resolver(() => Friend)
export class FriendQueryResolver implements OnModuleInit {
  constructor(
    private readonly getFriendsUseCase: GetFriendsUseCase,
    private readonly getFriendUseCase: GetFriendUseCase,
    private readonly nodeResolver: NodeResolver,
  ) {}

  onModuleInit(): void {
    this.nodeResolver.registerNodeFetcher(
      'Friend',
      async (input) => {
        try {
          const friend = await this.getFriendUseCase.execute(
            new FriendIdInputDto({ id: input.id }),
          );
          return FriendGqlMapper.toGql(friend);
        } catch (error: unknown) {
          if (error instanceof NotFoundException) {
            return null;
          }
          throw error;
        }
      },
    );
  }

  @Query(() => [Friend], { nullable: false })
  async friends(
    @Args('query', { type: () => String, nullable: true }) query?: string,
    @Args('includeArchived', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false,
    })
    includeArchived: boolean = false,
  ): Promise<Friend[]> {
    const friends = await this.getFriendsUseCase.execute(
      new GetFriendsInputDto({
        query,
        includeArchived,
      }),
    );
    return friends.map((friend) => FriendGqlMapper.toGql(friend));
  }
}
