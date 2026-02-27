import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/core';
import { SessionOrmEntity } from './session.orm-entity';

@Entity({ tableName: 'attendance' })
@Unique({ properties: ['session', 'friendId'] })
export class AttendanceOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => SessionOrmEntity, { deleteRule: 'cascade' })
  session!: SessionOrmEntity;

  @Property({ columnType: 'uuid' })
  friendId!: string;

  @Property({ columnType: 'varchar(50)', default: 'UNDECIDED' })
  status = 'UNDECIDED';

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt!: Date;
}
