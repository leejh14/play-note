import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GetFriendUseCase } from '@domains/friend/application/use-cases/queries/get-friend.use-case';
import { FriendIdInputDto } from '@domains/friend/application/dto/inputs/friend-id.input.dto';
import { Attendance } from '@domains/session/presentation/graphql/types/attendance.gql';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';
import { FriendGqlMapper } from '@domains/friend/presentation/mappers/friend.gql.mapper';

@Resolver(() => Attendance)
export class AttendanceFieldResolver {
  constructor(
    private readonly getFriendUseCase: GetFriendUseCase,
  ) {}

  @ResolveField(() => Friend, { nullable: false })
  async friend(@Parent() attendance: Attendance): Promise<Friend> {
    const friend = await this.getFriendUseCase.execute(
      new FriendIdInputDto({
        id: attendance.friendId,
      }),
    );
    return FriendGqlMapper.toGql(friend);
  }
}
