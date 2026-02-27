import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Unique,
  Cascade,
} from '@mikro-orm/core';
import { SessionOrmEntity } from '@domains/session/infrastructure/persistence/session.orm-entity';
import { MatchTeamMemberOrmEntity } from './match-team-member.orm-entity';

@Entity({ tableName: 'match' })
@Unique({ properties: ['session', 'matchNo'] })
export class MatchOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => SessionOrmEntity, { deleteRule: 'cascade' })
  session!: SessionOrmEntity;

  @Property({ columnType: 'int' })
  matchNo!: number;

  @Property({ columnType: 'varchar(50)', default: 'DRAFT' })
  status = 'DRAFT';

  @Property({ columnType: 'varchar(20)', default: 'UNKNOWN' })
  winnerSide = 'UNKNOWN';

  @Property({ columnType: 'varchar(20)', default: 'UNKNOWN' })
  teamASide = 'UNKNOWN';

  @Property({ columnType: 'boolean', default: false })
  isConfirmed = false;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt!: Date;

  @OneToMany(() => MatchTeamMemberOrmEntity, (m) => m.match, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  teamMembers = new Collection<MatchTeamMemberOrmEntity>(this);
}
