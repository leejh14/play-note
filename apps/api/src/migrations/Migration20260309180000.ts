import { Migration } from '@mikro-orm/migrations';

export class Migration20260309180000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "match" add column "winner_team" varchar(10) null default null;`);
  }

}
