# 애플리케이션 계층 구현 계획

> UseCase (Command/Query), DTO, Application Mapper, ACL 인터페이스를 구현한다.
> CQRS: Command는 `@Transactional()` 필수, Query는 트랜잭션 없음.

---

## 공통 규칙

- UseCase: 단일 `execute()` 메서드만 허용
- Command UseCase: `@Transactional({ propagation: Propagation.REQUIRED })` 필수
- Query UseCase: `@Transactional()` 금지
- 파라미터: 단일 DTO 객체 (Props 패턴)
- 반환: DTO만 반환 (도메인 엔티티 직접 반환 금지)
- DTO 위치: `application/dto/inputs/` 또는 `application/dto/outputs/`
- Mapper 위치: `application/mappers/`

---

## 1. Friend 모듈

### Commands

| UseCase | 파일명 | Input | Output | 비고 |
|---------|--------|-------|--------|------|
| `CreateFriendUseCase` | `create-friend.use-case.ts` | `CreateFriendInputDto` | `{ id: string }` | admin only |
| `UpdateFriendUseCase` | `update-friend.use-case.ts` | `UpdateFriendInputDto` | `{ id: string }` | admin only |
| `ArchiveFriendUseCase` | `archive-friend.use-case.ts` | `{ id: string }` | `void` | admin only |
| `RestoreFriendUseCase` | `restore-friend.use-case.ts` | `{ id: string }` | `void` | admin only |

### Queries

| UseCase | 파일명 | Input | Output |
|---------|--------|-------|--------|
| `GetFriendsUseCase` | `get-friends.use-case.ts` | `GetFriendsInputDto` | `FriendOutputDto[]` |
| `GetFriendUseCase` | `get-friend.use-case.ts` | `{ id: string }` | `FriendOutputDto` |

### DTOs

```typescript
// inputs
CreateFriendInputDto { displayName: string; riotGameName?: string; riotTagLine?: string }
UpdateFriendInputDto { id: string; displayName?: string; riotGameName?: string; riotTagLine?: string }
GetFriendsInputDto { includeArchived?: boolean; query?: string }

// outputs
FriendOutputDto { id, displayName, riotGameName, riotTagLine, isArchived, createdAt, updatedAt }
```

### Application Mapper

```typescript
FriendMapper.toDto(friend: Friend): FriendOutputDto
```

---

## 2. Session 모듈

### Commands

| UseCase | Input | Output | 비고 |
|---------|-------|--------|------|
| `CreateSessionUseCase` | `CreateSessionInputDto` | `{ id, editorToken, adminToken }` | active Friend 전원 Attendance 자동 생성 |
| `UpdateSessionUseCase` | `UpdateSessionInputDto` | `{ id }` | done이면 거절 |
| `ConfirmSessionUseCase` | `{ sessionId }` | `{ id }` | scheduled → confirmed |
| `MarkDoneUseCase` | `{ sessionId }` | `{ id }` | confirmed → done |
| `ReopenSessionUseCase` | `{ sessionId }` | `{ id }` | admin only, done → confirmed |
| `DeleteSessionUseCase` | `{ sessionId }` | `void` | admin only, cascade + S3 비동기 삭제 |
| `AdminUnlockUseCase` | `{ sessionId }` | `{ id }` | admin only |
| `SetAttendanceUseCase` | `SetAttendanceInputDto` | `{ id }` | |
| `SetTeamMemberUseCase` | `SetTeamMemberInputDto` | `{ id }` | effectiveLocked 검사 |
| `BulkSetTeamsUseCase` | `BulkSetTeamsInputDto` | `{ id }` | effectiveLocked 검사 |
| `CreateCommentUseCase` | `CreateCommentInputDto` | `{ id }` | |
| `DeleteCommentUseCase` | `{ commentId }` | `void` | |

### Queries

| UseCase | Input | Output |
|---------|-------|--------|
| `GetSessionsUseCase` | `GetSessionsInputDto` | `ConnectionDto<SessionOutputDto>` |
| `GetSessionUseCase` | `{ sessionId }` | `SessionDetailOutputDto` |
| `GetSessionPreviewUseCase` | `{ sessionId }` | `SessionPreviewOutputDto` |
| `GetCommentsUseCase` | `{ sessionId }` | `CommentOutputDto[]` |

