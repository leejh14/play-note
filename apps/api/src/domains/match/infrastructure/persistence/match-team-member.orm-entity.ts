import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/core';
import { MatchOrmEntity } from './match.orm-entity';

@Entity({ tableName: 'match_team_member' })
@Unique({ properties: ['match', 'friendId'] })
export class MatchTeamMemberOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MatchOrmEntity, { deleteRule: 'cascade' })
  match!: MatchOrmEntity;

  @Property({ columnType: 'uuid' })
  friendId!: string;

  @Property({ columnType: 'varchar(10)' })
  team!: string;

  @Property({ columnType: 'varchar(20)', default: 'UNKNOWN' })
  lane = 'UNKNOWN';

  @Property({ columnType: 'varchar(255)', nullable: true })
  champion: string | null = null;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt!: Date;
}
