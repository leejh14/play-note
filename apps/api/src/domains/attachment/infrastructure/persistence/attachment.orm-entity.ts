import {
  Entity,
  PrimaryKey,
  Property,
  Index,
} from '@mikro-orm/core';

@Entity({ tableName: 'attachment' })
@Index({ properties: ['sessionId'] })
export class AttachmentOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ columnType: 'uuid' })
  sessionId!: string;

  @Property({ columnType: 'uuid', nullable: true })
  matchId: string | null = null;

  @Property({ columnType: 'varchar(50)' })
  scope!: string;

  @Property({ columnType: 'varchar(50)' })
  type!: string;

  @Property({ columnType: 'varchar(512)' })
  s3Key!: string;

  @Property({ columnType: 'varchar(100)' })
  contentType!: string;

  @Property({ columnType: 'int' })
  size!: number;

  @Property({ columnType: 'int', nullable: true })
  width: number | null = null;

  @Property({ columnType: 'int', nullable: true })
  height: number | null = null;

  @Property({ columnType: 'varchar(255)', nullable: true })
  originalFileName: string | null = null;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;
}
