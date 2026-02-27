import { Migration } from '@mikro-orm/migrations';

export class Migration20260227214005 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "attachment" ("id" uuid not null, "session_id" uuid not null, "match_id" uuid null, "scope" varchar(50) not null, "type" varchar(50) not null, "s3key" varchar(512) not null, "content_type" varchar(100) not null, "size" int not null, "width" int null, "height" int null, "original_file_name" varchar(255) null, "created_at" timestamptz not null, constraint "attachment_pkey" primary key ("id"));`);
    this.addSql(`create index "attachment_session_id_index" on "attachment" ("session_id");`);

    this.addSql(`create table "extraction_result" ("id" uuid not null, "attachment_id" uuid not null, "match_id" uuid not null, "status" varchar(50) not null default 'PENDING', "model" varchar(100) null, "result" jsonb null, "created_at" timestamptz not null, constraint "extraction_result_pkey" primary key ("id"));`);
    this.addSql(`alter table "extraction_result" add constraint "extraction_result_attachment_id_unique" unique ("attachment_id");`);

    this.addSql(`create table "friend" ("id" uuid not null, "display_name" varchar(255) not null, "riot_game_name" varchar(255) null, "riot_tag_line" varchar(255) null, "is_archived" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "friend_pkey" primary key ("id"));`);

    this.addSql(`create table "session" ("id" uuid not null, "content_type" varchar(50) not null, "title" varchar(255) null, "starts_at" timestamptz not null, "status" varchar(50) not null default 'SCHEDULED', "editor_token" varchar(64) not null, "admin_token" varchar(64) not null, "is_admin_unlocked" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "session_pkey" primary key ("id"));`);
    this.addSql(`alter table "session" add constraint "session_editor_token_unique" unique ("editor_token");`);
    this.addSql(`alter table "session" add constraint "session_admin_token_unique" unique ("admin_token");`);

    this.addSql(`create table "match" ("id" uuid not null, "session_id" uuid not null, "match_no" int not null, "status" varchar(50) not null default 'DRAFT', "winner_side" varchar(20) not null default 'UNKNOWN', "team_aside" varchar(20) not null default 'UNKNOWN', "is_confirmed" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "match_pkey" primary key ("id"));`);
    this.addSql(`alter table "match" add constraint "match_session_id_match_no_unique" unique ("session_id", "match_no");`);

    this.addSql(`create table "match_team_member" ("id" uuid not null, "match_id" uuid not null, "friend_id" uuid not null, "team" varchar(10) not null, "lane" varchar(20) not null default 'UNKNOWN', "champion" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "match_team_member_pkey" primary key ("id"));`);
    this.addSql(`alter table "match_team_member" add constraint "match_team_member_match_id_friend_id_unique" unique ("match_id", "friend_id");`);

    this.addSql(`create table "comment" ("id" uuid not null, "session_id" uuid not null, "body" text not null, "display_name" varchar(255) null, "created_at" timestamptz not null, constraint "comment_pkey" primary key ("id"));`);
    this.addSql(`create index "comment_session_id_index" on "comment" ("session_id");`);

    this.addSql(`create table "attendance" ("id" uuid not null, "session_id" uuid not null, "friend_id" uuid not null, "status" varchar(50) not null default 'UNDECIDED', "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "attendance_pkey" primary key ("id"));`);
    this.addSql(`alter table "attendance" add constraint "attendance_session_id_friend_id_unique" unique ("session_id", "friend_id");`);

    this.addSql(`create table "team_preset_member" ("id" uuid not null, "session_id" uuid not null, "friend_id" uuid not null, "team" varchar(10) not null, "lane" varchar(20) not null default 'UNKNOWN', "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "team_preset_member_pkey" primary key ("id"));`);
    this.addSql(`alter table "team_preset_member" add constraint "team_preset_member_session_id_friend_id_unique" unique ("session_id", "friend_id");`);

    this.addSql(`alter table "match" add constraint "match_session_id_foreign" foreign key ("session_id") references "session" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "match_team_member" add constraint "match_team_member_match_id_foreign" foreign key ("match_id") references "match" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "comment" add constraint "comment_session_id_foreign" foreign key ("session_id") references "session" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "attendance" add constraint "attendance_session_id_foreign" foreign key ("session_id") references "session" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "team_preset_member" add constraint "team_preset_member_session_id_foreign" foreign key ("session_id") references "session" ("id") on update cascade on delete cascade;`);
  }

}
