# PlayNote — 설계 & 구현 TODO

> 진행 상태: `[ ]` 미착수 · `[~]` 진행중 · `[x]` 완료 · `[-]` 스킵/불필요

---

## Phase 1: 기술 기반 결정 ✅

### 2.1 서비스 경계 / 컴포넌트

- [x] web(Next.js): **순수 프론트** (UI 렌더링 + GraphQL Client + S3 presigned 업로드 수행, BFF 없음)
- [x] api(NestJS GraphQL): **모든 비즈니스 로직** (UseCase/도메인 로직 + GraphQL endpoint + 토큰 검증 + presigned URL 발급 + 첨부 제한 강제 + OCR Job 생성). OCR 실행만 worker로 분리.
- [x] worker(ocr/분석): **Graphile Worker** (PostgreSQL SKIP LOCKED 기반). 초기: task에서 Python CLI 호출(A), 이후 별도 서비스(B)로 교체 가능. Domain `IExtractionService` 인터페이스 + DIP.
- [x] reverse proxy(nginx): 필요 확정. 라우팅: `/graphql` → api(:4000), 나머지 `/*` → web(:3000). TLS 종료 담당. worker는 외부 노출 없음.

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

## Phase 2: 도메인 핵심 ✅

### 2.4 도메인/상태 머신

- 확정된 상태/규칙(요구사항)
  - Session.status: scheduled → confirmed → roster_locked → done(옵션)
  - 로스터/팀/라인 변경은 "attachment 업로드 전까지" 가능
  - attachment가 1장 이상이면 잠김, admin unlock 가능
- [x] 잠김 계산: Session에 `isAdminUnlocked` boolean. `effectiveLocked = (attachmentCount > 0) && !isAdminUnlocked`
- [x] 잠김 ACL: 구조 변경(roster/teamPreset/matchTeamMember/match생성)만 잠금, 기록(댓글/첨부/결과확정/상태전이)은 항상 허용
- [x] 0장 시 자동 해제: **자동 해제** (공식에 의해 count=0이면 자동으로 unlocked)

### 2.4.1 Aggregate / Bounded Context / 모듈 경계

- [x] Aggregate Root 6개: Friend, Session, Comment, Match, Attachment, ExtractionResult
- [x] BC/모듈 5개: `friend`, `session`(+Comment), `match`, `attachment`(+ExtractionResult), `statistics`(읽기 전용)
- [x] 내부 Entity: Session→(Attendance, RosterMember, TeamPresetMember), Match→(MatchTeamMember)
- [x] NestJS 모듈 구조: educore 패턴 (Infrastructure/Application/Presentation 3모듈) 적용
- [x] Repository 6개: IFriendRepository, ISessionRepository, ICommentRepository, IMatchRepository, IAttachmentRepository, IExtractionResultRepository

### 2.5 데이터 모델(ERD / 테이블)

- [x] Entity 필드/인덱스/제약 설계 완료 (11개 테이블, ERD mermaid로 문서화)
- [x] Friend에서 aliases 제거, riotGameName/riotTagLine이 OCR 매칭용
- [x] 세션당 10장 제한: Presign에서 count 확인 → Complete에서 트랜잭션 내 `FOR UPDATE` 재확인
- [x] 통계 필드: 이미 설계에 포함됨 (MatchTeamMember.friendId/team/lane/champion + Match.winnerSide/teamASide/isConfirmed)

---

## Phase 3: 기능별 상세 ✅

### 2.6 파일 업로드/스토리지

- [x] S3 업로드 방식: **Presigned PUT**
- [x] 다중 업로드: **배치 API** (`createPresignedUploads` / `completeUploads`) — 모바일 갤러리 다중 선택 대응
- [x] 단건 API도 유지 (하위 호환)
- [x] 10장 제한: presign에서 `현재 + N <= 10` 확인, complete에서 FOR UPDATE 재확인
- [x] 메타데이터: size, contentType, width/height 저장 (completeUpload input)
- [x] CDN/리사이즈: **MVP 스킵**. S3 직접 URL, 필요 시 CloudFront 추가

### 2.7 OCR/분석 파이프라인

- [x] ExtractionResult (shadow table): PENDING / DONE / FAILED. 재시도는 Graphile Worker 내장 retry
- [x] 결과 포맷: output json 스키마 확정 (`ocr_스팩.md` 5.3 참조)
- [x] 실패 시 UX: UI에 "자동 추출 실패" 표시, `confirmMatchResult`로 수동 확정 (항상 가능)

