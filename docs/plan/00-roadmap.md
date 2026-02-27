# PlayNote — 개발 로드맵

> 전체 개발을 8개 Phase로 나누어 진행한다.
> 각 Phase는 독립적으로 검증 가능한 마일스톤을 가진다.

---

## Phase 구성 요약

| Phase | 이름 | 목표 | 산출물 | 예상 기간 |
|-------|------|------|--------|-----------|
| **1** | 프로젝트 초기 설정 | NestJS + Next.js 모노레포 스캐폴딩, 공유 모듈 구축 | 빌드 성공 + 빈 GraphQL endpoint 응답 | 1–2일 |
| **2** | 인증/인가 + Domain 기반 | 토큰 Guard, 공유 도메인 기반 클래스, Relay 라이브러리 | Guard 동작 확인 (토큰 검증) | 1일 |
| **3** | Friend 모듈 (수직 슬라이스) | Domain→Infra→App→Presentation 전 계층 완성 | Friend CRUD GraphQL 동작 | 2–3일 |
| **4** | Session 모듈 | 세션 생명주기 + Attendance + TeamPreset + Comment | 세션 생성→셋업→확정→마감 플로우 | 3–4일 |
| **5** | Match + Attachment 모듈 | 매치 CRUD + 파일 업로드(S3 presigned) + 잠금 규칙 | 매치 생성→결과 확정 + 파일 업로드 | 3–4일 |
| **6** | Statistics + Worker/OCR | 통계 쿼리 + Graphile Worker + OCR 파이프라인 | 통계 조회 + OCR 자동 추출 | 3–4일 |
| **7** | Frontend (Next.js) | 전체 UI 구현 (3-Screen + 통계 + 친구 관리) | 모바일 우선 웹앱 완성 | 5–7일 |
| **8** | 배포 + 통합 테스트 | Docker Compose + nginx + E2E | 프로덕션 배포 가능 상태 | 2–3일 |

---

## Phase 1: 프로젝트 초기 설정

**상세 계획**: [`01-project-setup.md`](./01-project-setup.md)

### 마일스톤
- [ ] NestJS 프로젝트 생성 (`apps/api`)
- [ ] Next.js 프로젝트 생성 (`apps/web`)
- [ ] 모노레포 구조 확정 (yarn workspaces)
- [ ] PostgreSQL + MikroORM 설정
- [ ] GraphQL Code-First 설정 (autoSchemaFile)
- [ ] 공유 모듈 기반 클래스 구축 (`shared/domain`, `shared/exceptions`)
- [ ] libs/relay 라이브러리 포팅
- [ ] ESLint + Prettier 설정
- [ ] `yarn build` 성공

### 검증
```bash
yarn build          # 빌드 성공
yarn lint           # 린트 통과
```

---

## Phase 2: 인증/인가 + Domain 기반

**상세 계획**: [`06-auth.md`](./06-auth.md)

### 마일스톤
- [ ] 토큰 기반 AuthContext 구현 (`x-session-id` + `x-session-token`)
- [ ] `SessionTokenGuard` 구현 (editor/admin 구분)
- [ ] `@Public()` 데코레이터 (토큰 불필요 쿼리용)
- [ ] `@CurrentAuth()` 데코레이터
- [ ] BaseEntity, AggregateRoot, ValueObject 기반 클래스 확정
- [ ] BaseException 및 공유 예외 구현
- [ ] GraphQL Error Filter 구현

### 검증
- 토큰 없이 요청 시 401
- 유효 editorToken으로 요청 시 AuthContext에 role=editor
- `@Public()` 쿼리는 토큰 없이 접근 가능

---

## Phase 3: Friend 모듈 (수직 슬라이스)

**상세 계획**: [`02-domain-layer.md`](./02-domain-layer.md) (friend 섹션), [`03-infrastructure-layer.md`](./03-infrastructure-layer.md), [`04-application-layer.md`](./04-application-layer.md), [`05-presentation-layer.md`](./05-presentation-layer.md)

> Friend 모듈을 첫 번째 수직 슬라이스로 선택하는 이유:
> - 가장 단순한 도메인 (단일 Aggregate, 내부 Entity 없음)
> - 전 계층 패턴을 검증할 수 있음
> - 다른 모듈이 Friend를 참조하므로 선행 필수

### 마일스톤
- [ ] Domain: Friend Aggregate, RiotId VO, IFriendRepository
- [ ] Infrastructure: FriendOrmEntity, MikroFriendRepository
- [ ] Application: CreateFriend, UpdateFriend, ArchiveFriend, GetFriends UseCase
- [ ] Presentation: Friend GraphQL Type, Mutations, Queries, Mapper
- [ ] DB 마이그레이션 생성 (`yarn migration:generate`)
- [ ] init.sql 초기 데이터 구성

### 검증
```graphql
mutation { createFriend(input: { displayName: "테스트", clientMutationId: "1" }) { friend { id displayName } } }
query { friends { id displayName riotGameName } }
```

---

## Phase 4: Session 모듈

### 마일스톤
- [ ] Domain: Session Aggregate (+ Attendance, TeamPresetMember 내부 Entity), Comment Aggregate
- [ ] Domain: SessionStatus 상태 전이, SessionToken VO
- [ ] Infrastructure: ORM Entity + Repository 구현
- [ ] Application: CreateSession, ConfirmSession, MarkDone, ReopenSession, UpdateSession, DeleteSession
- [ ] Application: SetAttendance, SetTeamMember, BulkSetTeams
- [ ] Application: CreateComment, DeleteComment
- [ ] Application: Friend ACL (세션 생성 시 active Friend 조회)
- [ ] Application: Attachment ACL (effectiveLocked 계산)
- [ ] Presentation: Session, Attendance, TeamPresetMember, Comment GraphQL 타입
- [ ] Presentation: Relay cursor pagination (sessions 쿼리)
- [ ] DB 마이그레이션

