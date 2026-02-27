# 인증/인가 시스템 계획

> PlayNote는 로그인이 없는 토큰 기반 시스템이다.
> educore의 Better Auth + RBAC + Tenant 체계 대신, 세션별 토큰 2개(editor/admin)로 단순화한다.

---

## 1. educore 대비 변경점

| 항목 | educore | PlayNote |
|------|---------|----------|
| 인증 | Better Auth (세션 기반 로그인) | 토큰 기반 (세션별 editor/admin) |
| 인가 | RBAC + DB 퍼미션 | 단순 role: editor / admin |
| Guard | GqlAuthGuard → TenantGuard → PermissionGuard | `SessionTokenGuard` 단일 |
| 헤더 | `Authorization`, `X-Tenant-Id` | `x-session-id`, `x-session-token` |
| Context | AuthContext (userId, tenant, permissions) | AuthContext (sessionId, role) |
| 멀티테넌시 | Row-Level, MikroORM Filter | 없음 |
| 데코레이터 | `@AllowAnonymous()`, `@RequirePermission()` | `@Public()`, `@RequireAdmin()` |

---

## 2. AuthContext 설계

```typescript
// auth/types/auth-context.type.ts
type SessionRole = 'editor' | 'admin';

interface AuthContext {
  readonly sessionId: string;
  readonly role: SessionRole;
}
```

### 헤더 → AuthContext 변환 플로우

```
1. Request 수신
2. SessionTokenGuard 실행:
   a. @Public() 메타데이터 확인 → 있으면 Guard 스킵
   b. x-session-id 헤더 추출
   c. x-session-token 헤더 추출
   d. SessionRepository에서 session 조회 (findById)
   e. session.validateToken(token) → role 반환
   f. AuthContext 생성: { sessionId, role }
   g. request 객체에 AuthContext 주입
3. Resolver에서 @CurrentAuth()로 AuthContext 접근
```

---

## 3. Guard 구현

### SessionTokenGuard

```
auth/guards/session-token.guard.ts

역할:
├── x-session-id + x-session-token 헤더에서 토큰 추출
├── Session 조회 → 토큰 검증 → role 결정
├── @Public() 메타데이터가 있으면 Guard 스킵
├── 토큰 없거나 잘못되면 UnauthorizedException
│
글로벌 Guard로 등록 (APP_GUARD):
  app.module.ts에서 { provide: APP_GUARD, useClass: SessionTokenGuard }
```

### Admin 검증

```
@RequireAdmin() 데코레이터 사용 시:
  → Guard에서 role이 'admin'이 아니면 ForbiddenException

또는 UseCase 레벨에서 검사:
  if (auth.role !== 'admin') throw new ForbiddenException(...)
```

---

## 4. 데코레이터

### @CurrentAuth()

```typescript
// auth/decorators/current-auth.decorator.ts
export const CurrentAuth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthContext => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    return gqlCtx.getContext().req.auth;
  },
);
```

### @Public()

```typescript
// auth/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### @RequireAdmin()

```typescript
// auth/decorators/require-admin.decorator.ts
export const IS_ADMIN_KEY = 'requireAdmin';
export const RequireAdmin = () => SetMetadata(IS_ADMIN_KEY, true);
```

---

## 5. 세션 토큰 검증 최적화

### 문제: 매 요청마다 DB 조회

모든 GraphQL 요청에서 `x-session-id`로 Session을 조회해야 토큰 검증이 가능하다.

### 해결 방안 (MVP)

**A안: 매번 DB 조회 (선택)**
- Session 수가 적으므로 성능 이슈 없음
- Index: `session.editorToken` (UNIQUE), `session.adminToken` (UNIQUE)
- findByToken 대신 findById + 메모리 토큰 비교

**B안: 인메모리 캐시 (필요 시)**
- Map<sessionId, { editorToken, adminToken }> 캐시
- Session 생성/삭제 시 캐시 갱신
- MVP에서는 불필요

### Guard에서의 세션 조회 방법

```typescript
// Guard에서 Session을 조회하되, 최소 필드만 가져옴
// findById 대신 전용 메서드 사용
interface ISessionTokenService {
  validateToken(sessionId: string, token: string): Promise<SessionRole>;
}
```

```
auth/services/session-token.service.ts
├── validateToken(sessionId, token): Promise<SessionRole>
│   → Session 조회 (id, editorToken, adminToken만)
│   → token === editorToken → 'editor'
│   → token === adminToken → 'admin'
│   → 그 외 → throw UnauthorizedException
```

---

## 6. 권한 체크 포인트

### Resolver 레벨 (데코레이터)

```typescript
@Mutation(() => DeleteSessionPayload)
@RequireAdmin()
async deleteSession(@Args('input') input: DeleteSessionInput, @CurrentAuth() auth: AuthContext) {
  // Guard에서 admin 검증 완료
  return this.deleteSessionUseCase.execute({ sessionId: fromGlobalId(input.sessionId).id });
}
```

### UseCase 레벨 (비즈니스 규칙)

```typescript
// effectiveLocked 같은 비즈니스 규칙은 UseCase에서 검증
execute(input) {
  const session = await this.sessionRepository.findById(input.sessionId);
  const count = await this.attachmentContextAcl.countBySessionId(input.sessionId);
  session.checkStructureChangeAllowed(count); // → 잠김이면 예외
  // ...
}
```

---

## 7. 에러 코드

```typescript
// auth/constants/error-codes.ts
export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',               // 토큰 없음 / 잘못된 토큰
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',     // sessionId에 해당하는 세션 없음
  FORBIDDEN: 'FORBIDDEN',                     // admin 권한 필요
  INVALID_TOKEN: 'INVALID_TOKEN',             // 토큰 불일치
} as const;
```

---

## 8. 폴더 구조

```
src/auth/
├── guards/
│   └── session-token.guard.ts
├── decorators/
│   ├── current-auth.decorator.ts
│   ├── public.decorator.ts
│   └── require-admin.decorator.ts
├── services/
│   └── session-token.service.ts
├── types/
│   └── auth-context.type.ts
├── constants/
│   └── error-codes.ts
└── auth.module.ts
```

---

## 9. 검증 체크리스트

- [ ] 토큰 없이 일반 쿼리 → 401 Unauthorized
- [ ] 유효 editorToken → AuthContext.role = 'editor'
- [ ] 유효 adminToken → AuthContext.role = 'admin'
- [ ] 잘못된 토큰 → 401
- [ ] `@Public()` 쿼리 (sessionPreview) → 토큰 없이 200
- [ ] `@RequireAdmin()` 뮤테이션 + editorToken → 403 Forbidden
- [ ] `@RequireAdmin()` 뮤테이션 + adminToken → 성공
