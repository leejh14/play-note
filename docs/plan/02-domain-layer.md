# 도메인 계층 구현 계획

> 5개 Bounded Context의 도메인 계층을 구현한다.
> 도메인 계층은 프레임워크 독립적이며, NestJS 데코레이터/ORM 코드를 포함하지 않는다.

---

## 공통 규칙

- 모든 엔티티는 `shared/domain/BaseEntity` 또는 `AggregateRoot` 상속
- ID: UUID v7
- 생성: `private constructor` + `static create()` + `static reconstitute()`
- 프로퍼티: `private _field` + `get field()` (setter 금지)
- 배열/객체 getter는 방어적 복사 반환
- 도메인 예외: `BaseException` 상속, 에러 코드는 `{DOMAIN}_{ERROR_TYPE}`
- DI 토큰: `domain/constants.ts`에 Symbol로 정의

---

## 1. Friend 모듈

### 폴더 구조

```
src/domains/friend/domain/
├── aggregates/friend.aggregate.ts
├── value-objects/riot-id.vo.ts
├── repositories/friend.repository.interface.ts
├── exceptions/
│   ├── friend-not-found.exception.ts
│   └── friend-already-archived.exception.ts
└── constants.ts
```

### Friend Aggregate

```
Friend (AggregateRoot)
├── _displayName: string             (NOT NULL)
├── _riotGameName: string | null     (nullable)
├── _riotTagLine: string | null      (nullable)
├── _isArchived: boolean             (default false)
│
├── static create({ displayName, riotGameName?, riotTagLine? })
├── static reconstitute({ id, displayName, ... })
├── updateProfile({ displayName?, riotGameName?, riotTagLine? })
├── archive()                         → isArchived가 이미 true면 예외
├── restore()                         → isArchived가 false면 예외
```

### RiotId Value Object

```
RiotId (ValueObject)
├── readonly gameName: string
├── readonly tagLine: string
├── static create(gameName, tagLine)  → 유효성 검증
├── static reconstitute(gameName, tagLine)
├── toFullString(): string            → "gameName#tagLine"
├── toNormalized(): string            → lowercase
```

### IFriendRepository

```typescript
interface IFriendRepository {
  findById(id: string): Promise<Friend | null>;
  findAllActive(): Promise<Friend[]>;
  findAll(args: { includeArchived?: boolean; query?: string }): Promise<Friend[]>;
  save(friend: Friend): Promise<void>;
  delete(friend: Friend): Promise<void>;
}
```

### DI 토큰 (`constants.ts`)

```typescript
export const FRIEND_REPOSITORY = Symbol('IFriendRepository');
```

### 에러 코드

```typescript
export const FRIEND_ERROR_CODES = {
  FRIEND_NOT_FOUND: 'FRIEND_NOT_FOUND',
  FRIEND_ALREADY_ARCHIVED: 'FRIEND_ALREADY_ARCHIVED',
  FRIEND_NOT_ARCHIVED: 'FRIEND_NOT_ARCHIVED',
} as const;
```

---

## 2. Session 모듈

### 폴더 구조

```
src/domains/session/domain/
├── aggregates/
│   ├── session.aggregate.ts
│   └── comment.aggregate.ts
├── entities/
│   ├── attendance.entity.ts
│   └── team-preset-member.entity.ts
├── enums/
│   ├── session-status.enum.ts       # SCHEDULED | CONFIRMED | DONE
│   ├── attendance-status.enum.ts    # UNDECIDED | ATTENDING | NOT_ATTENDING
│   ├── content-type.enum.ts         # LOL | FUTSAL
│   ├── team.enum.ts                 # A | B
│   └── lane.enum.ts                 # TOP | JG | MID | ADC | SUP | UNKNOWN
├── value-objects/
│   └── session-token.vo.ts
├── repositories/
│   ├── session.repository.interface.ts
│   └── comment.repository.interface.ts
├── exceptions/
│   ├── session-not-found.exception.ts
│   ├── invalid-state-transition.exception.ts
│   ├── session-readonly.exception.ts
│   └── session-locked.exception.ts
└── constants.ts
```

