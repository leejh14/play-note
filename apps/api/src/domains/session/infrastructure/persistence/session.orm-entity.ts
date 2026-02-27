import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
  Cascade,
} from '@mikro-orm/core';
import { AttendanceOrmEntity } from './attendance.orm-entity';
import { TeamPresetMemberOrmEntity } from './team-preset-member.orm-entity';

@Entity({ tableName: 'session' })
export class SessionOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ columnType: 'varchar(50)' })
  contentType!: string;

  @Property({ columnType: 'varchar(255)', nullable: true })
  title: string | null = null;

  @Property({ columnType: 'timestamptz' })
  startsAt!: Date;

  @Property({ columnType: 'varchar(50)', default: 'SCHEDULED' })
  status = 'SCHEDULED';

  @Property({ columnType: 'varchar(64)', unique: true })
  editorToken!: string;

  @Property({ columnType: 'varchar(64)', unique: true })
  adminToken!: string;

  @Property({ columnType: 'boolean', default: false })
  isAdminUnlocked = false;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt!: Date;

  @OneToMany(() => AttendanceOrmEntity, (a) => a.session, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  attendances = new Collection<AttendanceOrmEntity>(this);

  @OneToMany(() => TeamPresetMemberOrmEntity, (t) => t.session, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  teamPresetMembers = new Collection<TeamPresetMemberOrmEntity>(this);
}
