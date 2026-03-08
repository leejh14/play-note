import { Migration } from '@mikro-orm/migrations';

export class Migration20260309091500 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "session" add column "is_structure_locked" boolean not null default false;`);
    this.addSql(`update "session" set "is_structure_locked" = false;`);
    this.addSql(`alter table "session" drop column "is_admin_unlocked";`);
  }

}
