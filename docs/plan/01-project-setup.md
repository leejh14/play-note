# Phase 1: 프로젝트 초기 설정

> NestJS + Next.js 모노레포를 스캐폴딩하고, 공유 모듈/라이브러리를 구축한다.

---

## 1. 모노레포 구조

```
play-note/
├── apps/
│   ├── api/                    # NestJS GraphQL API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/           # 토큰 기반 인증/인가
│   │   │   ├── config/         # 전역 설정 (env validation)
│   │   │   ├── shared/         # 공유 모듈
│   │   │   │   ├── domain/     # BaseEntity, AggregateRoot, ValueObject
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   ├── presentation/  # NodeResolver, Scalars, Interceptor
│   │   │   │   ├── exceptions/    # BaseException, 공유 예외
│   │   │   │   ├── constants/
│   │   │   │   └── utils/
│   │   │   └── domains/        # 도메인 모듈 (friend, session, match, attachment, statistics)
│   │   ├── libs/
│   │   │   └── relay/          # Relay pagination 라이브러리
│   │   ├── mikro-orm.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── components/
│       │   ├── graphql/        # Apollo Client + operations
│       │   ├── lib/            # 유틸리티
│       │   └── styles/
│       ├── next.config.js
│       ├── tsconfig.json
│       └── package.json
├── worker/                     # Graphile Worker (API 프로세스 내 실행 또는 별도)
├── scripts/
│   └── ocr/                    # Python OCR CLI
├── docker/
│   ├── nginx/
│   └── postgres/
│       └── init.sql            # 초기 Friend 데이터
├── docker-compose.yml
├── package.json                # root (yarn workspaces)
├── .env.example
└── docs/
```

### yarn workspaces 설정

```json
// root package.json
{
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "api": "yarn workspace @playnote/api",
    "web": "yarn workspace @playnote/web",
    "build": "yarn api build && yarn web build",
    "lint": "yarn api lint && yarn web lint"
  }
}
```

---

## 2. Backend (NestJS) 설정

### 2.1 핵심 패키지

```
# NestJS 코어
@nestjs/core @nestjs/common @nestjs/platform-express
@nestjs/graphql @nestjs/apollo
@apollo/server graphql

# ORM
@mikro-orm/core @mikro-orm/postgresql @mikro-orm/nestjs @mikro-orm/migrations @mikro-orm/cli

# 유효성 검증
class-validator class-transformer

# GraphQL Scalars
graphql-scalars

# 유틸리티
uuid (v7 지원) / uuidv7
winston @nestjs/winston       # 로깅

# 개발
typescript @types/node
eslint prettier
jest @nestjs/testing
```

### 2.2 MikroORM 설정 (`mikro-orm.config.ts`)

```typescript
const config: Options = {
  entities: ['./dist/**/*.orm-entity.js'],
  entitiesTs: ['./src/**/*.orm-entity.ts'],
  dbName: process.env.DB_NAME ?? 'playnote',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'playnote',
  password: process.env.DB_PASSWORD ?? 'playnote',
  type: 'postgresql',
  migrations: {
    path: './migrations',
    pathTs: './src/migrations',
  },
  // PlayNote는 멀티테넌시 없으므로 tenant filter 불필요
  // dataloader: DataloaderType.ALL,  // 같은 BC 내 관계 자동 배칭
};
```

### 2.3 GraphQL 설정

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  sortSchema: true,
  playground: process.env.NODE_ENV !== 'production',
  context: ({ req }) => ({ req }),
});
```

### 2.4 Path Alias (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@domains/*": ["src/domains/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"],
      "@auth/*": ["src/auth/*"],
      "@libs/relay": ["libs/relay/src"],
      "@app": ["src/app.module"]
    }
  }
}
```

---

## 3. 공유 모듈 (shared/) 구현

### 3.1 Domain 기반 클래스