### Session Aggregate

```
Session (AggregateRoot)
├── _contentType: ContentType
├── _title: string | null
├── _startsAt: Date
├── _status: SessionStatus             (default SCHEDULED)
├── _editorToken: string               (crypto.randomBytes 생성)
├── _adminToken: string                (crypto.randomBytes 생성)
├── _isAdminUnlocked: boolean          (default false)
├── _attendances: Attendance[]         (내부 Entity 컬렉션)
├── _teamPresetMembers: TeamPresetMember[]
│
├── static create({ contentType, title?, startsAt, activeFriendIds })
│   → Attendance 자동 생성 (UNDECIDED), 토큰 자동 생성
├── static reconstitute(...)
│
│ -- 상태 전이 --
├── confirm()                          → scheduled → confirmed
├── markDone()                         → confirmed → done
├── reopen()                           → done → confirmed
│
│ -- 수정 --
├── updateInfo({ title?, startsAt? })  → done이면 SESSION_READONLY 예외
│
│ -- Attendance 관리 --
├── setAttendance(friendId, status)
├── getAttendances(): Attendance[]
│
│ -- TeamPreset 관리 --
├── setTeamMember(friendId, { team, lane? })
├── bulkSetTeams(assignments[])
├── removeTeamMember(friendId)
├── getTeamPresetMembers(): TeamPresetMember[]
├── getTeamPresetByTeam(team): TeamPresetMember[]
│
│ -- 잠금 검사 --
├── checkStructureChangeAllowed(attachmentCount: number)
│   → effectiveLocked이면 SESSION_LOCKED 예외
├── adminUnlock()                      → isAdminUnlocked = true
├── adminRelock()                      → isAdminUnlocked = false
│
│ -- 토큰 검증 --
├── validateToken(token): 'editor' | 'admin'
│   → editorToken 매치 → editor, adminToken 매치 → admin, 그 외 예외
```

### Attendance (내부 Entity)

```
Attendance (BaseEntity)
├── _sessionId: string
├── _friendId: string
├── _status: AttendanceStatus          (default UNDECIDED)
│
├── static create({ sessionId, friendId })
├── static reconstitute(...)
├── setStatus(status: AttendanceStatus)
```

### TeamPresetMember (내부 Entity)

```
TeamPresetMember (BaseEntity)
├── _sessionId: string
├── _friendId: string
├── _team: Team                        (A | B)
├── _lane: Lane                        (default UNKNOWN)
│
├── static create({ sessionId, friendId, team, lane? })
├── static reconstitute(...)
├── changeTeam(team)
├── changeLane(lane)
```

### Comment Aggregate

```
Comment (AggregateRoot)
├── _sessionId: string
├── _body: string
├── _displayName: string | null
│
├── static create({ sessionId, body, displayName? })
├── static reconstitute(...)
```

### SessionToken Value Object

```
SessionToken (ValueObject)
├── readonly value: string
├── static generate(): SessionToken    → crypto.randomBytes(32).toString('hex')
├── static reconstitute(value): SessionToken
```

### ISessionRepository

```typescript
interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findAll(args: ConnectionArgsDto & {
    filter?: { contentType?: ContentType };
    orderBy?: SessionOrder[];
  }): Promise<ConnectionDto<Session>>;
  save(session: Session): Promise<void>;
  delete(session: Session): Promise<void>;
}
```

### ICommentRepository

```typescript
interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findBySessionId(sessionId: string): Promise<Comment[]>;
  save(comment: Comment): Promise<void>;
  delete(comment: Comment): Promise<void>;
}
```

### DI 토큰

```typescript
export const SESSION_REPOSITORY = Symbol('ISessionRepository');
export const COMMENT_REPOSITORY = Symbol('ICommentRepository');
```

---

## 3. Match 모듈

### 폴더 구조

