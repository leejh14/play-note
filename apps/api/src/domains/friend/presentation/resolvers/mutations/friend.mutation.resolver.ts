import {
  Mutation,
  Resolver,
  Args,
} from '@nestjs/graphql';
import { assertGlobalIdType } from '@libs/relay';
import { RequireAdmin } from '@auth/decorators/require-admin.decorator';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { CreateFriendUseCase } from '@domains/friend/application/use-cases/commands/create-friend.use-case';
import { UpdateFriendUseCase } from '@domains/friend/application/use-cases/commands/update-friend.use-case';
import { ArchiveFriendUseCase } from '@domains/friend/application/use-cases/commands/archive-friend.use-case';
import { RestoreFriendUseCase } from '@domains/friend/application/use-cases/commands/restore-friend.use-case';
import { GetFriendUseCase } from '@domains/friend/application/use-cases/queries/get-friend.use-case';
import { CreateFriendInputDto } from '@domains/friend/application/dto/inputs/create-friend.input.dto';
import { UpdateFriendInputDto } from '@domains/friend/application/dto/inputs/update-friend.input.dto';
import { FriendIdInputDto } from '@domains/friend/application/dto/inputs/friend-id.input.dto';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import {
  CreateFriendPayload,
  UpdateFriendPayload,
  ArchiveFriendPayload,
  RestoreFriendPayload,
} from '@domains/friend/presentation/graphql/types/friend-mutation.payload.gql';
import { CreateFriendInput } from '@domains/friend/presentation/graphql/inputs/create-friend.input.gql';
import { UpdateFriendInput } from '@domains/friend/presentation/graphql/inputs/update-friend.input.gql';
import { ArchiveFriendInput } from '@domains/friend/presentation/graphql/inputs/archive-friend.input.gql';
import { RestoreFriendInput } from '@domains/friend/presentation/graphql/inputs/restore-friend.input.gql';
import { FriendGqlMapper } from '@domains/friend/presentation/mappers/friend.gql.mapper';

@Resolver(() => Friend)
export class FriendMutationResolver {
  constructor(
    private readonly createFriendUseCase: CreateFriendUseCase,
    private readonly updateFriendUseCase: UpdateFriendUseCase,
    private readonly archiveFriendUseCase: ArchiveFriendUseCase,
    private readonly restoreFriendUseCase: RestoreFriendUseCase,
    private readonly getFriendUseCase: GetFriendUseCase,
  ) {}

  @RequireAdmin()
  @Mutation(() => CreateFriendPayload, { nullable: false })
  async createFriend(
    @Args('input', { type: () => CreateFriendInput })
    input: CreateFriendInput,
  ): Promise<CreateFriendPayload> {
    const output = await this.createFriendUseCase.execute(
      new CreateFriendInputDto({
        displayName: input.displayName,
        riotGameName: input.riotGameName,
        riotTagLine: input.riotTagLine,
      }),
    );
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({ id: output.id }),
    );

    return Object.assign(new CreateFriendPayload(), {
      clientMutationId: input.clientMutationId,
      friendId: output.id,
      friend: FriendGqlMapper.toGql(friend),
    });
  }

  @RequireAdmin()
  @Mutation(() => UpdateFriendPayload, { nullable: false })
  async updateFriend(
    @Args('input', { type: () => UpdateFriendInput })
    input: UpdateFriendInput,
  ): Promise<UpdateFriendPayload> {
    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    const output = await this.updateFriendUseCase.execute(
      new UpdateFriendInputDto({
        id: friendId,
        displayName: input.displayName,
        riotGameName: input.riotGameName,
        riotTagLine: input.riotTagLine,
      }),
    );
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({ id: output.id }),
    );

    return Object.assign(new UpdateFriendPayload(), {
      clientMutationId: input.clientMutationId,
      friendId: output.id,
      friend: FriendGqlMapper.toGql(friend),
    });
  }

  @RequireAdmin()
  @Mutation(() => ArchiveFriendPayload, { nullable: false })
  async archiveFriend(
    @Args('input', { type: () => ArchiveFriendInput })
    input: ArchiveFriendInput,
  ): Promise<ArchiveFriendPayload> {
    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    await this.archiveFriendUseCase.execute(
      new FriendIdInputDto({
        id: friendId,
      }),
    );
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({ id: friendId }),
    );

    return Object.assign(new ArchiveFriendPayload(), {
      clientMutationId: input.clientMutationId,
      friendId,
      friend: FriendGqlMapper.toGql(friend),
    });
  }

  @RequireAdmin()
  @Mutation(() => RestoreFriendPayload, { nullable: false })
  async restoreFriend(
    @Args('input', { type: () => RestoreFriendInput })
    input: RestoreFriendInput,
  ): Promise<RestoreFriendPayload> {
    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    await this.restoreFriendUseCase.execute(
      new FriendIdInputDto({
        id: friendId,
      }),
    );
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({ id: friendId }),
    );

    return Object.assign(new RestoreFriendPayload(), {
      clientMutationId: input.clientMutationId,
      friendId,
      friend: FriendGqlMapper.toGql(friend),
    });
  }

  private decodeGlobalId(globalId: string, expectedType: string): string {
    try {
      return assertGlobalIdType(globalId, expectedType);
    } catch {
      throw new ValidationException({
        message: `Invalid ${expectedType} id`,
      });
    }
  }
}