| 클래스 | 위치 | 역할 |
|--------|------|------|
| `BaseEntity` | `shared/domain/base-entity.ts` | UUID v7 ID + createdAt/updatedAt |
| `AggregateRoot` | `shared/domain/aggregate-root.ts` | BaseEntity 확장, 도메인 이벤트 지원 (MVP에서는 이벤트 미사용) |
| `ValueObject<T>` | `shared/domain/value-object.ts` | 불변 값 객체 기반 클래스, equals() 제공 |

### 3.2 예외 클래스

| 클래스 | 위치 | HTTP 상태 |
|--------|------|-----------|
| `BaseException` | `shared/exceptions/base.exception.ts` | 500 |
| `ValidationException` | `shared/exceptions/validation.exception.ts` | 400 |
| `BusinessException` | `shared/exceptions/business.exception.ts` | 400 |
| `NotFoundException` | `shared/exceptions/not-found.exception.ts` | 404 |
| `ConflictException` | `shared/exceptions/conflict.exception.ts` | 409 |
| `UnauthorizedException` | `shared/exceptions/unauthorized.exception.ts` | 401 |
| `ForbiddenException` | `shared/exceptions/forbidden.exception.ts` | 403 |

### 3.3 GraphQL 공유 컴포넌트

| 컴포넌트 | 위치 | 역할 |
|----------|------|------|
| `NodeResolver` | `shared/presentation/graphql/relay/node.resolver.ts` | `node(id)` / `nodes(ids)` 쿼리 |
| GraphQL Scalars | `shared/presentation/graphql/scalars/` | DateTime, UUID 등 |
| `GraphQLExceptionFilter` | `shared/presentation/filters/graphql-exception.filter.ts` | BaseException → GraphQL 에러 변환 |
| `OrderDirection` enum | `shared/presentation/graphql/enums/order-direction.enum.gql.ts` | ASC / DESC |

---

## 4. libs/relay 라이브러리

educore-platform-be의 `libs/relay`를 포팅한다.

### 주요 Export

| 항목 | 용도 |
|------|------|
| `ConnectionArgsDto` | first/after/last/before 인자 |
| `ConnectionDto<T>` | edges + pageInfo 응답 구조 |
| `createEdgeType()` | GraphQL Edge 타입 생성 팩토리 |
| `createConnectionType()` | GraphQL Connection 타입 생성 팩토리 |
| `validateRelayArgs()` | Relay 인자 검증 (first+last 금지, max size 등) |
| `RelayMutationInput` | clientMutationId 포함 기반 Input |
| `RelayMutationPayload` | clientMutationId 포함 기반 Payload |
| `toGlobalId()` / `fromGlobalId()` | Global ID 인코딩/디코딩 |

---

## 5. Frontend (Next.js) 설정

### 5.1 핵심 패키지

```
next react react-dom
@apollo/client graphql
class-variance-authority  # 컴포넌트 variants
tailwindcss               # 스타일링
lucide-react              # 아이콘
```

### 5.2 Apollo Client 설정

```typescript
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const sessionId = getCurrentSessionId();
  const token = sessionId
    ? localStorage.getItem(`playnote:session:${sessionId}:token`)
    : null;

  return {
    headers: {
      ...headers,
      ...(sessionId && { 'x-session-id': sessionId }),
      ...(token && { 'x-session-token': token }),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

---

## 6. 환경 변수

### `.env.example`

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=playnote
DB_USER=playnote
DB_PASSWORD=playnote

# S3
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=playnote-attachments

# API
API_PORT=4000
PUBLIC_BASE_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_KAKAO_JS_KEY=

# Worker
GRAPHILE_WORKER_CONCURRENCY=2
```

---

## 7. 검증 체크리스트

- [ ] `yarn install` — 모든 워크스페이스 의존성 설치
- [ ] `yarn api build` — NestJS 빌드 성공
- [ ] `yarn web build` — Next.js 빌드 성공
- [ ] `yarn lint` — ESLint 통과
- [ ] PostgreSQL 연결 확인
- [ ] `http://localhost:4000/graphql` — GraphQL Playground 접근 가능
- [ ] `http://localhost:3000` — Next.js 기본 페이지 렌더링
