# 프레젠테이션 계층 구현 계획

> GraphQL 타입, 리졸버, Presentation Mapper를 구현한다.
> Relay 스펙(Global ID, Input Object Mutations, Cursor Connections)을 준수한다.

---

## 공통 규칙

- GraphQL ObjectType: `presentation/graphql/types/{entity}.gql.ts`
- GraphQL InputType: `presentation/graphql/inputs/{action}-{entity}.input.gql.ts`
- GraphQL Enum: `presentation/graphql/enums/{enum-name}.enum.gql.ts`
- Resolver: `presentation/resolvers/{queries|mutations|field-resolvers}/`
- Presentation Mapper: `presentation/mappers/{entity}.gql.mapper.ts`
- Mapper 메서드: `static toGql()`, `static toConnectionGql()`
- **리졸버에서 리터럴 객체 직접 반환 금지** — Mapper 경유 필수
- **외래 ID 필드 `@Field(() => ID)` 노출 금지** — field resolver로만 관계 표현
- **모든 `@Field()`에 `nullable` 명시**

---

## 1. GraphQL Enum 정의

### 공유 Enum

| Enum | 값 | 위치 |
|------|----|------|
| `ContentType` | `LOL`, `FUTSAL` | `session/presentation/graphql/enums/` |
| `SessionStatus` | `SCHEDULED`, `CONFIRMED`, `DONE` | `session/presentation/graphql/enums/` |
| `AttendanceStatus` | `UNDECIDED`, `ATTENDING`, `NOT_ATTENDING` | `session/presentation/graphql/enums/` |
| `Team` | `A`, `B` | `shared/presentation/graphql/enums/` |
| `Lane` | `TOP`, `JG`, `MID`, `ADC`, `SUP`, `UNKNOWN` | `shared/presentation/graphql/enums/` |
| `Side` | `BLUE`, `RED`, `UNKNOWN` | `match/presentation/graphql/enums/` |
| `MatchStatus` | `DRAFT`, `LINEUP_LOCKED`, `COMPLETED` | `match/presentation/graphql/enums/` |
| `AttachmentType` | `FUTSAL_PHOTO`, `LOL_RESULT_SCREEN` | `attachment/presentation/graphql/enums/` |
| `AttachmentScope` | `SESSION`, `MATCH` | `attachment/presentation/graphql/enums/` |
| `ExtractionStatus` | `PENDING`, `DONE`, `FAILED` | `attachment/presentation/graphql/enums/` |
| `SessionOrderField` | `DATE_PROXIMITY`, `STARTS_AT`, `STATUS_PRIORITY`, `CREATED_AT` | `session/presentation/graphql/enums/` |

---

## 2. Friend 모듈

### GraphQL Types

```graphql
type Friend implements Node {
  id: ID!                    # Global ID
  displayName: String!
  riotGameName: String
  riotTagLine: String
  isArchived: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

> Friend는 Aggregate Root → Node 구현 → NodeResolver 등록 필수

### Mutations

```graphql
# createFriend
input CreateFriendInput {
  clientMutationId: String
  displayName: String!
  riotGameName: String
  riotTagLine: String
}
type CreateFriendPayload {
  clientMutationId: String
  friend: Friend              # @ResolveField → GetFriendUseCase
}

# updateFriend
input UpdateFriendInput {
  clientMutationId: String
  friendId: ID!               # Global ID
  displayName: String
  riotGameName: String
  riotTagLine: String
}
type UpdateFriendPayload { ... }

# archiveFriend
input ArchiveFriendInput { clientMutationId: String; friendId: ID! }
type ArchiveFriendPayload { clientMutationId: String; friend: Friend }

# restoreFriend
input RestoreFriendInput { clientMutationId: String; friendId: ID! }
type RestoreFriendPayload { clientMutationId: String; friend: Friend }
```

### Queries

```graphql
type Query {
  friends(query: String, includeArchived: Boolean = false): [Friend!]!
}
```

---

## 3. Session 모듈

### GraphQL Types

```graphql
type Session implements Node {
  id: ID!
  contentType: ContentType!
  title: String
  startsAt: DateTime!
  status: SessionStatus!
  isAdminUnlocked: Boolean!
  attendingCount: Int!
  matchCount: Int!
  effectiveLocked: Boolean!    # computed field resolver
  attendances: [Attendance!]!  # plain array (자연적으로 제한)
  teamPresetMembers: [TeamPresetMember!]!
  matches: [Match!]!           # field resolver → Match 모듈
  attachments: [Attachment!]!  # field resolver → Attachment 모듈
  comments: [Comment!]!        # field resolver
  createdAt: DateTime!
  updatedAt: DateTime!
}

type SessionPreview {
  contentType: ContentType!
  title: String
  startsAt: DateTime!
}

type Attendance {
  id: ID!                      # Node 미구현 (내부 Entity)
  friend: Friend!              # field resolver
  status: AttendanceStatus!
}

type TeamPresetMember {
  id: ID!                      # Node 미구현
  friend: Friend!              # field resolver
  team: Team!
  lane: Lane!
}

