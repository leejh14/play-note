import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';

@Entity({ tableName: 'extraction_result' })
@Unique({ properties: ['attachmentId'] })
export class ExtractionResultOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ columnType: 'uuid' })
  attachmentId!: string;

  @Property({ columnType: 'uuid' })
  matchId!: string;

  @Property({ columnType: 'varchar(50)', default: 'PENDING' })
  status = 'PENDING';

  @Property({ columnType: 'varchar(100)', nullable: true })
  model: string | null = null;

  @Property({ columnType: 'jsonb', nullable: true })
  result: Record<string, unknown> | null = null;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;
}
