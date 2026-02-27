import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FriendOrmEntity } from './persistence/friend.orm-entity';
import { MikroFriendRepository } from './persistence/mikro-friend.repository';
import { FRIEND_REPOSITORY } from '@domains/friend/domain/constants';

@Module({
  imports: [MikroOrmModule.forFeature([FriendOrmEntity])],
  providers: [
    {
      provide: FRIEND_REPOSITORY,
      useClass: MikroFriendRepository,
    },
  ],
  exports: [FRIEND_REPOSITORY],
})
export class FriendInfrastructureModule {}