type Comment implements Node {
  id: ID!
  body: String!
  displayName: String
  createdAt: DateTime!
}
```

### Connection Types

```graphql
type SessionEdge { cursor: String!; node: Session! }
type SessionConnection { edges: [SessionEdge!]!; pageInfo: PageInfo! }

input SessionOrder { field: SessionOrderField!; direction: OrderDirection! }
```

### Queries

```graphql
type Query {
  sessions(
    first: Int, after: String, last: Int, before: String,
    filter: SessionFilter, orderBy: [SessionOrder!]
  ): SessionConnection!

  session(sessionId: ID!): Session!            # 토큰 필요

  sessionPreview(sessionId: ID!): SessionPreview!  # @Public() — 토큰 불필요
}

input SessionFilter { contentType: ContentType }
```

### Mutations

```graphql
# createSession
input CreateSessionInput {
  clientMutationId: String
  contentType: ContentType!
  title: String
  startsAt: DateTime!
}
type CreateSessionPayload {
  clientMutationId: String
  session: Session
  editorToken: String!       # 최초 1회만 반환 (공유 링크 구성용)
  adminToken: String!        # 최초 1회만 반환
}

# confirmSession
input ConfirmSessionInput { clientMutationId: String; sessionId: ID! }
type ConfirmSessionPayload { clientMutationId: String; session: Session }

# updateSession
input UpdateSessionInput { clientMutationId: String; sessionId: ID!; title: String; startsAt: DateTime }

# markDone / reopenSession / deleteSession
# setAttendance
input SetAttendanceInput { clientMutationId: String; sessionId: ID!; friendId: ID!; status: AttendanceStatus! }
type SetAttendancePayload { clientMutationId: String; session: Session }

# setTeamMember
input SetTeamMemberInput { clientMutationId: String; sessionId: ID!; friendId: ID!; team: Team!; lane: Lane }

# bulkSetTeams
input TeamAssignmentInput { friendId: ID!; team: Team!; lane: Lane }
input BulkSetTeamsInput { clientMutationId: String; sessionId: ID!; assignments: [TeamAssignmentInput!]! }

# createComment / deleteComment
input CreateCommentInput { clientMutationId: String; sessionId: ID!; body: String!; displayName: String }
input DeleteCommentInput { clientMutationId: String; commentId: ID! }

# adminUnlock
input AdminUnlockInput { clientMutationId: String; sessionId: ID! }
```

### Field Resolver: effectiveLocked

```typescript
@ResolveField(() => Boolean)
async effectiveLocked(@Parent() session: SessionGql): Promise<boolean> {
  const count = await getAttachmentCountUseCase.execute({ sessionId });
  return count > 0 && !session.isAdminUnlocked;
}
```

---

## 4. Match 모듈

### GraphQL Types

```graphql
type Match implements Node {
  id: ID!
  session: Session!            # field resolver
  matchNo: Int!
  status: MatchStatus!
  winnerSide: Side!
  teamASide: Side!
  isConfirmed: Boolean!
  teamMembers: [MatchTeamMember!]!
  attachments: [Attachment!]!  # field resolver
  extractionResults: [ExtractionResult!]!  # field resolver
  createdAt: DateTime!
}

type MatchTeamMember {
  id: ID!
  friend: Friend!             # field resolver
  team: Team!
  lane: Lane!
  champion: String
}
```

### Mutations

```graphql
input CreateMatchFromPresetInput { clientMutationId: String; sessionId: ID! }
type CreateMatchFromPresetPayload { clientMutationId: String; match: Match }

input SetLaneInput { clientMutationId: String; matchId: ID!; friendId: ID!; lane: Lane! }
input SetChampionInput { clientMutationId: String; matchId: ID!; friendId: ID!; champion: String! }

input ConfirmMatchResultInput {
  clientMutationId: String
  matchId: ID!
  winnerSide: Side!
  teamASide: Side!
}
type ConfirmMatchResultPayload { clientMutationId: String; match: Match }

input DeleteMatchInput { clientMutationId: String; matchId: ID! }
```

---

## 5. Attachment 모듈

### GraphQL Types

```graphql
type Attachment implements Node {
  id: ID!
  scope: AttachmentScope!
  type: AttachmentType!
  url: String!                 # computed: S3 signed URL 또는 direct URL
  contentType: String!
  size: Int!
  width: Int
  height: Int
  originalFileName: String
  extractionResult: ExtractionResult   # field resolver (LOL_RESULT_SCREEN만)
  createdAt: DateTime!
}

type ExtractionResult {
  id: ID!
  status: ExtractionStatus!
  model: String
  result: JSON                 # jsonb
  createdAt: DateTime!
}

type PresignedUpload {
  uploadId: String!
  presignedUrl: String!
}
```

### Mutations

```graphql
# 단건
input CreatePresignedUploadInput {
  clientMutationId: String
  sessionId: ID!
  scope: AttachmentScope!
  matchId: ID                  # MATCH scope면 필수
  type: AttachmentType!
  contentType: String!
  fileName: String
}
type CreatePresignedUploadPayload { clientMutationId: String; upload: PresignedUpload! }

