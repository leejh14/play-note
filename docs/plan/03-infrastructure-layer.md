# 인프라 계층 구현 계획

> ORM Entity, Repository 구현체, S3 서비스, ACL 구현체를 작성한다.
> DB 마이그레이션은 반드시 `yarn migration:generate`로 생성한다 (수동 생성 금지).

---

## 공통 규칙

- ORM Entity 파일: `*.orm-entity.ts`, 클래스명: `{Entity}OrmEntity`
- Repository 구현체: `mikro-{entity}.repository.ts`
- ORM Entity ↔ 도메인 Entity 변환: Repository 내부의 `toOrmEntity()` / `toDomainEntity()`
- **PlayNote는 멀티테넌시가 없으므로** tenant filter, tenantId 컬럼 불필요
- `@Filter` 적용 불필요

---

## 1. ORM Entity 목록

### Friend

```
friend.orm-entity.ts
├── id: string (PK, uuid)
├── displayName: string
├── riotGameName: string | null
├── riotTagLine: string | null
├── isArchived: boolean (default false)
├── createdAt: Date
├── updatedAt: Date
```

### Session

```
session.orm-entity.ts
├── id: string (PK, uuid)
├── contentType: string (enum)
├── title: string | null
├── startsAt: Date
├── status: string (enum, default 'SCHEDULED')
├── editorToken: string (UNIQUE)
├── adminToken: string (UNIQUE)
├── isAdminUnlocked: boolean (default false)
├── createdAt: Date
├── updatedAt: Date
│
├── @OneToMany → AttendanceOrmEntity (cascade)
├── @OneToMany → TeamPresetMemberOrmEntity (cascade)
```

### Attendance

```
attendance.orm-entity.ts
├── id: string (PK, uuid)
├── sessionId: string (FK → session, ON DELETE CASCADE)
├── friendId: string
├── status: string (enum, default 'UNDECIDED')
├── createdAt: Date
├── updatedAt: Date
│
├── UNIQUE(sessionId, friendId)
```

### TeamPresetMember

```
team-preset-member.orm-entity.ts
├── id: string (PK, uuid)
├── sessionId: string (FK → session, ON DELETE CASCADE)
├── friendId: string
├── team: string (enum)
├── lane: string (enum, default 'UNKNOWN')
├── createdAt: Date
├── updatedAt: Date
│
├── UNIQUE(sessionId, friendId)
```

### Comment

```
comment.orm-entity.ts
├── id: string (PK, uuid)
├── sessionId: string
├── body: string (text)
├── displayName: string | null
├── createdAt: Date
│
├── INDEX(sessionId)
```

### Match

```
match.orm-entity.ts
├── id: string (PK, uuid)
├── sessionId: string
├── matchNo: number
├── status: string (enum, default 'DRAFT')
├── winnerSide: string (enum, default 'UNKNOWN')
├── teamASide: string (enum, default 'UNKNOWN')
├── isConfirmed: boolean (default false)
├── createdAt: Date
├── updatedAt: Date
│
├── UNIQUE(sessionId, matchNo)
├── @OneToMany → MatchTeamMemberOrmEntity (cascade)
```

### MatchTeamMember

```
match-team-member.orm-entity.ts
├── id: string (PK, uuid)
├── matchId: string (FK → match, ON DELETE CASCADE)
├── friendId: string
├── team: string (enum)
├── lane: string (enum, default 'UNKNOWN')
├── champion: string | null
├── createdAt: Date
├── updatedAt: Date
│
├── UNIQUE(matchId, friendId)
```

### Attachment

```
attachment.orm-entity.ts
├── id: string (PK, uuid)
├── sessionId: string
├── matchId: string | null
├── scope: string (enum)
├── type: string (enum)
├── s3Key: string
├── contentType: string
├── size: number
├── width: number | null
├── height: number | null
├── originalFileName: string | null
├── createdAt: Date
│
├── INDEX(sessionId)
```

### ExtractionResult

```
extraction-result.orm-entity.ts
├── id: string (PK, uuid)
├── attachmentId: string (UNIQUE)
├── matchId: string
├── status: string (enum, default 'PENDING')
├── model: string | null
├── result: jsonb | null
├── createdAt: Date
```

---

## 2. Repository 구현체

### MikroFriendRepository

```
infrastructure/persistence/mikro-friend.repository.ts
├── findById(id) → em.findOne + toDomainEntity
├── findAllActive() → em.find({ isArchived: false }) + map(toDomainEntity)
├── findAll({ includeArchived, query }) → em.find + filter + map
├── save(friend) → em.upsert(toOrmEntity)
├── delete(friend) → em.removeAndFlush
│
├── private toOrmEntity(friend: Friend): FriendOrmEntity
├── private toDomainEntity(orm: FriendOrmEntity): Friend
```

### MikroSessionRepository

```
infrastructure/persistence/mikro-session.repository.ts
├── findById(id) → em.findOne + populate(attendances, teamPresetMembers)
├── findByToken(token) → em.findOne({ $or: [{ editorToken }, { adminToken }] })
├── findAll(args) → findByCursor + Relay pagination
│   → DATE_PROXIMITY: ABS(EXTRACT(EPOCH FROM (starts_at - NOW())))
│   → STATUS_PRIORITY: CASE WHEN ...
│   → PK tie-breaker 필수
├── save(session) → em.upsert + cascade
├── delete(session) → em.removeAndFlush (ON DELETE CASCADE로 자식 자동 삭제)
```

