import { Field, ObjectType } from '@nestjs/graphql';
import { RelayMutationPayload } from '@libs/relay';
import { Friend } from './friend.gql';

@ObjectType('CreateFriendPayload')
export class CreateFriendPayload extends RelayMutationPayload {
  friendId!: string;

  @Field(() => Friend, { nullable: true })
  friend?: Friend;
}

@ObjectType('UpdateFriendPayload')
export class UpdateFriendPayload extends RelayMutationPayload {
  friendId!: string;

  @Field(() => Friend, { nullable: true })
  friend?: Friend;
}

@ObjectType('ArchiveFriendPayload')
export class ArchiveFriendPayload extends RelayMutationPayload {
  friendId!: string;

  @Field(() => Friend, { nullable: true })
  friend?: Friend;
}

@ObjectType('RestoreFriendPayload')
export class RestoreFriendPayload extends RelayMutationPayload {
  friendId!: string;

  @Field(() => Friend, { nullable: true })
  friend?: Friend;
}
