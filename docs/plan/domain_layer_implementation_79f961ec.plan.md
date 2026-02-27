---
name: Domain Layer Implementation
overview: 02-domain-layer.md 계획에 따라 5개 도메인 모듈의 도메인 계층을 구현한다. 공유 enum부터 시작해서 Friend(가장 단순) -> Session(가장 복잡) -> Match -> Attachment 순서로 진행한다.
todos:
  - id: shared-enums
    content: "shared/domain/enums/ 생성: Team (A|B), Lane (TOP|JG|MID|ADC|SUP|UNKNOWN)"
    status: completed
  - id: friend-domain
    content: "friend/domain/ 구현: Friend Aggregate, RiotId VO, IFriendRepository, 예외, constants"
    status: completed
  - id: session-domain
    content: "session/domain/ 구현: Session Aggregate(상태전이/Attendance/TeamPreset/잠금/토큰), Comment Aggregate, 내부 Entity 2개, SessionToken VO, enums 3개, Repository 2개, 예외 4개, constants"
    status: completed
  - id: match-domain
    content: "match/domain/ 구현: Match Aggregate, MatchTeamMember Entity, enums 2개 (MatchStatus, Side), IMatchRepository, 예외 3개, constants"
    status: completed
  - id: attachment-domain
    content: "attachment/domain/ 구현: Attachment Aggregate, ExtractionResult Aggregate, enums 3개, IExtractionService, Repository 2개, 예외 2개, constants"
    status: completed
isProject: false
---

# 도메인 계층 구현 계획

## 결정사항 요약

- **RiotId VO**: raw string 유지 (`_riotGameName`, `_riotTagLine` 별도 필드). `RiotId` VO는 유틸리티 용도로만 생성
- **effectiveLocked**: `attachmentCount > 0 && !isAdminUnlocked` (시스템디자인.md 4.3절 확인)
- **Friend pagination**: plain array (`Friend[]`) 반환, Relay pagination 미적용
- **AttendanceStatus**: `UNDECIDED | ATTENDING | NOT_ATTENDING` (시스템디자인.md 확정)
- **SessionStatus**: `SCHEDULED | CONFIRMED | DONE` (3 states, roster_locked 제거 확정)

## 기존 코드 활용

Phase 1에서 이미 생성된 파일 (변경 불필요):

- `src/shared/domain/base-entity.ts` — BaseEntity (UUID v7 ID, createdAt, updatedAt)
- `src/shared/domain/aggregate-root.ts` — AggregateRoot extends BaseEntity
- `src/shared/domain/value-object.ts` — ValueObject abstract class
- `src/shared/exceptions/*.ts` — BaseException 및 6개 예외 클래스

## 구현 순서

### Step 1: 공유 Enum (`shared/domain/enums/`)

`Lane`과 `Team`은 Session/Match 양쪽에서 동일한 의미로 사용 (02-domain-layer.md 490-503행)

- `src/shared/domain/enums/team.enum.ts` — `A | B`
- `src/shared/domain/enums/lane.enum.ts` — `TOP | JG | MID | ADC | SUP | UNKNOWN`

### Step 2: Friend 도메인 (가장 단순, 패턴 검증용)

```
src/domains/friend/domain/
  aggregates/friend.aggregate.ts
  value-objects/riot-id.vo.ts
  repositories/friend.repository.interface.ts
  exceptions/friend-not-found.exception.ts
  exceptions/friend-already-archived.exception.ts
  constants.ts
```

**Friend Aggregate 핵심**:

- `_displayName: string`, `_riotGameName: string | null`, `_riotTagLine: string | null`, `_isArchived: boolean`
- `create()` / `reconstitute()` / `updateProfile()` / `archive()` / `restore()`
- archive()가 이미 true면 `FriendAlreadyArchivedException`, restore()가 false면 예외

**RiotId VO**: `create(gameName, tagLine)` — 유효성 검증 (빈 문자열 체크 등), `toFullString()`, `toNormalized()`. Friend가 직접 사용하지 않고 외부 유틸리티로 활용

**IFriendRepository**: `findById`, `findAllActive`, `findAll(args)`, `save`, `delete` — 모두 plain array 반환

### Step 3: Session 도메인 (가장 복잡)

