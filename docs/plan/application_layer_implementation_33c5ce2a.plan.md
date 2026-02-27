---
name: Application Layer Implementation
overview: "[04-application-layer.md](docs/plan/04-application-layer.md) 기준으로 Friend → Session → Match → Attachment → Statistics 순서로 Application 계층(UseCase, DTO, Mapper, ACL 인터페이스)을 구현한다."
todos: []
isProject: false
---

# Application 계층 구현 계획

## 사전 준비: 공통 인프라 연동

**현재 상태**: `GraphileWorkerModule`, `S3StorageService`가 존재하나 `AppModule`에 미등록.

**작업**:

- `StorageModule` 신설: [apps/api/src/shared/infrastructure/storage/s3-storage.service.ts](apps/api/src/shared/infrastructure/storage/s3-storage.service.ts)를 제공·export
- [apps/api/src/app.module.ts](apps/api/src/app.module.ts)에 `GraphileWorkerModule`, `StorageModule` import 추가
- Session/Attachment UseCase에서 `GraphileWorkerService`, `S3StorageService` 주입 가능하도록 구성

---

## 모듈 구조

각 도메인별 `{domain}.application.module.ts` 신설:

- `FriendApplicationModule` → `FriendInfrastructureModule` import
- `SessionApplicationModule` → `SessionInfrastructureModule`, `AttachmentInfrastructureModule`, `GraphileWorkerModule` import
- `MatchApplicationModule` → `MatchInfrastructureModule` import (SessionContextAcl 포함)
- `AttachmentApplicationModule` → `AttachmentInfrastructureModule`, `StorageModule`, `GraphileWorkerModule` import
- `StatisticsApplicationModule` → `StatisticsInfrastructureModule` import

---

## 1. Friend Application (패턴 검증)

| 구분         | 항목                                                     | 파일/내용                                                                                                       |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **DTO**      | inputs                                                   | `CreateFriendInputDto`, `UpdateFriendInputDto`, `GetFriendsInputDto`, `{ id: string }`                          |
|              | outputs                                                  | `FriendOutputDto`                                                                                               |
| **Mapper**   | `FriendMapper.toDto(friend)`                             | [friend/application/mappers/friend.mapper.ts](apps/api/src/domains/friend/application/mappers/friend.mapper.ts) |
| **Commands** | CreateFriend, UpdateFriend, ArchiveFriend, RestoreFriend | `@Transactional`, `em` 주입                                                                                     |
| **Queries**  | GetFriends, GetFriend                                    | 트랜잭션 없음                                                                                                   |
| **의존**     | `FRIEND_REPOSITORY`                                      | FriendInfrastructureModule                                                                                      |

**Blast radius**: friend/application/ 신규, friend.application.module.ts, AppModule import 추가

---

## 2. Session Application

### ACL 인터페이스 이전

- `IFriendContextAcl` → [session/application/acl/friend-context.acl.interface.ts](apps/api/src/domains/session/application/acl/friend-context.acl.interface.ts)
- `IAttachmentContextAcl` → [session/application/acl/attachment-context.acl.interface.ts](apps/api/src/domains/session/application/acl/attachment-context.acl.interface.ts)
- Infrastructure의 `FriendContextAcl`, `AttachmentContextAcl`는 해당 인터페이스 implement + DI 토큰으로 제공

### DTO·Mapper

- inputs: CreateSession, UpdateSession, SetAttendance, SetTeamMember, BulkSetTeams, CreateComment, GetSessions(ConnectionArgsDto 확장) 등
- outputs: SessionOutputDto, SessionDetailOutputDto, SessionPreviewOutputDto, AttendanceOutputDto, TeamPresetMemberOutputDto, CommentOutputDto
- `SessionMapper`, `CommentMapper` (toDto, toConnectionGql 등)

### 핵심 UseCase 플로우

**CreateSessionUseCase**:

```
IFriendContextAcl.getActiveFriendIds() → Session.create() → sessionRepository.save() → { id, editorToken, adminToken }
```

**DeleteSessionUseCase**:

```
session = sessionRepository.findById() → s3Keys = attachmentRepository.findS3KeysBySessionId()
→ sessionRepository.delete() → [트랜잭션 종료 후] GraphileWorkerService.addJob('cleanup_s3_objects', { s3Keys })
```

**effectiveLocked 패턴** (SetTeamMember, BulkSetTeams 등):

