# PlayNote — 시스템 설계 TODO

> 진행 상태: `[ ]` 미착수 · `[~]` 진행중 · `[x]` 완료 · `[-]` 스킵/불필요

---

## Phase 1: 기술 기반 결정

### 2.1 서비스 경계 / 컴포넌트

- [x] web(Next.js): **순수 프론트** (UI 렌더링 + GraphQL Client + S3 presigned 업로드 수행, BFF 없음)
- [x] api(NestJS GraphQL): **모든 비즈니스 로직** (UseCase/도메인 로직 + GraphQL endpoint + 토큰 검증 + presigned URL 발급 + 첨부 제한 강제 + OCR Job 생성). OCR 실행만 worker로 분리.
- [~] worker(ocr/분석): 필요 확정. 운영 방식은 **리서치 후 결정** (선택지: A. NestJS worker에서 Python CLI 호출 / B. 별도 Python 서비스)
- [x] reverse proxy(nginx): 필요 확정. 라우팅: `/graphql` → api(:4000), 나머지 `/*` → web(:3000). TLS 종료 담당. worker는 외부 노출 없음(내부 DB 폴링).

### 2.2 GraphQL 설계

- [x] **Code-First** (educore-platform-be 패턴 준수, `@ObjectType`/`@InputType`/`@Field` 데코레이터, `autoSchemaFile`)
- [x] GraphQL Client: **Apollo Client**
- [x] 네이밍/에러 규격: **NEW_DEVELOPMENT_GUIDE.md 준수** — Mutation은 `{동사}{대상}` 형식, Exception 기반 에러(`BaseException` 상속, `errors[].extensions.code`)
- [x] Auth context: **헤더 방식** (`x-session-id` + `x-session-token`). 로그인 없는 다중 세션 토큰 모델에 적합. 프론트에서 localStorage에 세션별 토큰 저장 후 Apollo Client httpLink 헤더로 전송. (주 사용 환경: 스마트폰, 카카오톡 링크 → 모바일 브라우저)

### 2.3 권한/보안(토큰)

- 확정된 정책(요구사항)
  - 세션 단위 `editorToken` / `adminToken`
  - 링크 가진 사람은 수정/삭제 가능(editor)
  - admin은 unlock 가능
- [x] 토큰 저장: **localStorage** (`playnote:session:{sessionId}:token`)
- [x] 토큰 회전/재발급: **MVP 스킵**. editorToken 회전은 모든 링크 무효화로 혼란, adminToken 재발급은 필요 시 나중에 추가.
- [x] Rate limiting: **nginx `limit_req`만 적용** (IP 기반, ~30r/s). 나머지는 비즈니스 룰(10장 제한)로 충분. NestJS 레벨 throttling은 MVP 불필요.

---

## Phase 2: 도메인 핵심

### 2.4 도메인/상태 머신

- 확정된 상태/규칙(요구사항)
  - Session.status: scheduled → confirmed → roster_locked → done(옵션)
  - 로스터/팀/라인 변경은 "attachment 업로드 전까지" 가능
  - attachment가 1장 이상이면 잠김, admin unlock 가능
- [x] 잠김 계산: Session에 `isAdminUnlocked` boolean. `effectiveLocked = (attachmentCount > 0) && !isAdminUnlocked`
- [x] 잠김 ACL: 구조 변경(roster/teamPreset/matchTeamMember/match생성)만 잠금, 기록(댓글/첨부/결과확정/상태전이)은 항상 허용
- [x] 0장 시 자동 해제: **자동 해제** (공식에 의해 count=0이면 자동으로 unlocked)

### 2.4.1 Aggregate / Bounded Context / 모듈 경계

- [x] Aggregate Root 6개: Friend, Session, Comment, Match, Attachment, ExtractionJob
- [x] BC/모듈 5개: `friend`, `session`(+Comment), `match`, `attachment`(+ExtractionJob), `statistics`(읽기 전용)
- [x] 내부 Entity: Session→(Attendance, RosterMember, TeamPresetMember), Match→(MatchTeamMember)
- [x] NestJS 모듈 구조: educore 패턴 (Infrastructure/Application/Presentation 3모듈) 적용
- [x] Repository 6개: IFriendRepository, ISessionRepository, ICommentRepository, IMatchRepository, IAttachmentRepository, IExtractionJobRepository

### 2.5 데이터 모델(ERD / 테이블)

- [x] Entity 필드/인덱스/제약 설계 완료 (11개 테이블, ERD mermaid로 문서화)
- [x] Friend에서 aliases 제거, riotGameName/riotTagLine이 OCR 매칭용
- [x] 세션당 10장 제한: Presign에서 count 확인 → Complete에서 트랜잭션 내 `FOR UPDATE` 재확인
- [x] 통계 필드: 이미 설계에 포함됨 (MatchTeamMember.friendId/team/lane/champion + Match.winnerSide/teamASide/isConfirmed)

---

## Phase 3: 기능별 상세

### 2.6 파일 업로드/스토리지

- 확정된 정책(요구사항)
  - 댓글에는 이미지 불가
  - 첨부는 세션/매치에 귀속
  - 세션당 총 10장
  - 롤 첨부는 "게임 종료 결과창 1종"만
- 구체화 필요
  - [ ] S3 업로드 방식(presigned PUT/POST)
  - [ ] 업로드 완료 확인 방식(complete mutation)
  - [ ] 메타데이터 저장(size, contentType, width/height)
  - [ ] CDN/이미지 리사이즈(선택)

### 2.7 OCR/분석 파이프라인(롤 결과창 1종)

- 확정된 입력
  - LoL 결과창 스샷 1종만 지원
  - 매치마다 blue/red 진영은 변경 가능
  - 진영 관련 값은 스샷 기반 확정
- 구체화 필요
  - [ ] ExtractionJob 설계(상태, 재시도, 모델 버전)
  - [ ] 결과 포맷(JSON schema: winnerSide, teamA_side, confidence 등)
  - [ ] 자동 추출 실패 시 UX(수동 확정 플로우)

### 2.8 통계(집계)

- 확정된 지표(요구사항)
  - 승률, 선호 라인, 자주 이긴 챔피언
  - 확정된 match만 집계
- 구체화 필요
  - [ ] 쿼리 집계 vs 캐시 테이블(초기엔 쿼리 집계 권장)
  - [ ] 통계 범위(전체 기간 / 기간 필터 / 컨텐츠 필터)

### 2.9 운영/관리(Admin)

- 확정된 기능
  - admin unlock 가능
- 구체화 필요
  - [ ] admin 전용 mutation/화면 범위
  - [ ] 데이터 정리(스팸 댓글/잘못된 첨부 삭제)
  - [ ] 토큰 재발급/폐기