```
src/domains/session/domain/
  aggregates/session.aggregate.ts
  aggregates/comment.aggregate.ts
  entities/attendance.entity.ts
  entities/team-preset-member.entity.ts
  enums/session-status.enum.ts
  enums/attendance-status.enum.ts
  enums/content-type.enum.ts
  value-objects/session-token.vo.ts
  repositories/session.repository.interface.ts
  repositories/comment.repository.interface.ts
  exceptions/session-not-found.exception.ts
  exceptions/invalid-state-transition.exception.ts
  exceptions/session-readonly.exception.ts
  exceptions/session-locked.exception.ts
  constants.ts
```

**Session Aggregate 핵심**:

- 상태 전이: `confirm()` (SCHEDULED->CONFIRMED), `markDone()` (CONFIRMED->DONE), `reopen()` (DONE->CONFIRMED)
- 내부 Entity 관리: Attendance, TeamPresetMember 컬렉션
- `checkStructureChangeAllowed(attachmentCount)`: `(attachmentCount > 0) && !isAdminUnlocked` -> 예외
- 토큰 검증: `validateToken(token)` -> `'editor' | 'admin'`
- `updateInfo()`: done이면 `SessionReadonlyException`

**Attendance Entity**: `_sessionId`, `_friendId`, `_status` (UNDECIDED default), `setStatus()`

**TeamPresetMember Entity**: `_sessionId`, `_friendId`, `_team` (Team.A/B), `_lane` (Lane.UNKNOWN default)

**Comment Aggregate**: 단순 CRUD. `_sessionId`, `_body`, `_displayName`

**SessionToken VO**: `crypto.randomBytes(32).toString('hex')`, `generate()`, `reconstitute()`

### Step 4: Match 도메인

```
src/domains/match/domain/
  aggregates/match.aggregate.ts
  entities/match-team-member.entity.ts
  enums/match-status.enum.ts
  enums/side.enum.ts
  repositories/match.repository.interface.ts
  exceptions/match-not-found.exception.ts
  exceptions/confirmed-match-undeletable.exception.ts
  exceptions/invalid-match-state.exception.ts
  constants.ts
```

**Match Aggregate 핵심**:

- `_status: MatchStatus` (DRAFT->LINEUP_LOCKED->COMPLETED)
- `_winnerSide` / `_teamASide`: Side enum (BLUE/RED/UNKNOWN)
- `_isConfirmed: boolean` (통계 반영 여부)
- `confirmResult({ winnerSide, teamASide })`: status=COMPLETED, isConfirmed=true
- `ensureDeletable()`: isConfirmed=true면 `ConfirmedMatchUndeletableException`
- MatchTeamMember 내부 Entity: `_team`, `_lane`, `_champion: string | null`

### Step 5: Attachment 도메인

```
src/domains/attachment/domain/
  aggregates/attachment.aggregate.ts
  aggregates/extraction-result.aggregate.ts
  enums/attachment-type.enum.ts
  enums/attachment-scope.enum.ts
  enums/extraction-status.enum.ts
  services/extraction.service.interface.ts
  repositories/attachment.repository.interface.ts
  repositories/extraction-result.repository.interface.ts
  exceptions/attachment-not-found.exception.ts
  exceptions/attachment-limit-exceeded.exception.ts
  constants.ts
```

**Attachment Aggregate**: 단순 데이터 홀더 (S3 메타데이터)
**ExtractionResult Aggregate**: `markDone({ model, result })`, `markFailed()`
**IExtractionService**: DIP 인터페이스 (domain/services/)

### Step 6: Statistics (도메인 계층 없음)

Statistics는 자체 도메인 엔티티가 없으므로 도메인 계층 구현을 건너뜀 (Application 계층에서 ACL로 처리).

## 주의사항

- 모든 도메인 코드는 **프레임워크 독립적** — NestJS 데코레이터, ORM 코드 금지
- 프로퍼티: `private _field` + `get field()`, setter 금지
- 배열 getter는 방어적 복사 (`[...this._items]`)
- 에러 코드: `{DOMAIN}_{ERROR_TYPE}` 형식 (예: `FRIEND_NOT_FOUND`)
- DI 토큰: `domain/constants.ts`에 Symbol로 정의
- Repository 반환 타입: 도메인 엔티티 또는 원시 타입만 (DTO 금지)