### DTOs

```typescript
// inputs
CreateSessionInputDto { contentType: ContentType; title?: string; startsAt: Date }
UpdateSessionInputDto { sessionId: string; title?: string; startsAt?: Date }
GetSessionsInputDto extends ConnectionArgsDto {
  filter?: { contentType?: ContentType };
  orderBy?: { field: SessionOrderField; direction: OrderDirection }[];
}
SetAttendanceInputDto { sessionId: string; friendId: string; status: AttendanceStatus }
SetTeamMemberInputDto { sessionId: string; friendId: string; team: Team; lane?: Lane }
BulkSetTeamsInputDto { sessionId: string; assignments: { friendId: string; team: Team; lane?: Lane }[] }
CreateCommentInputDto { sessionId: string; body: string; displayName?: string }

// outputs
SessionOutputDto { id, contentType, title, startsAt, status, attendingCount, matchCount, createdAt }
SessionDetailOutputDto { id, contentType, title, startsAt, status, isAdminUnlocked, editorToken, adminToken, attendances[], teamPresetMembers[], createdAt }
SessionPreviewOutputDto { contentType, title, startsAt }
AttendanceOutputDto { id, friendId, status }
TeamPresetMemberOutputDto { id, friendId, team, lane }
CommentOutputDto { id, sessionId, body, displayName, createdAt }
```

### ACL 인터페이스

```typescript
// application/acl/friend-context.acl.interface.ts
interface IFriendContextAcl {
  getActiveFriendIds(): Promise<string[]>;
}

// application/acl/attachment-context.acl.interface.ts
interface IAttachmentContextAcl {
  countBySessionId(sessionId: string): Promise<number>;
}
```

### CreateSession 플로우 (핵심)

```
1. IFriendContextAcl.getActiveFriendIds() → activeFriendIds[]
2. Session.create({ contentType, title, startsAt, activeFriendIds })
   → 내부에서 Attendance(UNDECIDED) 자동 생성
3. sessionRepository.save(session)
4. return { id, editorToken, adminToken }
```

### DeleteSession 플로우 (핵심)

```
1. session = sessionRepository.findById(sessionId)
2. s3Keys = attachmentRepository.findS3KeysBySessionId(sessionId)
3. sessionRepository.delete(session)  → ON DELETE CASCADE
4. [트랜잭션 후] Graphile Worker job: cleanup_s3_objects({ s3Keys })
```

### effectiveLocked 검사 패턴

```
1. attachmentCount = attachmentContextAcl.countBySessionId(sessionId)
2. session.checkStructureChangeAllowed(attachmentCount)
   → effectiveLocked이면 SESSION_LOCKED 예외
```

---

## 3. Match 모듈

### Commands

| UseCase | Input | Output | 비고 |
|---------|-------|--------|------|
| `CreateMatchFromPresetUseCase` | `{ sessionId }` | `{ id }` | Session ACL로 TeamPreset 조회 후 복사 |
| `SetLaneUseCase` | `{ matchId, friendId, lane }` | `{ id }` | |
| `SetChampionUseCase` | `{ matchId, friendId, champion }` | `{ id }` | |
| `ConfirmMatchResultUseCase` | `ConfirmMatchResultInputDto` | `{ id }` | isConfirmed=true, status=COMPLETED |
| `DeleteMatchUseCase` | `{ matchId }` | `void` | admin only, isConfirmed=false만 |

### Queries

| UseCase | Input | Output |
|---------|-------|--------|
| `GetMatchUseCase` | `{ matchId }` | `MatchDetailOutputDto` |
| `GetMatchesBySessionUseCase` | `{ sessionId }` | `MatchOutputDto[]` |

### ACL 인터페이스

```typescript
// application/acl/session-context.acl.interface.ts
interface ISessionContextAcl {
  getTeamPreset(sessionId: string): Promise<TeamPresetDto[]>;
  checkStructureChangeAllowed(sessionId: string): Promise<void>;
}
```