# 배치
input PresignedUploadFileInput {
  scope: AttachmentScope!
  matchId: ID
  type: AttachmentType!
  contentType: String!
  fileName: String
}
input CreatePresignedUploadsInput {
  clientMutationId: String
  sessionId: ID!
  files: [PresignedUploadFileInput!]!
}
type CreatePresignedUploadsPayload { clientMutationId: String; uploads: [PresignedUpload!]! }

# 완료 (단건)
input CompleteUploadInput {
  clientMutationId: String
  sessionId: ID!
  uploadId: String!
  s3Key: String!
  size: Int!
  contentType: String!
  width: Int
  height: Int
}
type CompleteUploadPayload { clientMutationId: String; attachment: Attachment }

# 완료 (배치)
input CompleteUploadFileInput {
  uploadId: String!
  s3Key: String!
  size: Int!
  contentType: String!
  width: Int
  height: Int
}
input CompleteUploadsInput {
  clientMutationId: String
  sessionId: ID!
  uploads: [CompleteUploadFileInput!]!
}
type CompleteUploadsPayload { clientMutationId: String; attachments: [Attachment!]! }

# 삭제
input DeleteAttachmentInput { clientMutationId: String; attachmentId: ID! }
```

---

## 6. Statistics 모듈

### GraphQL Types

```graphql
type FriendStatsSummary {
  friend: Friend!              # field resolver
  winRate: Float               # null = 매치 기록 없음
  wins: Int!
  losses: Int!
  totalMatches: Int!
  topLane: Lane                # null = 기록 없음
}

type StatsOverview {
  friends: [FriendStatsSummary!]!
}

type LaneDistribution {
  lane: Lane!
  playCount: Int!
}

type ChampionStats {
  champion: String!
  wins: Int!
  games: Int!
  winRate: Float!
}

type StatsDetail {
  friend: Friend!
  winRate: Float
  totalMatches: Int!
  topLane: Lane
  laneDistribution: [LaneDistribution!]!
  topChampions: [ChampionStats!]!
}
```

### Queries

```graphql
type Query {
  statsOverview(input: StatsOverviewInput): StatsOverview!
  statsDetail(input: StatsDetailInput!): StatsDetail!
}

input StatsOverviewInput { startDate: DateTime; endDate: DateTime; includeArchived: Boolean = false }
input StatsDetailInput { friendId: ID!; startDate: DateTime; endDate: DateTime }
```

---

## 7. NodeResolver 등록

Node를 구현하는 타입 (Aggregate Root):

| 타입 | Query UseCase |
|------|---------------|
| `Friend` | `GetFriendUseCase` |
| `Session` | `GetSessionUseCase` |
| `Comment` | `GetCommentUseCase` (필요 시) |
| `Match` | `GetMatchUseCase` |
| `Attachment` | `GetAttachmentUseCase` (필요 시) |

Node를 구현하지 않는 타입:
- `Attendance`, `TeamPresetMember`, `MatchTeamMember` (내부 Entity)
- `ExtractionResult`, `SessionPreview`, `PresignedUpload` (독립 조회 불필요)
- 모든 Edge, Connection, PageInfo, Payload 타입

---

## 8. Presentation Mapper 목록

| Mapper | 메서드 | 위치 |
|--------|--------|------|
| `FriendGqlMapper` | `toGql`, `toFriendIdGql` | `friend/presentation/mappers/` |
| `SessionGqlMapper` | `toGql`, `toConnectionGql`, `toPreviewGql` | `session/presentation/mappers/` |
| `AttendanceGqlMapper` | `toGql` | `session/presentation/mappers/` |
| `TeamPresetMemberGqlMapper` | `toGql` | `session/presentation/mappers/` |
| `CommentGqlMapper` | `toGql` | `session/presentation/mappers/` |
| `MatchGqlMapper` | `toGql` | `match/presentation/mappers/` |
| `MatchTeamMemberGqlMapper` | `toGql` | `match/presentation/mappers/` |
| `AttachmentGqlMapper` | `toGql` | `attachment/presentation/mappers/` |
| `ExtractionResultGqlMapper` | `toGql` | `attachment/presentation/mappers/` |
| `StatsGqlMapper` | `toOverviewGql`, `toDetailGql` | `statistics/presentation/mappers/` |

---

## 9. 검증 체크리스트

- [ ] `autoSchemaFile` 기반으로 schema.graphql 자동 생성
- [ ] Relay Global ID encode/decode 동작
- [ ] sessions 쿼리 cursor pagination 동작
- [ ] Mutation Input에 clientMutationId 지원
- [ ] Mutation Payload에서 @ResolveField로 엔티티 조회
- [ ] sessionPreview는 토큰 없이 접근 가능
- [ ] NodeResolver에서 `node(id)` 쿼리로 Friend/Session/Match 조회 가능
