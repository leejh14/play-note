import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { SessionOrmEntity } from './session.orm-entity';

@Entity({ tableName: 'comment' })
@Index({ properties: ['session'] })
export class CommentOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => SessionOrmEntity, { deleteRule: 'cascade' })
  session!: SessionOrmEntity;

  @Property({ columnType: 'text' })
  body!: string;

  @Property({ columnType: 'varchar(255)', nullable: true })
  displayName: string | null = null;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;
}
