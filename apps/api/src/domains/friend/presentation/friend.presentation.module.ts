import { Module } from '@nestjs/common';
import { SharedPresentationModule } from '@shared/presentation/shared.presentation.module';
import { FriendApplicationModule } from '@domains/friend/application/friend.application.module';
import { FriendQueryResolver } from './resolvers/queries/friend.query.resolver';
import { FriendMutationResolver } from './resolvers/mutations/friend.mutation.resolver';

@Module({
  imports: [SharedPresentationModule, FriendApplicationModule],
  providers: [FriendQueryResolver, FriendMutationResolver],
})
export class FriendPresentationModule {}
