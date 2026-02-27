import { Module } from '@nestjs/common';
import { FriendInfrastructureModule } from '@domains/friend/infrastructure/friend.infrastructure.module';
import { CreateFriendUseCase } from './use-cases/commands/create-friend.use-case';
import { UpdateFriendUseCase } from './use-cases/commands/update-friend.use-case';
import { ArchiveFriendUseCase } from './use-cases/commands/archive-friend.use-case';
import { RestoreFriendUseCase } from './use-cases/commands/restore-friend.use-case';
import { GetFriendsUseCase } from './use-cases/queries/get-friends.use-case';
import { GetFriendUseCase } from './use-cases/queries/get-friend.use-case';

@Module({
  imports: [FriendInfrastructureModule],
  providers: [
    CreateFriendUseCase,
    UpdateFriendUseCase,
    ArchiveFriendUseCase,
    RestoreFriendUseCase,
    GetFriendsUseCase,
    GetFriendUseCase,
  ],
  exports: [
    CreateFriendUseCase,
    UpdateFriendUseCase,
    ArchiveFriendUseCase,
    RestoreFriendUseCase,
    GetFriendsUseCase,
    GetFriendUseCase,
  ],
})
export class FriendApplicationModule {}