```
attachmentCount = IAttachmentContextAcl.countBySessionId() → session.checkStructureChangeAllowed(attachmentCount)
```

**의존**: SESSION_REPOSITORY, COMMENT_REPOSITORY, IFriendContextAcl, IAttachmentContextAcl, ATTACHMENT_REPOSITORY, GraphileWorkerService

---

## 3. Match Application

### ISessionContextAcl 확장

- 위치: [match/application/acl/session-context.acl.interface.ts](apps/api/src/domains/match/application/acl/session-context.acl.interface.ts)
- 기존 `SessionContextAcl` (Match infra)에 `checkStructureChangeAllowed(sessionId)` 추가
- 구현: `IAttachmentContextAcl.countBySessionId()` → `session.checkStructureChangeAllowed(count)` → locked 시 throw

### CreateMatchFromPresetUseCase 플로우

```
sessionContextAcl.checkStructureChangeAllowed(sessionId)
→ teamPreset = sessionContextAcl.getTeamPreset(sessionId)
→ matchNo = matchRepository.getNextMatchNo(sessionId)
→ Match.create({ sessionId, matchNo, teamMembers: teamPreset })
→ matchRepository.save()
```

**의존**: MATCH_REPOSITORY, ISessionContextAcl

---

## 4. Attachment Application

### 핵심 플로우

**CreatePresignedUploadUseCase**: count < 10 검사 → S3StorageService.generatePresignedPutUrl → Attachment는 미생성(CompleteUpload 시 생성)

**CompleteUploadUseCase(s)**:

```
@Transactional → count = countBySessionIdForUpdate(sessionId)
→ if (count + N > 10) throw ATTACHMENT_LIMIT_EXCEEDED
→ Attachment.create() → saveMany()
→ LOL_RESULT_SCREEN이면 ExtractionResult.create + save + addJob('lol_endscreen_extract')
```

**DeleteAttachmentUseCase**: attachment 삭제 후 S3 비동기 삭제 job 등록

**의존**: ATTACHMENT_REPOSITORY, EXTRACTION_RESULT_REPOSITORY, S3StorageService, GraphileWorkerService

---

## 5. Statistics Application

- Queries만: GetStatsOverviewUseCase, GetStatsDetailUseCase
- DTO: StatsQueryInputDto, StatsDetailQueryInputDto, StatsOverviewOutputDto, StatsDetailOutputDto, FriendStatsSummaryDto
- ACL: IMatchStatsContextAcl, IFriendStatsContextAcl (인터페이스 → application/acl, 구현체는 기존 statistics infra)
- 승/패: `teamAWon = (winnerSide === teamASide)`, `memberWon = (member.team === 'A' && teamAWon) || (member.team === 'B' && !teamAWon)`

---

## 트랜잭션 및 규칙 요약

| 구분            | @Transactional                                          | em 주입 |
| --------------- | ------------------------------------------------------- | ------- |
| Command UseCase | `@Transactional({ propagation: Propagation.REQUIRED })` | 필수    |
| Query UseCase   | 사용 금지                                               | 불필요  |

- MikroORM `Transactional` 사용 (`@mikro-orm/core`)
- `EntityManager` 주입 변수명: `em`
- Connection 쿼리: `validateRelayArgs(args)` 호출, PK tie-breaker 정렬

---

## 구현 순서 (Todo)

1. **사전** - StorageModule, AppModule에 GraphileWorkerModule·StorageModule 등록
2. **Friend** - DTO, Mapper, 4 Commands, 2 Queries, FriendApplicationModule
3. **Session** - ACL 인터페이스, DTO, Mapper, 12 Commands, 4 Queries, SessionApplicationModule
4. **Match** - ISessionContextAcl 확장(checkStructureChangeAllowed), DTO, Mapper, 5 Commands, 2 Queries, MatchApplicationModule
5. **Attachment** - DTO, Mapper, 5 Commands, 2 Queries, AttachmentApplicationModule
6. **Statistics** - ACL 인터페이스, DTO, 2 Queries, StatisticsApplicationModule

---

## 검증

- `yarn build` - 타입/구문 오류 없음
- `yarn lint` - 규칙 준수
- (선택) `yarn test` - Unit 테스트 통과

---

## 롤백

- 각 Application 모듈 및 UseCase는 Infrastructure와 분리되어 있음
- AppModule import 제거 시 기존 Infrastructure만 동작
- ACL 인터페이스 추가는 기존 구현체에 `implements` 추가로 하위 호환
