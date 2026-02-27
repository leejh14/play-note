import {
  Entity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity({ tableName: 'friend' })
export class FriendOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ columnType: 'varchar(255)' })
  displayName!: string;

  @Property({ columnType: 'varchar(255)', nullable: true })
  riotGameName: string | null = null;

  @Property({ columnType: 'varchar(255)', nullable: true })
  riotTagLine: string | null = null;

  @Property({ columnType: 'boolean', default: false })
  isArchived = false;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt!: Date;
}