### CreateMatchFromPreset 플로우

```
1. sessionContextAcl.checkStructureChangeAllowed(sessionId)
2. teamPreset = sessionContextAcl.getTeamPreset(sessionId)
3. matchNo = matchRepository.getNextMatchNo(sessionId)
4. Match.create({ sessionId, matchNo, teamMembers: teamPreset })
5. matchRepository.save(match)
```

---

## 4. Attachment 모듈

### Commands

| UseCase | Input | Output | 비고 |
|---------|-------|--------|------|
| `CreatePresignedUploadUseCase` | `CreatePresignedUploadInputDto` | `{ uploadId, presignedUrl }` | count < 10 검사 |
| `CreatePresignedUploadsUseCase` | `CreatePresignedUploadsInputDto` | `{ uploads: [{ uploadId, presignedUrl }] }` | 배치, count + N ≤ 10 |
| `CompleteUploadUseCase` | `CompleteUploadInputDto` | `AttachmentOutputDto` | FOR UPDATE 재검사 |
| `CompleteUploadsUseCase` | `CompleteUploadsInputDto` | `AttachmentOutputDto[]` | 배치, FOR UPDATE |
| `DeleteAttachmentUseCase` | `{ attachmentId }` | `void` | S3 비동기 삭제 |

### Queries

| UseCase | Input | Output |
|---------|-------|--------|
| `GetAttachmentsBySessionUseCase` | `{ sessionId }` | `AttachmentOutputDto[]` |
| `GetExtractionResultUseCase` | `{ attachmentId }` | `ExtractionResultOutputDto \| null` |

### CompleteUpload(s) 플로우 (10장 제한 핵심)

```
1. @Transactional
2. count = attachmentRepository.countBySessionIdForUpdate(sessionId)  → FOR UPDATE
3. if (count + N > 10) throw ATTACHMENT_LIMIT_EXCEEDED
4. attachments = files.map(f => Attachment.create(...))
5. attachmentRepository.saveMany(attachments)
6. LOL_RESULT_SCREEN이면:
   a. extractionResult = ExtractionResult.create({ attachmentId, matchId })
   b. extractionResultRepository.save(extractionResult)
   c. Graphile Worker job: lol_endscreen_extract({ attachmentId, matchId })
7. return attachments.map(toDto)
```

---

## 5. Statistics 모듈

### Queries

| UseCase | Input | Output |
|---------|-------|--------|
| `GetStatsOverviewUseCase` | `StatsQueryInputDto` | `StatsOverviewOutputDto` |
| `GetStatsDetailUseCase` | `StatsDetailQueryInputDto` | `StatsDetailOutputDto` |

### DTOs

```typescript
// inputs
StatsQueryInputDto { startDate?: Date; endDate?: Date; includeArchived?: boolean }
StatsDetailQueryInputDto extends StatsQueryInputDto { friendId: string }

// outputs
StatsOverviewOutputDto {
  friends: FriendStatsSummaryDto[]  // 승률 DESC → 판수 DESC → displayName ASC
}

FriendStatsSummaryDto {
  friendId, displayName, winRate: number | null, wins, losses, totalMatches, topLane: Lane | null
}

StatsDetailOutputDto {
  summary: { winRate, totalMatches, topLane }
  laneDistribution: { lane: Lane, playCount: number }[]
  topChampions: { champion: string, wins: number, games: number, winRate: number }[]
}
```

### 승/패 계산 로직

```
teamAWon = (match.winnerSide === match.teamASide)
memberWon = (member.team === 'A' && teamAWon) || (member.team === 'B' && !teamAWon)
```

---

## 모듈별 구현 순서

각 모듈은 수직 슬라이스로 Domain → Infrastructure → **Application** → Presentation 순서.
Application 계층은 Infrastructure(Repository 구현체)가 완성된 후 구현한다.

```
1. Friend Application (가장 단순 — 패턴 검증)
2. Session Application (가장 복잡 — ACL 2개, 상태 전이)
3. Match Application (Session ACL 의존)
4. Attachment Application (S3 연동, 10장 제한)
5. Statistics Application (읽기 전용, 다른 모듈 ACL 의존)
```