```
src/domains/match/domain/
├── aggregates/match.aggregate.ts
├── entities/match-team-member.entity.ts
├── enums/
│   ├── match-status.enum.ts          # DRAFT | LINEUP_LOCKED | COMPLETED
│   ├── side.enum.ts                  # BLUE | RED | UNKNOWN
│   └── lane.enum.ts                  # (session의 Lane enum 재사용 또는 shared)
├── repositories/match.repository.interface.ts
├── exceptions/
│   ├── match-not-found.exception.ts
│   ├── confirmed-match-undeletable.exception.ts
│   └── invalid-match-state.exception.ts
└── constants.ts
```

### Match Aggregate

```
Match (AggregateRoot)
├── _sessionId: string
├── _matchNo: number
├── _status: MatchStatus               (default DRAFT)
├── _winnerSide: Side                  (default UNKNOWN)
├── _teamASide: Side                   (default UNKNOWN)
├── _isConfirmed: boolean              (default false)
├── _teamMembers: MatchTeamMember[]    (내부 Entity)
│
├── static create({ sessionId, matchNo, teamMembers[] })
│   → teamPreset에서 복사된 멤버 정보로 생성
├── static reconstitute(...)
│
├── setLane(friendId, lane)
├── setChampion(friendId, champion)
├── confirmResult({ winnerSide, teamASide })
│   → status = COMPLETED, isConfirmed = true
├── getTeamMembers(): MatchTeamMember[]
├── getMemberByFriendId(friendId): MatchTeamMember | null
│
│ -- 삭제 가드 --
├── ensureDeletable()                  → isConfirmed=true면 예외
```

### MatchTeamMember (내부 Entity)

```
MatchTeamMember (BaseEntity)
├── _matchId: string
├── _friendId: string
├── _team: Team                        (A | B)
├── _lane: Lane                        (default UNKNOWN)
├── _champion: string | null
│
├── static create({ matchId, friendId, team, lane? })
├── static reconstitute(...)
├── changeLane(lane)
├── changeChampion(champion)
```

### IMatchRepository

```typescript
interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
  findBySessionId(sessionId: string): Promise<Match[]>;
  getNextMatchNo(sessionId: string): Promise<number>;
  save(match: Match): Promise<void>;
  delete(match: Match): Promise<void>;
}
```

---

## 4. Attachment 모듈

### 폴더 구조

```
src/domains/attachment/domain/
├── aggregates/
│   ├── attachment.aggregate.ts
│   └── extraction-result.aggregate.ts
├── enums/
│   ├── attachment-type.enum.ts       # FUTSAL_PHOTO | LOL_RESULT_SCREEN
│   ├── attachment-scope.enum.ts      # SESSION | MATCH
│   └── extraction-status.enum.ts    # PENDING | DONE | FAILED
├── services/
│   └── extraction.service.interface.ts
├── repositories/
│   ├── attachment.repository.interface.ts
│   └── extraction-result.repository.interface.ts
├── exceptions/
│   ├── attachment-not-found.exception.ts
│   └── attachment-limit-exceeded.exception.ts
└── constants.ts
```

### Attachment Aggregate

```
Attachment (AggregateRoot)
├── _sessionId: string
├── _matchId: string | null            (SESSION scope면 null)
├── _scope: AttachmentScope
├── _type: AttachmentType
├── _s3Key: string
├── _contentType: string               (MIME)
├── _size: number
├── _width: number | null
├── _height: number | null
├── _originalFileName: string | null
│
├── static create({ sessionId, matchId?, scope, type, s3Key, contentType, size, width?, height?, originalFileName? })
├── static reconstitute(...)
```

### ExtractionResult Aggregate

```
ExtractionResult (AggregateRoot)
├── _attachmentId: string
├── _matchId: string
├── _status: ExtractionStatus          (default PENDING)
├── _model: string | null
├── _result: Record<string, unknown> | null
│
├── static create({ attachmentId, matchId })
├── static reconstitute(...)
├── markDone({ model, result })
├── markFailed()
```

### IExtractionService (DIP 인터페이스)

