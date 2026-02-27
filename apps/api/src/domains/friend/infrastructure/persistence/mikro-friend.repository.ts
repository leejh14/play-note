import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Friend } from '@domains/friend/domain/aggregates/friend.aggregate';
import {
  IFriendRepository,
  FindAllFriendArgs,
} from '@domains/friend/domain/repositories/friend.repository.interface';
import { FriendOrmEntity } from './friend.orm-entity';

@Injectable()
export class MikroFriendRepository implements IFriendRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Friend | null> {
    const orm = await this.em.findOne(FriendOrmEntity, { id });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findAllActive(): Promise<Friend[]> {
    const list = await this.em.find(FriendOrmEntity, { isArchived: false });
    return list.map((o) => this.toDomainEntity(o));
  }

  async findAll(args: FindAllFriendArgs): Promise<Friend[]> {
    const where: Record<string, unknown> = {};
    if (!args.includeArchived) {
      where.isArchived = false;
    }
    if (args.query?.trim()) {
      const q = `%${args.query.trim()}%`;
      where.$or = [
        { displayName: { $like: q } },
        { riotGameName: { $like: q } },
        { riotTagLine: { $like: q } },
      ];
    }
    const list = await this.em.find(FriendOrmEntity, where);
    return list.map((o) => this.toDomainEntity(o));
  }

  async save(friend: Friend): Promise<void> {
    const orm = this.toOrmEntity(friend);
    await this.em.upsert(orm);
    await this.em.flush();
  }

  async delete(friend: Friend): Promise<void> {
    const orm = await this.em.findOne(FriendOrmEntity, { id: friend.id });
    if (orm) {
      await this.em.removeAndFlush(orm);
    }
  }

  private toOrmEntity(friend: Friend): FriendOrmEntity {
    const orm = new FriendOrmEntity();
    orm.id = friend.id;
    orm.displayName = friend.displayName;
    orm.riotGameName = friend.riotGameName;
    orm.riotTagLine = friend.riotTagLine;
    orm.isArchived = friend.isArchived;
    orm.createdAt = friend.createdAt;
    orm.updatedAt = friend.updatedAt;
    return orm;
  }

  private toDomainEntity(orm: FriendOrmEntity): Friend {
    return Friend.reconstitute({
      id: orm.id,
      displayName: orm.displayName,
      riotGameName: orm.riotGameName,
      riotTagLine: orm.riotTagLine,
      isArchived: orm.isArchived,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
