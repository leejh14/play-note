# 인증/인가 시스템 계획 (Phase 06 확정안)

> PlayNote는 로그인 없는 토큰 기반 시스템이다.
> Phase 06에서는 Phase 05 최소 인증을 운영형 구조로 고도화한다.

---

## 1. 목표/범위

- 범위: `apps/api` 코드 + 문서 반영 (`docs/plan`, `docs/시스템디자인.md`)
- 비범위: Web 토큰 저장/주입 로직 변경(후속 단계)
- 유지 정책:
  - 인증 헤더: `x-session-id`, `x-session-token`
  - Guard 구조: `SessionTokenGuard` 단일
  - 캐시 미도입: 매 요청 DB 조회 유지

---

## 2. 핵심 설계 결정

### 2.1 Auth Reader 포트 분리

Guard/Service가 Session Aggregate 전체를 조회하지 않도록 전용 포트를 둔다.

```typescript
// auth/services/session-token-reader.interface.ts
export interface SessionTokenRecord {
  readonly sessionId: string;
  readonly editorToken: string;
  readonly adminToken: string;
}

export interface ISessionTokenReader {
  findBySessionId(sessionId: string): Promise<SessionTokenRecord | null>;
}
```

DI 토큰:

```typescript
// auth/constants/tokens.ts
export const SESSION_TOKEN_READER = Symbol('ISessionTokenReader');
```

### 2.2 에러 코드 분리 정책

```typescript
// auth/constants/error-codes.ts
export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
} as const;
```

`errors[].extensions.code` 매핑:
- 세션 없음: `SESSION_NOT_FOUND`
- 토큰 불일치: `INVALID_TOKEN`
- admin 권한 부족: `FORBIDDEN`
- 헤더 누락/비정상 컨텍스트: `UNAUTHORIZED`

---

## 3. 구현 구조

## 3.1 AuthContext

```typescript
type SessionRole = 'editor' | 'admin';

interface AuthContext {
  readonly sessionId: string;
  readonly role: SessionRole;
}
```

## 3.2 Guard 처리 흐름

1. `@Public()` 여부 확인 (있으면 즉시 통과)
2. 헤더 읽기(`x-session-id`, `x-session-token`)
3. 공백/빈 문자열 정규화 후 비어있으면 `UNAUTHORIZED`
4. `SessionTokenService.validateToken` 호출
5. request.auth 주입
6. `@RequireAdmin()`인데 role이 editor면 `FORBIDDEN`

## 3.3 Service 처리 흐름

1. `ISessionTokenReader.findBySessionId`
2. 결과 없음: `SESSION_NOT_FOUND`
3. `adminToken`/`editorToken` 비교로 role 결정
4. 불일치: `INVALID_TOKEN`

## 3.4 Session Infrastructure 구현

- `mikro-session-token.reader.ts`에서 `session` 최소 필드만 조회:
  - `id`
  - `editorToken`
  - `adminToken`
- Aggregate 재구성 없이 즉시 `SessionTokenRecord` 반환

---

## 4. 폴더/파일

신규:
- `apps/api/src/auth/constants/error-codes.ts`
- `apps/api/src/auth/constants/tokens.ts`
- `apps/api/src/auth/services/session-token-reader.interface.ts`
- `apps/api/src/domains/session/infrastructure/persistence/mikro-session-token.reader.ts`

주요 수정:
- `apps/api/src/auth/services/session-token.service.ts`
- `apps/api/src/auth/guards/session-token.guard.ts`
- `apps/api/src/domains/session/infrastructure/session.infrastructure.module.ts`

---

## 5. 테스트 전략

## 5.1 Unit

대상:
- `SessionTokenService`
- `SessionTokenGuard`

시나리오:
- 세션 없음 → `SESSION_NOT_FOUND`
- 토큰 불일치 → `INVALID_TOKEN`
- editor/admin role 판별
- `@Public` 우회
- `@RequireAdmin` + editor → `FORBIDDEN`
- 빈/공백 헤더 → `UNAUTHORIZED`

## 5.2 E2E (GraphQL)

대상:
- `test/auth.e2e-spec.ts`

시나리오:
- 보호 쿼리 무헤더 → `UNAUTHORIZED`
- 잘못된 토큰 → `INVALID_TOKEN`
- 없는 세션 → `SESSION_NOT_FOUND`
- `@Public` 쿼리 무토큰 200
- `@RequireAdmin` mutation: editor 403, admin 200

---

## 6. 검증 체크리스트

- [x] 토큰 없이 보호 쿼리 호출 시 `UNAUTHORIZED`
- [x] 유효 `editorToken`으로 role=`editor`
- [x] 유효 `adminToken`으로 role=`admin`
- [x] 잘못된 토큰 시 `INVALID_TOKEN`
- [x] 없는 세션 시 `SESSION_NOT_FOUND`
- [x] `@Public`은 무토큰 접근 허용
- [x] `@RequireAdmin`은 editor 차단 / admin 허용
- [x] Auth 서비스는 최소 필드 조회 포트 사용 (Aggregate 전체 조회 제거)