```typescript
interface IExtractionService {
  execute(input: ExtractionInput): Promise<ExtractionOutput>;
}

interface ExtractionInput {
  attachmentId: string;
  matchId: string;
  s3Key: string;
  teamA: { friendId: string; riotGameName: string | null; riotTagLine: string | null }[];
  teamB: { friendId: string; riotGameName: string | null; riotTagLine: string | null }[];
}

interface ExtractionOutput {
  winnerSide: 'blue' | 'red' | 'unknown';
  teamASide: 'blue' | 'red' | 'unknown';
  confidence: Record<string, number>;
  result: Record<string, unknown>;
}
```

### IAttachmentRepository

```typescript
interface IAttachmentRepository {
  findById(id: string): Promise<Attachment | null>;
  findBySessionId(sessionId: string): Promise<Attachment[]>;
  countBySessionId(sessionId: string): Promise<number>;
  countBySessionIdForUpdate(sessionId: string): Promise<number>;
  save(attachment: Attachment): Promise<void>;
  saveMany(attachments: Attachment[]): Promise<void>;
  delete(attachment: Attachment): Promise<void>;
  findS3KeysBySessionId(sessionId: string): Promise<string[]>;
  findS3KeysByMatchId(matchId: string): Promise<string[]>;
}
```

### IExtractionResultRepository

```typescript
interface IExtractionResultRepository {
  findById(id: string): Promise<ExtractionResult | null>;
  findByAttachmentId(attachmentId: string): Promise<ExtractionResult | null>;
  findByMatchId(matchId: string): Promise<ExtractionResult[]>;
  save(result: ExtractionResult): Promise<void>;
}
```

---

## 5. Statistics 모듈 (읽기 전용)

> Statistics 모듈은 자체 도메인 엔티티가 없으며, Application 계층에서 Match/Friend ACL을 통해 데이터를 조회하고 집계한다.

### 폴더 구조

```
src/domains/statistics/
├── application/
│   ├── use-cases/queries/
│   │   ├── get-stats-overview.use-case.ts
│   │   └── get-stats-detail.use-case.ts
│   ├── dto/
│   │   ├── inputs/stats-query.input.dto.ts
│   │   └── outputs/
│   │       ├── stats-overview.output.dto.ts
│   │       └── stats-detail.output.dto.ts
│   └── acl/
│       ├── match-stats-context.acl.interface.ts
│       └── friend-stats-context.acl.interface.ts
├── infrastructure/
│   └── acl/
├── presentation/
└── statistics.module.ts
```

### ACL 인터페이스 (Application 계층)

```typescript
// match-stats-context.acl.interface.ts
interface IMatchStatsContextAcl {
  getConfirmedMatchStats(input: {
    friendId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MatchStatsRawDto[]>;
}

// friend-stats-context.acl.interface.ts
interface IFriendStatsContextAcl {
  getActiveFriends(input: { includeArchived?: boolean }): Promise<FriendSummaryDto[]>;
}
```

---

## 공유 Enum 배치 전략

Lane enum은 Session과 Match 양쪽에서 사용된다. 두 가지 접근 가능:

**선택: `shared/domain/enums/`에 공유 enum 배치**

```
shared/domain/enums/
├── team.enum.ts        # A | B
└── lane.enum.ts        # TOP | JG | MID | ADC | SUP | UNKNOWN
```

이유: Team과 Lane은 Session과 Match 양쪽에서 동일한 비즈니스 의미로 사용되며, BC 간 공유가 자연스러움.

---

## 구현 순서

1. **shared/domain/** 기반 클래스 (BaseEntity, AggregateRoot, ValueObject)
2. **shared/domain/enums/** 공유 enum (Team, Lane)
3. **friend/domain/** — 가장 단순, 패턴 검증용
4. **session/domain/** — 가장 복잡 (내부 Entity 3개, 상태 머신)
5. **match/domain/**
6. **attachment/domain/**
7. **(statistics는 도메인 계층 없음)**
