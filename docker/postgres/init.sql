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
      ('019c0000-0000-7000-8000-000000000001', '김성준', '뽕 딜', 'bbb', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000002', '김지후', '나는 돌', 'Stone', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000003', '김윤상', '어리고싶다', '2351', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000004', '노태준', '카마도 네즈코', 'oniii', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000005', '오세원', '세르스타펜', 'MAX', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000006', '윤민수', 'Radiohead', '5005', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000007', '이정환', '토미오카 기유', 'sujoo', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000008', '이준호', '추석맞이자랭공장장', '이준호', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000009', '장재혁', '혀거덩', 'ECK', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-00000000000a', '주병규', '까마쿤', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-00000000000b', '유창현', '창날부리부리박기', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-00000000000c', '고경민', 'bgdrgn', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-00000000000d', '김태정', '기사', '321', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-00000000000e', '신현준', '시난준', 'KR1', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-00000000000f', '이종환', '아쉽고다', 'abc12', false, NOW(), NOW()),
      ('019c0000-0000-7000-8000-000000000010', '한주성', '주털이', 'KR1', false, NOW(), NOW())
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
