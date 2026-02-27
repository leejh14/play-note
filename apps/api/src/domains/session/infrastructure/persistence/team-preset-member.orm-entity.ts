import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/core';
import { SessionOrmEntity } from './session.orm-entity';

@Entity({ tableName: 'team_preset_member' })
@Unique({ properties: ['session', 'friendId'] })
export class TeamPresetMemberOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => SessionOrmEntity, { deleteRule: 'cascade' })
  session!: SessionOrmEntity;

  @Property({ columnType: 'uuid' })
  friendId!: string;

  @Property({ columnType: 'varchar(10)' })
  team!: string;

  @Property({ columnType: 'varchar(20)', default: 'UNKNOWN' })
  lane = 'UNKNOWN';

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt!: Date;
}