### MikroCommentRepository

```
infrastructure/persistence/mikro-comment.repository.ts
├── findById, findBySessionId, save, delete
```

### MikroMatchRepository

```
infrastructure/persistence/mikro-match.repository.ts
├── findById(id) → em.findOne + populate(teamMembers)
├── findBySessionId(sessionId)
├── getNextMatchNo(sessionId) → SELECT MAX(matchNo) + 1
├── save(match) → em.upsert + cascade
├── delete(match) → em.removeAndFlush
```

### MikroAttachmentRepository

```
infrastructure/persistence/mikro-attachment.repository.ts
├── findById, findBySessionId
├── countBySessionId → SELECT COUNT(*)
├── countBySessionIdForUpdate → SELECT COUNT(*) ... FOR UPDATE
├── save, saveMany, delete
├── findS3KeysBySessionId → SELECT s3_key WHERE sessionId = ?
├── findS3KeysByMatchId → SELECT s3_key WHERE matchId = ?
```

### MikroExtractionResultRepository

```
infrastructure/persistence/mikro-extraction-result.repository.ts
├── findById, findByAttachmentId, findByMatchId, save
```

---

## 3. S3 서비스

```
shared/infrastructure/storage/s3-storage.service.ts
├── generatePresignedPutUrl(key, contentType, expiresIn?): Promise<string>
├── deleteObject(key): Promise<void>
├── deleteObjects(keys: string[]): Promise<void>
├── getSignedUrl(key, expiresIn?): Promise<string>
```

### S3 Key 규칙

```
attachments/{sessionId}/{uploadId}.{ext}
```

---

## 4. ACL 구현체

### Friend ACL (Session 모듈이 사용)

```
session/infrastructure/acl/friend-context.acl.ts

구현:
├── getActiveFriendIds(): string[]
│   → FriendRepository.findAllActive() 호출
│   (InfrastructureModule에서 Friend UseCase를 DI 토큰으로 바인딩)
```

### Attachment ACL (Session 모듈이 사용)

```
session/infrastructure/acl/attachment-context.acl.ts

구현:
├── countBySessionId(sessionId): number
│   → AttachmentRepository.countBySessionId() 호출
```

### Session ACL (Match 모듈이 사용)

```
match/infrastructure/acl/session-context.acl.ts

구현:
├── getTeamPreset(sessionId): TeamPresetDto[]
│   → SessionRepository.findById() → teamPresetMembers 반환
```

### Match/Friend ACL (Statistics 모듈이 사용)

```
statistics/infrastructure/acl/
├── match-stats-context.acl.ts
│   → 확정된 매치 + 멤버 통계 원시 데이터 쿼리
├── friend-stats-context.acl.ts
│   → active Friend 목록 조회
```

---

## 5. Graphile Worker 인프라

```
shared/infrastructure/worker/graphile-worker.module.ts
├── Graphile Worker 초기화 (NestJS 모듈 래퍼)
├── 태스크 등록: 'lol_endscreen_extract', 'cleanup_s3_objects', 'auto_done_sessions'
```

### IExtractionService 구현체

```
attachment/infrastructure/extraction/python-cli-extraction.service.ts
├── execute(input) → execa로 Python CLI 호출
│   → python scripts/ocr/extract.py --input <json>
│   → stdout JSON 파싱 → ExtractionOutput 반환
```

---

## 6. InfrastructureModule 패턴

각 도메인 모듈의 `{domain}.infrastructure.module.ts`:

```typescript
@Module({
  imports: [
    MikroOrmModule.forFeature([FriendOrmEntity]),
  ],
  providers: [
    {
      provide: FRIEND_REPOSITORY,
      useClass: MikroFriendRepository,
    },
  ],
  exports: [FRIEND_REPOSITORY],
})
export class FriendInfrastructureModule {}
```

---

## 7. 마이그레이션 전략

1. ORM Entity 작성 완료 후 `yarn migration:generate` 실행
2. 생성된 마이그레이션 파일 검토 (FK, CASCADE, INDEX, UNIQUE 확인)
3. `yarn migration:up` 으로 적용
4. **수동으로 마이그레이션 SQL 파일을 작성하지 않는다**

### 마이그레이션 순서 (FK 의존성)

```
1. friend (의존성 없음)
2. session (의존성 없음)
3. attendance (→ session FK)
4. team_preset_member (→ session FK)
5. comment (sessionId만 참조, FK 없을 수 있음)
6. match (sessionId 참조)
7. match_team_member (→ match FK)
8. attachment (sessionId, matchId 참조)
9. extraction_result (attachmentId, matchId 참조)
```

---

## 8. 검증 체크리스트

- [ ] 모든 ORM Entity 작성 완료
- [ ] `yarn migration:generate` 성공
- [ ] `yarn migration:up` 성공 — 테이블 11개 생성 확인
- [ ] FK CASCADE 동작 확인 (session 삭제 시 attendance, match 등 cascade)
- [ ] UNIQUE 제약 동작 확인 (attendance.sessionId+friendId 등)
- [ ] Repository CRUD 동작 확인 (단위 테스트 또는 수동)