### 검증
- 세션 생성 시 active Friend 전원 Attendance 자동 생성
- scheduled → confirmed → done 상태 전이
- effectiveLocked 규칙 동작 확인

---

## Phase 5: Match + Attachment 모듈

### 마일스톤
- [ ] Domain: Match Aggregate (+ MatchTeamMember 내부 Entity)
- [ ] Domain: Attachment Aggregate, ExtractionResult Aggregate
- [ ] Infrastructure: S3 presigned URL 서비스
- [ ] Application: CreateMatchFromPreset, SetLane, SetChampion, ConfirmMatchResult, DeleteMatch
- [ ] Application: CreatePresignedUpload(s), CompleteUpload(s), DeleteAttachment
- [ ] Application: Session ACL (Match 생성 시 TeamPreset 조회)
- [ ] Presentation: Match, MatchTeamMember, Attachment, ExtractionResult GraphQL 타입
- [ ] 10장 제한 로직 (presign + complete 이중 검증)
- [ ] DB 마이그레이션

### 검증
```graphql
mutation { createMatchFromPreset(input: { sessionId: "...", clientMutationId: "1" }) { match { id matchNo } } }
mutation { createPresignedUpload(input: { ... }) { uploadId presignedUrl } }
```

---

## Phase 6: Statistics + Worker/OCR

**상세 계획**: [`08-worker-ocr.md`](./08-worker-ocr.md)

### 마일스톤
- [ ] Statistics: StatsOverview, StatsDetail 쿼리 구현
- [ ] Graphile Worker 설정 + `lol_endscreen_extract` 태스크
- [ ] Python CLI 스크립트 (PaddleOCR + RiotID 매칭)
- [ ] ExtractionResult 상태 관리 (PENDING → DONE/FAILED)
- [ ] Auto-done cron (3일 경과 세션 자동 마감)
- [ ] S3 cleanup job (삭제 시 비동기 파일 정리)

### 검증
- statsOverview 쿼리 응답 확인
- LOL_RESULT_SCREEN 업로드 → ExtractionResult PENDING → DONE 전이
- 3일 경과 세션 자동 done 전환

---

## Phase 7: Frontend (Next.js)

**상세 계획**: [`07-frontend.md`](./07-frontend.md)

### 마일스톤
- [ ] Next.js + Apollo Client 설정
- [ ] 토큰 관리 (localStorage, 헤더 주입)
- [ ] 라우팅: `/s/{sessionId}`, `/stats`, `/stats/{friendId}`, `/friends`
- [ ] 하단 탭 바 (Sessions / Statistics / Friends)
- [ ] 세션 목록 (무한 스크롤)
- [ ] 세션 생성 (컨텐츠 선택 + 날짜/시간)
- [ ] 세션 셋업 (참가/팀/라인)
- [ ] 세션 상세 (매치/첨부/댓글)
- [ ] 통계 (Overview + Detail)
- [ ] 친구 관리 (admin CRUD)
- [ ] 카카오톡 공유 (Kakao JS SDK)
- [ ] OG 메타 태그 (generateMetadata + sessionPreview)

### 검증
- 모바일 브라우저에서 전체 플로우 통과
- 카카오톡 공유 메시지 정상 렌더링
- 토큰 없이 접근 시 적절한 에러 UX

---

## Phase 8: 배포 + 통합 테스트

**상세 계획**: [`09-deployment.md`](./09-deployment.md)

### 마일스톤
- [ ] Docker Compose 구성 (web, api, worker, postgres, nginx)
- [ ] nginx 설정 (`/graphql` → api, `/*` → web, TLS)
- [ ] 환경 변수 관리 (.env.example)
- [ ] 통합 테스트 (주요 플로우)
- [ ] 프로덕션 빌드 최적화
- [ ] EC2 배포 + 도메인/SSL 설정

### 검증
```bash
docker compose up -d    # 전체 서비스 기동
# 브라우저에서 https://playnote.app 접속 확인
```

---

## 개발 순서 의존성

```
Phase 1 (프로젝트 설정)
  └── Phase 2 (인증 + 기반)
        └── Phase 3 (Friend — 첫 수직 슬라이스)
              ├── Phase 4 (Session)
              │     └── Phase 5 (Match + Attachment)
              │           └── Phase 6 (Statistics + Worker/OCR)
              └── Phase 7 (Frontend — Phase 5 완료 후 시작 권장, 병렬 가능)
                    └── Phase 8 (배포)
```

---

## 핵심 원칙 (모든 Phase 공통)

1. **NEW_DEVELOPMENT_GUIDE.md 준수**: DDD 4계층, CQRS, Relay 스펙, 코딩 컨벤션
2. **DB 마이그레이션은 반드시 `yarn migration:generate`로 생성** (수동 생성 금지)
3. **수직 슬라이스 우선**: 한 모듈을 Domain→Infra→App→Presentation 전 계층 완성 후 다음 모듈
4. **최소 변경**: 각 Phase에서 해당 Phase 범위만 구현, 불필요한 선행 작업 금지
5. **검증 우선**: 각 마일스톤마다 GraphQL 쿼리/뮤테이션으로 동작 확인
