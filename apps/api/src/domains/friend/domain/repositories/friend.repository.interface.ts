import { Friend } from '../aggregates/friend.aggregate';

export interface FindAllFriendArgs {
  readonly includeArchived?: boolean;
  readonly query?: string;
}

export interface IFriendRepository {
  findById(id: string): Promise<Friend | null>;
  findAllActive(): Promise<Friend[]>;
  findAll(args: FindAllFriendArgs): Promise<Friend[]>;
  save(friend: Friend): Promise<void>;
  delete(friend: Friend): Promise<void>;
}
