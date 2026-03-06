-- PlayNote 초기 데이터베이스 설정
-- 이 파일은 PostgreSQL 컨테이너 최초 실행 시 자동 실행됩니다.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION playnote_seed_friend_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE $SQL$
    INSERT INTO public.friend (
      id,
      display_name,
      riot_game_name,
      riot_tag_line,
      is_archived,
      created_at,
      updated_at
    )
    VALUES
      ('019c0000-0000-7000-8000-000000000001', '철수', 'Chulsoo', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000002', '영희', 'Younghee', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000003', '민수', 'Minsu', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000004', '지훈', 'Jihun', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000005', '유진', 'Yujin', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000006', '하늘', 'Haneul', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000007', '서준', null, null, false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000008', '예린', null, null, false, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  $SQL$;
END;
$$;

CREATE OR REPLACE FUNCTION playnote_seed_friend_on_create_table()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ddl record;
  normalized_identity text;
BEGIN
  FOR ddl IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    normalized_identity := replace(lower(ddl.object_identity), '"', '');
    IF ddl.object_type = 'table'
      AND normalized_identity IN ('public.friend', 'friend') THEN
      PERFORM playnote_seed_friend_data();
      DROP EVENT TRIGGER IF EXISTS playnote_seed_friend_on_create;
      EXIT;
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'friend'
  ) THEN
    PERFORM playnote_seed_friend_data();
    DROP EVENT TRIGGER IF EXISTS playnote_seed_friend_on_create;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_event_trigger
    WHERE evtname = 'playnote_seed_friend_on_create'
  ) THEN
    CREATE EVENT TRIGGER playnote_seed_friend_on_create
      ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION playnote_seed_friend_on_create_table();
  END IF;
END;
$$;