### 2.8 통계(집계)

- [x] **on-demand SQL GROUP BY 집계** (데이터 소량, 캐시 불필요)
- [x] 범위: 전체 기간 기본 + 선택적 기간 필터 (LoL만)
- [x] 성능 문제 시 FriendStats 캐시 테이블 도입 가능

### 2.9 운영/관리(Admin)

- [x] MVP: **별도 admin 화면 없음** — 기존 UI에서 adminToken 접속 시 unlock 버튼 노출
- [x] bulk delete 등 관리 기능은 v1+
- [x] 토큰 재발급: MVP 스킵 (Decision Log 참조)

---

## Phase 4: 설계 보완 (구현 전 필수)

### 4.1 누락된 유즈케이스 작성 → `요구사항_명세서.md`

- [x] **UC-9: Friend 관리 (admin CRUD)** — 목록 조회 + 추가 + 수정 + 아카이브/복원 (`요구사항_명세서.md`)
- [x] **UC-1-4: 세션 삭제** — hard delete + cascade 범위 + 확인 다이얼로그 + S3 비동기 삭제 (`요구사항_명세서.md`)
- [x] **UC-1-3: 세션 수정 (제목/날짜)** — done 상태 외 수정 가능, 공유 링크 영향 없음 (`요구사항_명세서.md`)
- [x] **UC-4-1: 매치 삭제** — isConfirmed=true면 삭제 불가, cascade + effectiveLocked 재계산 (`요구사항_명세서.md`)

### 4.2 삭제 정책 & cascade 규칙 → `시스템디자인.md`

- [x] **세션 삭제 cascade 설계**: admin only + 연관 모든 자식 ON DELETE CASCADE + S3 비동기 삭제 (`시스템디자인.md` 4.3-A)
- [x] **S3 파일 정리**: 비동기 삭제 — 트랜잭션 후 Graphile Worker job dispatch (`시스템디자인.md` 4.3-A)
- [x] **매치 삭제 cascade 설계**: admin only + isConfirmed=false만 + 자식 ON DELETE CASCADE (`시스템디자인.md` 4.3-A)
- [x] **soft delete vs hard delete**: hard delete 확정 (Friend만 archive/soft delete) (`시스템디자인.md` 4.3-A)

### 4.3 API Surface 보완 → `시스템디자인.md` 섹션 11

- [x] **`deleteSession(sessionId)` 뮤테이션**: admin only, cascade (4.3-A 참조) — `시스템디자인.md` 섹션 11
- [x] **`updateSession(sessionId, input)` 뮤테이션**: editor/admin, `{ title?, startsAt? }`, done이면 거절 — `시스템디자인.md` 섹션 11
- [x] **`deleteMatch(matchId)` 뮤테이션**: admin only, isConfirmed=false만 — `시스템디자인.md` 섹션 11
- [x] **`markDone` + `reopenSession` 확정**: markDone=editor/admin, reopenSession=admin only, 자동 전환(3일 경과, Graphile Worker cron) — `시스템디자인.md` 섹션 4.2 + 11, `요구사항_명세서.md` 섹션 4.5

### 4.4 카카오톡 공유 보완

- [x] UC-1-2 카카오톡 링크 공유 유즈케이스 작성 (`요구사항_명세서.md`)
- [x] 시스템 디자인 섹션 3-A 카카오톡 공유 설계 (`시스템디자인.md`)
- [x] **OG 메타 태그용 공개 쿼리 설계**: `sessionPreview(sessionId)` 공개 GraphQL 쿼리 — 토큰 불필요, `{ contentType, title, startsAt }` 반환 (`시스템디자인.md` 섹션 11 + 3-A)

---

## Phase 5: 구현 중 결정 가능 (우선순위 낮음)

- [ ] 프론트엔드 라우팅 구조: `/s/{sessionId}`, `/stats`, `/stats/{friendId}`, `/friends` 등 URL 패턴
- [ ] 에러 UX: 만료/잘못된 토큰, 삭제된 세션 접근 시 화면 설계
- [ ] init.sql 초기 Friend 데이터 구성
- [ ] Kakao Developers 앱 등록 + 환경 변수 설정
- [ ] Docker Compose 구성 파일 작성
- [ ] 도메인 / SSL 인증서 설정
