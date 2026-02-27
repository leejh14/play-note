# 개발 가이드

## 1. 프로젝트 개요

DDD(도메인 주도 설계) 원칙 기반의 NestJS 백엔드 애플리케이션이다. GraphQL API를 코드 우선(Code-First) 방식으로 제공하며, Relay 스펙을 준수한다.

### 1.1 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | NestJS, TypeScript (엄격 모드), GraphQL (Code-First) |
| **데이터** | PostgreSQL, MikroORM (Identity Map + Unit of Work), Redis (캐싱) |
| **아키텍처** | DDD 4계층, CQRS, 저장소 패턴, 도메인 이벤트 (Kafka Outbox 패턴) |
| **인증/인가** | Better Auth 세션 인증, RBAC + DB 기반 동적 퍼미션 |
| **관측성** | OpenTelemetry (분산 추적), Winston (로깅) |
| **테스팅** | Jest, Supertest, Testcontainers |
| **개발 도구** | ESLint, Prettier, GitHub Actions (CI/CD) |
| **패키지 매니저** | yarn (npm/pnpm 사용 금지) |

---

## 2. 아키텍처

### 2.1 4계층 DDD 아키텍처

외부에서 내부로 4개의 계층을 가지며, 각 계층의 책임은 다음과 같다.

| 계층 | 책임 |
|------|------|
| **프레젠테이션** | 클라이언트 상호작용. GraphQL 리졸버, 요청/응답 매핑. 비즈니스 로직을 포함하지 않으며 애플리케이션 계층의 UseCase만 호출한다. |
| **애플리케이션** | UseCase 구현 및 조정. CQRS로 명령/쿼리 분리. 도메인 객체를 조합하여 비즈니스 흐름을 orchestration한다. 도메인 로직은 도메인 계층에, 기술 구현은 인프라 계층에 위임한다. |
| **인프라** | 기술적 구현 세부사항. 데이터베이스 영속성, 외부 API 호출, 메시징 시스템을 구현한다. 도메인 계층에서 정의한 인터페이스를 구현하며, 상위 계층으로부터 분리된다. |
| **도메인** | 비즈니스 핵심 로직. 엔티티, 값 객체, 도메인 이벤트, 저장소 인터페이스를 포함한다. 외부 계층에 의존하지 않으며 순수 비즈니스 규칙만 포함한다. |

각 도메인 모듈은 이 4계층 구조를 완전히 따르며 독립적으로 배포 가능하다.

### 2.2 의존성 규칙

의존성은 반드시 **외부 계층에서 내부 계층으로만** 흐른다. 내부 계층은 외부 계층의 존재를 절대 알지 못한다.

**계층 순서 (외부 → 내부):** 프레젠테이션 → 애플리케이션 → 도메인

인프라 계층은 특수한 위치를 가진다. 도메인 계층에서 정의한 인터페이스를 구현하며, 애플리케이션 계층에 의해 주입된다.

### 2.3 의존성 역전 원칙 (DIP)

고수준 모듈(도메인, 애플리케이션)은 저수준 모듈(인프라)에 의존하지 않는다. 둘 다 추상화(인터페이스)에 의존한다. 저장소 인터페이스는 도메인 계층에서 정의하고, 구현체는 인프라 계층에서 작성한다. 애플리케이션 계층은 인터페이스에만 의존하며, 런타임에 인프라 구현체가 주입된다.

### 2.4 도메인 계층 순수성

도메인 계층은 프레임워크, 데이터베이스, UI, 외부 서비스 등 기술적 세부사항으로부터 완전히 독립적이어야 한다.

| 규칙 | 설명 |
|------|------|
| **프레임워크 독립** | NestJS 데코레이터(`@Injectable` 등), GraphQL 데코레이터, ORM 데코레이터 등 어떤 프레임워크 종속 코드도 포함 금지 |
| **공유 커널 예외** | `@shared/domain`의 기반 클래스(`BaseEntity`, `ValueObject`, `AggregateRoot` 등) 상속은 예외적으로 허용 |
| **로깅 금지** | 도메인 계층에서 로깅하지 않는다. 예외 발생 시 순수 에러만 던지며, 로깅은 애플리케이션 서비스나 전역 인터셉터에서 담당 |
| **트랜잭션 금지** | `commit`, `rollback`, `@Transaction`, `IUnitOfWork` 등 트랜잭션 관련 코드가 절대 등장하지 않는다. 트랜잭션은 애플리케이션 계층의 책임 |

### 2.5 계층 간 데이터 전달

각 계층은 자신만의 데이터 구조를 가진다.

| 계층 | 데이터 구조 |
|------|-------------|
| 도메인 | 엔티티, 값 객체 |
| 애플리케이션 | DTO (Data Transfer Object) |
| 프레젠테이션 | GraphQL 타입 |

**수동 매핑 원칙:** 모든 계층 간 데이터 변환은 매퍼(Mapper)를 통해 명시적으로 수행한다. `AutoMapper` 등 자동화 도구나 스프레드 연산자(`...`)를 사용한 암시적 매핑은 금지한다.

**상속 금지:** GraphQL 타입이나 DTO가 도메인 엔티티를 상속받거나, `PickType`/`OmitType` 같은 유틸리티를 통해 파생하는 것을 금지한다. 각 계층의 데이터 구조는 독립적으로 모든 필드를 재정의한다.

---

## 3. 프로젝트 구조

### 3.1 전체 폴더 구조

```
educore-platform-be/
├── libs/                              # 독립적인 라이브러리 모듈 (src/ 외부)
│   └── relay/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/                          # 인증/인가 (Guard, 데코레이터, 퍼미션)
│   ├── config/                        # 전역 설정
│   ├── health/                        # K8s 헬스체크
│   ├── shared/                        # 공유 모듈 (DDD 4계층 구조)
│   │   ├── domain/                    # 기반 클래스 (BaseEntity, AggregateRoot, ValueObject 등)
│   │   ├── application/               # 공통 UseCase (파일 업로드 등)
│   │   ├── infrastructure/            # 공통 인프라 (테넌트 필터, 미들웨어, Object Storage 등)
│   │   ├── presentation/              # 공통 프레젠테이션 (Scalars, NodeResolver, Interceptor 등)
│   │   ├── constants/
│   │   ├── exceptions/
│   │   └── utils/
│   └── domains/                       # 도메인 모듈
│       └── {domain-name}/
│           ├── domain/
│           ├── application/
│           ├── infrastructure/
│           ├── presentation/
│           └── {domain-name}.module.ts
```

### 3.2 도메인 모듈 폴더 구조

```
{domain-name}/
├── domain/                         # 도메인 계층 (순수 비즈니스)
│   ├── aggregates/                 # 애그리거트 루트
│   ├── entities/                   # Aggregate 내부 엔티티
│   ├── enums/                      # 도메인 열거형
│   ├── value-objects/              # 값 객체
│   ├── domain-events/             # 도메인 이벤트
│   ├── repositories/               # 저장소 인터페이스
│   ├── services/                   # 외부 서비스 인터페이스
│   ├── exceptions/                 # 도메인 예외
│   ├── state-machines/             # 상태 머신 (@xstate/fsm)
│   └── constants.ts                # 도메인 상수 및 DI 토큰
├── application/                    # 애플리케이션 계층
│   ├── use-cases/
│   │   ├── commands/               # 상태 변경 UseCase
│   │   └── queries/                # 데이터 조회 UseCase
│   ├── dto/
│   │   ├── inputs/                 # 입력 DTO
│   │   └── outputs/                # 출력 DTO
│   ├── mappers/                    # Application Mapper
│   ├── acl/                        # ACL 인터페이스 (BC 간 통신용)
│   └── {domain}.application.module.ts
├── infrastructure/                 # 인프라 계층
│   ├── persistence/                # Repository 구현체, ORM Entity
│   ├── acl/                        # ACL 구현체
│   └── {domain}.infrastructure.module.ts
├── presentation/                   # 프레젠테이션 계층
│   ├── resolvers/
│   │   ├── queries/
│   │   ├── mutations/
│   │   └── field-resolvers/
│   ├── graphql/
│   │   ├── types/                  # ObjectType ({entity}.gql.ts)
│   │   ├── inputs/                 # InputType
│   │   └── enums/                  # GraphQL Enum
│   ├── dataloaders/
│   ├── mappers/                    # Presentation Mapper
│   └── {domain}.presentation.module.ts
└── {domain}.module.ts              # 루트 모듈 (3개 하위 모듈 통합)
```

**참고:** `application.module.ts`는 `application/` 폴더 내부에, `infrastructure.module.ts`와 `presentation.module.ts`는 각각 해당 폴더 내부에 위치한다. GraphQL ObjectType 파일은 `presentation/graphql/types/` 하위에 위치한다.

### 3.3 도메인 모듈 3계층 분리

하나의 도메인 모듈을 **3개의 계층별 NestJS 모듈**로 분리한다. 도메인 계층은 프레임워크 독립적이므로 NestJS 모듈로 만들지 않는다.

| 모듈 | 파일명 패턴 | 역할 | imports | exports |
|------|-------------|------|---------|---------|
| **InfrastructureModule** | `*.infrastructure.module.ts` | Repository/Service 구현체, ORM Entity 등록 | `MikroOrmModule`, `ConfigModule` | Repository/Service 구현체 (DI 토큰 제공) |
| **ApplicationModule** | `*.application.module.ts` | UseCase 등록 | `InfrastructureModule` | UseCase |
| **PresentationModule** | `*.presentation.module.ts` | Resolver, DataLoader 등록 | `ApplicationModule` | 없음 |

루트 모듈(예: `UserModule`)은 위 3개 모듈을 합치는 **컨테이너 역할**만 수행한다.

**런타임 의존성과 코드 의존성의 구별:**

- **모듈 imports**: `ApplicationModule`은 DI를 위해 `InfrastructureModule`을 import **해야 한다** (런타임 주입 목적).
- **PresentationModule → InfrastructureModule import 금지**: PresentationModule은 **ApplicationModule만** import한다. DataLoader 등에서 데이터가 필요한 경우 Repository 대신 **Query UseCase**를 통해 조회한다.
- **코드 import**: Application 계층의 소스 코드는 Infrastructure 계층 파일을 절대 import하지 않는다. 오직 도메인 계층의 인터페이스만 참조한다 (DIP).

### 3.4 파일명 및 접미사 규칙

모든 파일명과 폴더명은 **kebab-case**를 사용한다.

**도메인 계층 인터페이스 파일은 반드시 `.interface.ts` 접미사를 사용한다. 구현체 파일은 `.interface.ts`를 사용하지 않으며, 접두사(예: `mikro-`, `console-`)나 폴더 위치(`infrastructure/`)로 구분한다.**

| 유형 | 파일명 패턴 | 예시 |
|------|-------------|------|
| Repository 인터페이스 | `{entity}.repository.interface.ts` | `user.repository.interface.ts` |
| Service 인터페이스 | `{service-name}.service.interface.ts` | `email-sender.service.interface.ts` |
| ACL 인터페이스 | `{bc}-context.acl.interface.ts` | `membership-context.acl.interface.ts` |
| Repository 구현체 | `{prefix}-{entity}.repository.ts` | `mikro-user.repository.ts` |
| Service 구현체 | `{impl-name}.service.ts` | `console-email-sender.service.ts` |
| ACL 구현체 | `{bc}-context.acl.ts` | `membership-context.acl.ts` |
| 도메인 엔티티 | `{entity}.entity.ts` 또는 `{entity}.aggregate.ts` | `user.aggregate.ts` |
| ORM 엔티티 | `{entity}.orm-entity.ts` (클래스명: `{Entity}OrmEntity`) | `user.orm-entity.ts` |
| 열거형 | `{enum-name}.enum.ts` | `identity-status.enum.ts` |
| 테스트 | `*.spec.ts` | `user.entity.spec.ts` |
| DTO | `*.dto.ts` | `create-user.input.dto.ts` |
| GraphQL ObjectType | `{entity}.gql.ts` | `user.gql.ts` |
| GraphQL InputType | `{action}-{entity}.input.gql.ts` | `create-user.input.gql.ts` |
| GraphQL Enum | `{enum-name}.enum.gql.ts` | `user-role.enum.gql.ts` |

**금지 사항:**

- 인터페이스 파일에서 `.interface.ts` 접미사를 생략하는 것
- 인터페이스와 구현체를 같은 파일에 작성하는 것
- 구현체 파일에 `.interface.ts` 접미사를 사용하는 것

---

## 4. 도메인 계층 규칙

### 4.1 엔티티 설계 (Rich Domain Model)

- 엔티티는 데이터 컨테이너가 아니라 핵심 비즈니스 로직을 포함해야 한다.
- **프로퍼티 직접 수정 금지.** 상태 변경은 반드시 비즈니스 행위를 나타내는 메서드를 통해서만 수행한다 (예: `activate()`, `withdraw()`, `confirm()`).
- 모든 엔티티는 `@shared/domain`의 기반 클래스를 상속받아 ID와 타임스탬프를 처리한다.
- **ID 생성:** 엔티티 ID는 UUID v7을 사용한다. 시간 기반 정렬이 가능하여 인덱스 성능이 우수하다.

**생성 패턴: private constructor + static 팩토리 메서드**

엔티티 생성자는 `private` 또는 `protected`로 선언하고, 생성 목적에 따라 정적 팩토리 메서드를 사용한다.

| 메서드 | 용도 | 호출 시점 |
|--------|------|-----------|
| `static create(props)` | 새 엔티티 생성. 유효성 검증 및 도메인 이벤트 발행 포함 | UseCase에서 새 객체 생성 시 |
| `static reconstitute(props)` | DB에서 복원. 유효성 검증 생략, 이벤트 미발행 | Repository에서 ORM Entity → 도메인 엔티티 변환 시 |

`new` 키워드로 직접 생성하는 것을 금지한다. `create()`와 `reconstitute()`를 분리함으로써 "새 객체 생성"과 "기존 데이터 복원"의 의미를 명확히 구별한다.

**프로퍼티 캡슐화:**

모든 엔티티 프로퍼티는 `private` 필드 + `get` 접근자로 캡슐화한다. 외부에서 `entity.name = 'x'` 같은 직접 할당을 불가능하게 만든다.

| 규칙 | 설명 |
|------|------|
| private 필드 | `private _name: string` 형태로 선언. 언더스코어 접두사 사용 |
| getter 접근자 | `get name(): string { return this._name; }` 형태로 노출 |
| setter 금지 | `set` 접근자를 사용하지 않는다. 상태 변경은 비즈니스 메서드로만 수행 |
| 방어적 복사 | 배열, 객체 등 참조 타입은 getter에서 복사본을 반환하여 외부 변경을 차단 |

### 4.2 값 객체 (Value Object)

- `static create()` 또는 `static of()` 메서드에서 생성 시 유효성 검증을 수행한다.
- `static reconstitute()` 메서드는 DB 복원용으로, 유효성 검증을 생략한다.
- 모든 프로퍼티는 `readonly`이며, 값 변경 시 새로운 인스턴스를 반환한다 (불변성).
- 식별자가 아닌 값 자체로 동등성을 비교하는 `equals()` 메서드를 제공한다. 기반 클래스 `ValueObject`가 `toValue()`를 이용한 표준 `equals()`를 제공하므로, 특수한 경우(예: 특정 필드 제외 비교)가 아니면 **개별 VO에서 `equals()`를 오버라이드하지 않는다.**
- `value` 프로퍼티 또는 `toValue()` 메서드로 원시값 추출을 제공한다.

### 4.3 애그리거트 (Aggregate)

하나의 Bounded Context 안에 여러 Aggregate가 공존할 수 있다. 각 Aggregate는 Aggregate Root(루트 엔티티) 하나와 그에 종속된 내부 Entity, Value Object로 구성된다. 폴더 구조에서 `aggregates/`에 위치한 것이 Aggregate Root이고, `entities/`에 위치한 것이 내부 Entity이다.

**핵심 규칙:**

- 외부 객체는 Aggregate Root만 참조 가능하며, 내부 Entity에 직접 접근을 금지한다.
- 하나의 Aggregate는 하나의 트랜잭션 단위이다. 한 번에 하나의 Aggregate만 수정한다.
- 상태 변경이 발생하면 도메인 이벤트를 생성하고 커밋 시점에 발행한다.

**4.3.1 Aggregate 간 참조**

같은 BC 안에 있더라도 Aggregate끼리는 ID(`string`)로만 참조한다. 다른 Aggregate의 도메인 객체를 프로퍼티로 직접 보유하는 것을 금지한다. 이는 각 Aggregate가 독립적인 트랜잭션 경계이기 때문이다. Aggregate A를 저장할 때 Aggregate B가 함께 수정되는 일이 없어야 하고, 각각의 일관성은 자기 Aggregate Root가 책임진다.

**4.3.2 Repository와 Aggregate 관계**

Repository는 Aggregate Root당 정확히 1개만 존재한다. `entities/` 하위의 내부 Entity에 대한 별도 Repository 인터페이스를 생성하는 것을 **절대 금지**한다. 내부 Entity를 Aggregate Root를 우회하여 직접 조회·저장·삭제하면 Aggregate Root가 보장해야 할 불변식(invariant) 검증이 무력화된다.

**4.3.3 내부 Entity 접근 패턴**

내부 Entity의 조회·추가·수정·삭제는 반드시 Aggregate Root의 비즈니스 메서드를 통해서만 수행한다. UseCase에서 Aggregate Root를 Repository로 조회한 뒤, Aggregate Root의 메서드를 호출하여 내부 Entity를 변경하고, 다시 Aggregate Root 단위로 저장한다. Aggregate Root가 불변식을 검증하는 유일한 책임자이므로, 이 경로를 우회하는 어떤 패턴도 허용하지 않는다.

| 규칙 | 설명 |
|------|------|
| Aggregate Root당 Repository 1개 | 내부 Entity용 별도 Repository 생성 금지 |
| Aggregate 간 참조는 ID만 | 같은 BC 내라도 객체 직접 참조 금지 |
| 내부 Entity 변경은 Root 경유 | Root를 우회한 직접 persist/remove 금지 |
| Aggregate = 트랜잭션 경계 | 한 트랜잭션에서 하나의 Aggregate만 수정 |

### 4.4 저장소 인터페이스

저장소 인터페이스는 도메인 계층에 위치하며 다음 규칙을 준수한다.

**반환 타입 규칙:** 반드시 **도메인 엔티티** 또는 **원시 타입(Primitive)**만 반환한다. 애플리케이션 계층의 DTO를 import하거나 반환 타입으로 사용하는 것을 **금지**한다. 도메인 엔티티를 DTO로 변환하는 작업은 애플리케이션 계층의 UseCase에서 수행한다.

**표준 메서드명:**

| 메서드명 | 반환 타입 | 용도 |
|----------|-----------|------|
| `findById` | `Promise<Entity \| null>` | 단건 조회 (없으면 null) |
| `find{조건}` | `Promise<Entity \| null>` | 조건부 조회 (없으면 null) |
| `findAll` | `Promise<ConnectionDto<Entity>>` | 목록 조회 (Relay Pagination) |
| `save` | `Promise<void>` | 생성/수정 통합 |
| `delete` | `Promise<void>` | 삭제 |

- `find*` 메서드는 없으면 `null` 반환이 가능하다.
- `get*` 메서드는 존재를 보장하며 없으면 예외를 발생시킨다.
- `save`는 생성과 수정을 통합 처리한다.

### 4.5 도메인 예외

- 도메인 계층에서는 NestJS의 `HttpException` 등 프레임워크 예외를 사용하지 않는다. `BaseException`만 상속한다.
- 도메인별 예외는 `domain/exceptions/` 폴더에 위치한다.
- 에러 코드는 `{DOMAIN}_{ERROR_TYPE}` 형식의 `UPPER_SNAKE_CASE`를 사용한다 (예: `USER_NOT_FOUND`, `IDENTITY_INVALID_CREDENTIALS`).
- 인프라 계층에서 기술적 예외를 도메인 예외로 변환할 때 원본 에러(cause)를 보존한다.

---

## 5. 애플리케이션 계층 규칙

### 5.1 UseCase 설계 (CQRS)

| 구분 | Command UseCase | Query UseCase |
|------|----------------|---------------|
| **파일명** | `{action}-{entity}.use-case.ts` | `get-{entity}.use-case.ts` |
| **클래스명** | `{Action}{Entity}UseCase` | `Get{Entity}UseCase` |
| **메서드** | 단일 `execute()` 메서드만 허용 | 단일 `execute()` 메서드만 허용 |
| **시그니처** | `async execute(input: InputDto): Promise<OutputDto>` | `async execute(input: InputDto): Promise<OutputDto>` |
| **반환값** | 최소 정보(주로 ID)만 반환 | DTO 반환 |
| **부수효과** | 도메인 이벤트 발행 가능 | 상태 변경 및 이벤트 발행 금지 |
| **트랜잭션** | `@Transactional()` 필수 | 트랜잭션 없음 |
| **DB 연결** | Primary (자동) | Read Replica (향후 구성 시 자동 적용) |

**UseCase는 단일 `execute()` 메서드만 가진다.** `executeMany`, `executeById` 등 변형 메서드를 추가하는 것을 금지한다. 배치 조회 등이 필요하면 별도의 독립적인 UseCase를 생성한다. 파라미터는 단일 DTO 객체로 전달한다 (Props 패턴 적용).

### 5.2 DTO 규칙

- **위치:** 모든 입력/출력 DTO는 `application/dto/inputs/` 또는 `application/dto/outputs/`에 위치한다.
- **파일명:** `*.dto.ts` 확장자를 사용한다 (예: `create-user.input.dto.ts`, `user-response.output.dto.ts`).
- **인라인 정의 금지:** UseCase 파일 내부에서 인터페이스나 클래스로 DTO를 인라인 정의하는 것을 금지한다. 모든 DTO는 별도 파일로 분리한다.

### 5.3 애플리케이션 서비스 반환 타입

애플리케이션 서비스는 **반드시 DTO만 반환**한다. 도메인 엔티티를 직접 반환하면 계층 간 결합이 발생하므로 금지한다.

- **Command UseCase**: 최소한의 정보(주로 ID)만 반환한다 (CQS 원칙 강화).
- **Query UseCase**: 조회된 데이터를 DTO로 매핑하여 반환한다.

GraphQL Mutation에서 전체 엔티티가 필요한 경우, `@ResolveField()`를 통해 Query UseCase를 호출하여 해결한다 (Mutation Payload 패턴 참조).

### 5.4 Application Mapper

**위치:** `application/mappers/{entity}.mapper.ts`

| 메서드명 | 입력 | 출력 | 용도 |
|----------|------|------|------|
| `toDto` | 도메인 엔티티 | Output DTO | 도메인 엔티티 → 출력 DTO |
| `toDomain` | Input DTO | 도메인 엔티티 | 입력 DTO → 도메인 엔티티 (복잡한 변환 시) |

모든 메서드는 `static`으로 선언한다. `toPersistence`/`fromPersistence`는 Application Mapper에 포함하지 않으며, 이는 인프라 계층(Repository 구현체)의 책임이다.

### 5.5 트랜잭션 관리

트랜잭션은 애플리케이션 계층의 책임이다. 도메인 계층은 트랜잭션을 알지 못하며, 인프라 계층은 트랜잭션의 메커니즘을 구현한다.

**`@Transactional()` 데코레이터 (MikroORM v6.4+) 사용 규칙:**

| 조건 | 설명 |
|------|------|
| **적용 계층** | 애플리케이션 서비스(UseCase)의 메서드에만 적용. Repository, 컨트롤러, 도메인 계층에는 적용 금지 |
| **필수 속성** | 클래스 생성자에 `EntityManager`가 주입되어 있어야 한다. `@Transactional()`은 타입 기반으로 동작하므로 변수명에 의존하지 않으나, 프로젝트 컨벤션으로 변수명 `em`을 사용한다 |
| **전파 모드 필수** | 혼동 방지를 위해 항상 `propagation` 옵션을 명시적으로 설정한다 |
| **자동 플러시** | 성공 시 자동으로 `flush()` 및 `commit` 호출. 내부에서 수동 `em.flush()` 호출 금지 |

**전파 모드 선택 기준:**

| 전파 모드 | 동작 | 사용 시점 |
|-----------|------|-----------|
| `REQUIRED` | 기존 트랜잭션 참여, 없으면 새로 생성 | 일반 비즈니스 로직 (권장 기본값) |
| `NESTED` | 기존 트랜잭션 내 Savepoint로 독립 롤백 가능 | 부분 롤백이 필요한 복잡한 로직 |
| `REQUIRES_NEW` | 항상 새 독립 트랜잭션 생성 | 감사 로그, 알림 등 상위 실패와 무관한 저장 |

**금지 사항:**

- Query UseCase(조회 전용)에 `@Transactional()` 적용 금지
- `@Transactional()` 적용 메서드 내부에서 `em.flush()`, `em.commit()`, `em.rollback()` 수동 호출 금지
- `propagation` 옵션 없이 데코레이터 사용 금지

---

## 6. 인프라 계층 규칙

### 6.1 ORM Entity 및 영속성 매핑

도메인 엔티티와 ORM 엔티티를 엄격히 분리한다.

- **도메인 엔티티**(`*.entity.ts`)는 비즈니스 로직만 포함한다.
- **ORM 엔티티**(`*.orm-entity.ts`, 클래스명 `{Entity}OrmEntity`)는 데이터베이스 테이블 매핑만 담당하며 `infrastructure/persistence/`에 위치한다.
- 양방향 변환은 인프라 계층의 Repository 구현체 내부에서 수행한다. 애플리케이션/도메인 계층은 ORM 엔티티의 존재를 알지 못한다.

**Repository 내부 매핑 메서드:**

| 메서드명 | 용도 |
|----------|------|
| `toOrmEntity` | 도메인 엔티티 → ORM 엔티티 (저장 시) |
| `toDomainEntity` | ORM 엔티티 → 도메인 엔티티 (조회 시) |

별도 매퍼 파일로 분리할 경우 `infrastructure/persistence/{entity}.persistence.mapper.ts`에 위치시킨다. Application/Domain 계층에서 직접 호출을 금지한다.

### 6.2 Read Replica 라우팅 (향후 계획)

현재 `mikro-orm.config.ts`에 `replicas` 설정이 적용되어 있지 않으며, 모든 쿼리는 단일 Primary DB를 사용한다. 향후 Read Replica를 도입할 때 아래 규칙을 적용한다.

**설계 원칙 (코드를 미리 이 구조로 작성):**

- **Command UseCase**: `@Transactional()` 필수 → Replica 구성 시 자동으로 Primary를 사용한다.
- **Query UseCase**: `@Transactional()` 없음 → Replica 구성 시 자동으로 Replica를 사용한다.
- 명시적 연결이 필요한 경우 `{ connectionType: 'write' }` 또는 `{ connectionType: 'read' }`를 지정할 수 있다.

이 규칙에 따라 Command/Query UseCase를 분리해두면 Replica 도입 시 코드 변경 없이 설정만으로 읽기 분산이 가능하다.

---

## 7. 프레젠테이션 계층 규칙 (GraphQL)

### 7.1 Relay 스펙 준수

이 프로젝트의 GraphQL API는 **Relay Global Object Identification** 및 **Relay Input Object Mutations** 스펙을 완전히 준수한다.

**7.1.1 Node 인터페이스**

`Node`는 "이 타입은 Global ID로 독립 조회(refetch)할 수 있다"는 계약이다. `Node`를 구현한 타입은 반드시 `NodeResolver`에 등록하여 `node(id)` / `nodes(ids)` 쿼리로 조회 가능해야 한다.

**Node를 구현하는 것:** Aggregate Root 수준의 독립 엔티티 (User, Tenant, Course, EnrollmentRound 등). `@ObjectType` 데코레이터에 `implements: () => [Node]`를 선언하고, `NodeResolver`에 해당 타입의 조회 로직을 등록한다.

**Node를 구현하지 않는 것:** Aggregate 내부 하위 엔티티/값 객체 (Lesson, LiveClassDate, CourseInstructor, CourseCategory 등), PageInfo, Edge, Error 타입. 이들은 부모 Aggregate를 통해서만 접근하며, 독립 조회가 불가능하므로 `Node`를 구현하지 않는다. `NodeResolver`에 등록되지 않은 채 `Node`를 구현하면 거짓 계약이 되므로 금지한다.

**7.1.2 Global ID**

모든 엔티티의 ID는 `base64(TypeName:localId)` 형식의 Global ID를 사용한다. Mapper에서 `toGlobalId()`로 인코딩하고, Resolver에서 `fromGlobalId()` 또는 `assertGlobalIdType()`으로 디코딩한다.

**7.1.3 clientMutationId**

모든 Mutation Input은 `RelayMutationInput`을 상속하고, 모든 Mutation Payload는 `RelayMutationPayload`를 상속하여 `clientMutationId`를 지원한다.

**7.1.4 Connection 타입**

목록 조회는 Relay Connection 스펙을 따른다. 상세 내용은 "7.6 Relay Cursor Pagination" 참조.

**7.1.5 node / nodes Query**

`node(id: ID!)` 쿼리를 통해 Global ID로 모든 엔티티를 조회할 수 있어야 한다. `src/shared/presentation/graphql/relay/node.resolver.ts`에 중앙집중식 `NodeResolver`를 구현하며, Global ID의 타입을 파싱하여 적절한 도메인 Query UseCase로 라우팅한다. 도메인별 개별 node 쿼리(`identityNode`, `tenantNode` 등)를 생성하는 것을 금지한다.

`nodes(ids: [ID!]!)` 쿼리는 복수의 Global ID를 한 번에 조회하는 Relay 스펙 요구사항이다. 동일한 `NodeResolver`에서 처리하며, 내부적으로 배치 조회를 통해 N+1 문제를 방지한다.

### 7.2 GraphQL 타입 정의

- **명시적 이름 필수:** `@ObjectType('User')`, `@InputType('CreateUserInput')` 형식으로 데코레이터에 명시적 이름을 지정하여 스키마에 `Gql` 접미사가 노출되지 않도록 한다.
- **nullable 명시 필수:** 모든 `@Field()` 데코레이터에 `nullable` 옵션을 명시적으로 지정한다. 기본값에 의존하지 않으며, TypeScript 타입(`| null`, `?`)과 GraphQL `nullable` 옵션이 반드시 일치해야 한다.
- **외래 ID 필드 노출 금지:** 자기 자신의 `id` 외에 다른 엔티티의 ID를 `@Field(() => ID)`로 노출하지 않는다. 관계는 반드시 객체 참조 field resolver로만 표현한다. 내부적으로 field resolver가 사용하는 ID 값은 `@Field` 없이 TypeScript 프로퍼티로만 유지한다 (`/** @internal */` 주석 권장).
- **Nullability 설계 원칙:** nullable → non-null 전환은 하위 호환 변경이지만 반대는 breaking change이다. 확실하지 않으면 nullable로 시작한다. Connection 타입은 항상 non-null이다.

### 7.3 GraphQL Input 검증 (class-validator)

GraphQL InputType에는 `class-validator` 데코레이터로 서버 측 검증을 수행한다. GraphQL 스키마의 타입 검증만으로는 빈 문자열, 형식 불일치 등 세밀한 검증이 불가능하기 때문이다.

**배열 중첩 DTO 검증 규칙:**

배열 필드에 중첩 InputType이 포함된 경우, 반드시 다음 3개 데코레이터를 함께 적용한다.

| 데코레이터 | 역할 |
|------------|------|
| `@IsArray()` | 값이 배열 타입인지 검증 |
| `@ValidateNested({ each: true })` | 배열의 **각 요소**에 대해 중첩 클래스의 데코레이터 검증을 재귀 실행 |
| `@Type(() => NestedInputClass)` | `class-transformer`가 plain object를 클래스 인스턴스로 변환 (없으면 `@ValidateNested`가 동작하지 않음) |

**금지:** `@ValidateNested()`에서 `{ each: true }` 옵션을 생략하는 것. 생략 시 배열 요소 내부의 필드 검증이 실행되지 않아 잘못된 데이터가 통과된다.

### 7.4 GraphQL Scalars

`graphql-scalars` 라이브러리(`@shared/presentation/graphql/scalars/graphql-scalars`)를 사용하여 타입 안전한 스키마를 구성한다.

| Scalar | 용도 |
|--------|------|
| `DateTimeScalar` | 타임스탬프 (시간 포함) |
| `DateScalar` | 날짜만 (시간 없음) |
| `EmailAddressScalar` | 이메일 주소 |
| `URLScalar` | URL |
| `UUIDScalar` | UUID |
| `PhoneNumberScalar` | 국제 전화번호 |
| `CountryCodeScalar` | ISO 3166-1 alpha-2 |
| `PositiveIntScalar` | 양의 정수 |
| `NonNegativeIntScalar` | 0 이상 정수 |
| `JSONScalar` | JSON 객체 |

**규칙:**

- NestJS 기본 `Date` 타입 대신 반드시 `DateTimeScalar` 또는 `DateScalar`를 사용한다.
- 단순 `String` 대신 목적에 맞는 Scalar를 선택한다 (예: 이메일 → `EmailAddressScalar`).

### 7.5 Mutation Payload 패턴 (CQS + ResolveField)

Application 계층의 CQS 원칙과 GraphQL의 표현력을 양립시키기 위해 **Mutation Payload + `@ResolveField()` 패턴**을 사용한다.

**흐름:**

1. **Command UseCase**: ID만 반환 (CQS 엄수)
2. **Mutation Resolver**: UseCase 결과(ID)를 Payload에 담아 반환
3. **ResolveField**: Payload 내 엔티티 필드를 Query UseCase로 해결

Payload에 ID 필드를 명시적으로 포함시키고, `@ResolveField`에서 해당 ID로 Query UseCase를 호출하여 전체 엔티티를 조회한다. 이를 통해 Command는 쓰기만, Query는 읽기만 담당하면서도 클라이언트는 한 번의 요청으로 전체 엔티티 정보를 수신할 수 있다. Read Replica 환경에서 복제 지연이 문제될 경우 `connectionType: 'write'`를 명시적으로 지정할 수 있다.

### 7.6 Relay Cursor Pagination

GraphQL 목록 조회는 `libs/relay` 라이브러리의 Relay Connection 스펙을 준수한다.

**주요 Export:**

| 항목 | 용도 |
|------|------|
| `ConnectionArgsDto` | 페이지네이션 인자 DTO (first, after, last, before) |
| `ConnectionDto` | Connection 응답 구조 (edges, pageInfo) |
| `MikroOrmRelayAdapter` | MikroORM `findByCursor` 결과 → `ConnectionDto` 변환 |
| `createEdgeType()` / `createConnectionType()` | GraphQL Edge/Connection 타입 생성 팩토리 |
| `validateRelayArgs()` | Relay 인자 검증 유틸리티 |
| `RELAY_MAX_FIRST` | 최대 페이지 크기 상수 (기본값 100) |

**규칙:**

1. UseCase에서 `validateRelayArgs(args)`를 반드시 호출한다 (`first`/`last` 동시 사용 금지, `after`/`before` 동시 사용 금지, 최대 크기 검사).
2. Repository에서 `findByCursor()` 사용 시 **PK(id)를 마지막 정렬 기준으로 반드시 포함**하여 동률을 방지한다.
3. 도메인별 Edge/Connection 타입은 `createEdgeType()`/`createConnectionType()` 팩토리를 사용하여 생성한다.

**정렬 패턴:**

Connection 목록 조회에 정렬을 지원할 때는 `{Type}Order` InputType을 사용한다. `field` (정렬 대상 컬럼, 도메인별 `{Type}OrderField` 열거형)과 `direction` (ASC / DESC, 공유 `OrderDirection` 열거형)의 두 필드로 구성한다. 단일 Enum에 방향까지 포함하는 패턴(`TITLE_ASC`, `TITLE_DESC`)은 금지한다.

**소규모 고정 관계의 plain array 허용:**

Aggregate 내부의 하위 엔티티나 값 객체 목록처럼 항목 수가 자연적으로 제한되어 있고 독립 페이지네이션이 불필요한 관계는 Connection 대신 plain array `[Type!]!`를 사용해도 된다 (예: `Course.lessons`, `EnrollmentRound.enrollments`). 판단 기준은 "수백 건 이상 증가할 가능성이 있는가"이며, 가능성이 있으면 Connection을 사용한다.

**totalCount 정책:**

Connection 타입은 기본적으로 `edges`와 `pageInfo`만 포함하며 `totalCount`는 스키마에 노출하지 않는다. `COUNT(*)` 쿼리의 성능 비용 때문이며, 페이지네이션 UI에서 "전체 N개" 표시가 필요한 경우에만 명시적으로 추가한다.

### 7.7 Presentation Mapper

**위치:** `presentation/mappers/{entity}.gql.mapper.ts`

Application 계층의 Output DTO를 GraphQL 타입으로 변환한다. 리졸버에서 리터럴 객체를 직접 반환하는 것을 **금지**하며, 반드시 Presentation Mapper를 통해 명시적으로 변환한다.

| 메서드명 | 용도 |
|----------|------|
| `toGql` | Output DTO → GraphQL ObjectType |
| `toConnectionGql` | ConnectionDto → GraphQL Connection |
| `to{Entity}IdGql` | ID (string) → GraphQL ID 출력 타입 |

모든 메서드는 `static`으로 선언한다. 자동 매핑 도구 및 스프레드 연산자 사용을 금지한다.

### 7.8 그래프 탐색 중심 설계

GraphQL의 핵심 가치는 관계를 따라 그래프를 탐색하는 것이다. 클라이언트가 원하는 데이터에 도달하는 경로를 최대한 그래프 탐색(field resolver)으로 제공하고, 루트 Query는 최소화한다.

**루트 Query 허용 기준:** 검색/필터 기반 목록 조회 (예: `courses(filter: ...)`), `node(id)` / `nodes(ids)` 쿼리, 현재 인증 사용자 조회 (`me`). 그 외에 특정 엔티티의 단건 조회(`enrollmentRound(id)`)나 특정 부모의 하위 목록 조회(`enrollmentRounds(courseId)`)는 루트 Query 대신 `node(id)` 또는 부모 타입의 관계 필드(`Course.enrollmentRounds`)로 대체한다.

**관계 필드 추가 판단:** 두 엔티티 사이에 FK 관계가 존재하면 해당 방향의 field resolver를 기본적으로 추가한다. 역방향 탐색도 클라이언트 사용 패턴을 고려하여 양방향으로 제공한다 (예: `Course.enrollmentRounds` + `EnrollmentRound.course`). 크로스 BC 관계는 참조하는 쪽의 BC가 field resolver를 소유한다.

### 7.9 스키마 진화

스키마 변경은 하위 호환성을 기준으로 관리한다.

**안전한 변경 (non-breaking):** 새 타입/필드/열거값 추가, nullable → non-null 전환, 새 인자에 기본값 부여.

**위험한 변경 (breaking):** 기존 필드/타입/열거값 제거, non-null → nullable 전환, 필드 타입 변경, 필수 인자 추가.

**`@deprecated` 프로세스:** breaking change가 필요할 때 즉시 제거하지 않고, 먼저 `@deprecated(reason: "...")` 지시어를 추가하여 대체 경로를 안내한다. 프론트엔드가 마이그레이션을 완료한 것을 확인한 후에 deprecated 필드를 제거한다. `schema:check` 스크립트를 CI에서 실행하여 breaking change를 자동 감지한다.

### 7.10 Mutation 네이밍

Mutation 이름은 CRUD 동사가 아닌 비즈니스 의도를 반영한다. `{동사}{대상}` 형식이며, 동사는 도메인 유비쿼터스 언어에서 가져온다 (예: `applyEnrollment`, `approveEnrollment`, `processLottery`, `submitInstructorApplication`). `updateEnrollmentStatus`처럼 내부 구현(상태 변경)을 노출하는 네이밍은 금지한다. Input은 `{MutationName}Input`, Payload는 `{MutationName}Payload`로 명명한다.

---

## 8. 멀티테넌시

### 8.1 Row-Level 전략

**Row-Level 멀티테넌시**를 채택한다. 모든 테넌트 데이터는 `public` 스키마 내 동일 테이블에 저장하며, `tenantId` 컬럼으로 논리적 격리한다.

**테이블 분류:**

| 분류 | tenantId 필요 |
|------|---------------|
| 인증 (Better Auth: auth_users, auth_sessions, auth_accounts, auth_verifications) | X |
| User (users) | X |
| Tenant 메타 (tenants) | X |
| 멤버십 및 비즈니스 데이터 | O |

**필수 규칙:**

1. `users`, `tenants`를 제외한 모든 비즈니스 엔티티는 `tenantId` 컬럼 필수
2. 테넌트 격리가 필요한 ORM Entity에는 MikroORM `@Filter` 적용 필수
3. `tenantId` 컬럼에 인덱스 필수
4. 운영 환경에서 테넌트 필터 비활성화 금지 (관리자 기능 제외)
5. Cross-Tenant 데이터 조회 금지 (관리자 기능 제외)

### 8.2 MikroORM 글로벌 필터

테넌트 격리는 MikroORM의 글로벌 필터로 구현한다.

**핵심 원칙:**

| 규칙 | 설명 |
|------|------|
| `registerRequestContext: true` | 기본값 유지 필수. `@Transactional`, DataLoader, Identity Map이 의존 |
| 별도 `AsyncLocalStorage` 금지 | MikroORM이 내부적으로 이미 사용 |
| 미들웨어에서 `setFilterParams` | 기존 RequestContext의 EM에서 호출 |

**구현 패턴:**

1. **필터 정의** (`src/shared/infrastructure/filters/tenant.filter.ts`): `tenantId`가 없으면 매칭 불가능한 값(`__NO_TENANT__`)을 조건으로 사용하여 fail-closed 방식으로 데이터 노출을 방지한다. `default: true`로 설정하여 기본 활성화한다.
2. **미들웨어** (`src/shared/infrastructure/middleware/tenant-context.middleware.ts`): 요청에서 tenantId를 추출하고, `RequestContext.getEntityManager()`로 기존 EM을 가져와 `em.setFilterParams('tenant', { tenantId })`를 호출한다.
3. **ORM Entity 적용**: `tenantId` 컬럼이 있는 엔티티에 `@Filter(TENANT_FILTER)`를, tenant 관계가 있는 엔티티에 `@Filter(TENANT_RELATION_FILTER)`를 적용한다.

**안티 패턴 (금지):**

- `registerRequestContext: false` 설정
- 미들웨어에서 `RequestContext.create()` 직접 호출 (중첩 발생)
- `AsyncLocalStorage`로 tenantId 별도 관리
- 필터 cond에서 외부 상태 직접 참조

### 8.3 Bounded Context 테넌트 종속성 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| **테넌트 비종속적** | 여러 테넌트에 걸쳐 존재하거나, 테넌트 개념 자체를 정의 | Identity(User), Tenant |
| **테넌트 종속적** | 특정 테넌트 내에서만 의미를 가지며, 테넌트 경계를 넘지 않음 | Course, Enrollment, Content |
| **브릿지** | 테넌트 비종속적 엔티티와 테넌트를 연결 | Membership (User-Tenant 관계) |

**핵심 규칙: 테넌트 종속적 BC는 Application 계층과 Domain 계층에서 `tenantId`가 절대로 등장해서는 안 된다.**

이 규칙의 근거:

1. **인프라 책임 분리**: 테넌트 격리는 MikroORM 글로벌 필터가 인프라 계층에서 자동 처리한다.
2. **보안 강화**: Application 계층에서 `tenantId`를 파라미터로 받으면 테넌트 격리 우회 가능성이 생긴다.
3. **도메인 순수성**: 도메인 로직은 "현재 테넌트 컨텍스트" 내에서만 동작하며, 테넌트 개념을 알 필요가 없다.

**계층별 tenantId 처리:**

| 계층 | tenantId 처리 |
|------|---------------|
| 프레젠테이션 | `@CurrentAuth()` → AuthContext(userId, tenant, permissions). MikroORM 글로벌 필터 파라미터 설정. `@RequirePermission()` 데코레이터로 퍼미션 체크 |
| 애플리케이션 | tenantId 없음 (암묵적 컨텍스트). Input/Output DTO에 tenantId 포함 금지 |
| 도메인 | tenantId 없음. Aggregate, Entity, Value Object에 tenantId 포함 금지 |
| 인프라 | MikroORM 글로벌 필터가 tenantId 자동 적용. ORM Entity에만 tenantId 컬럼 존재 |

**예외:**

- 권한 시스템: `TenantGuard`가 `X-Tenant-Id` 헤더로 멤버십을 조회하고 `AuthContext`를 구성한다.
- Cross-BC 통신: ACL을 통해 다른 BC와 통신 시, 브릿지 BC(Membership)에서 `tenantId`를 사용할 수 있다.

**체크리스트:**

- 새 BC 설계 시 테넌트 종속성 먼저 분류
- 테넌트 종속적 BC의 Domain Entity에 `tenantId` 필드 없음
- 테넌트 종속적 BC의 Application DTO에 `tenantId` 필드 없음
- 테넌트 종속적 BC의 UseCase 파라미터에 `tenantId` 없음
- 테넌트 격리는 Infrastructure 계층(MikroORM 필터)에서만 처리
- 퍼미션 체크는 `@RequirePermission()` 데코레이터 + PermissionGuard에서 처리

---

## 9. 권한 시스템

### 9.1 Guard 레이어 구조

GraphQL 요청은 다음 순서로 3개의 Guard를 통과한다.

```
[GraphQL Request]
    → GqlAuthGuard (Better Auth 세션 검증. @AllowAnonymous()로 스킵, @OptionalAuth()로 선택적 인증)
    → TenantGuard (X-Tenant-Id 헤더 → 멤버십 조회 → AuthContext 구성)
    → PermissionGuard (@RequirePermission() 메타데이터 기반 퍼미션 체크)
    → [Resolver]
```

### 9.2 역할(Role) 체계

| 역할 코드 | 명칭 | 설명 |
|-----------|------|------|
| `SUPER_ADMIN` | 최고 관리자 | 모든 퍼미션 자동 부여 (`*`) |
| `TENANT_ADMIN` | 테넌트 관리자 | 테넌트 내 운영 전권 |
| `INSTRUCTOR` | 강사 | 강좌 개설/운영 |
| `ASSISTANT` | 보조강사 | 강좌 운영 보조 |
| `STUDENT` | 학생 | 수강/학습 참여 |
| `PARENT` | 학부모 | 자녀 학습 현황 조회 |
| `MEMBER` | 일반회원 | 포털 조회 |

### 9.3 퍼미션

**네이밍 컨벤션:** 반드시 `{domain}:{resource}:{action}` 3 segment 고정 형식을 사용한다. 도메인과 리소스가 동일한 경우에도 중복을 허용하여 일관성을 유지한다.

**규칙:**

- segment 수는 항상 3개로 고정한다. 2 segment, 4 segment 모두 금지.
- 소유 범위(scope)가 필요한 경우 action에 하이픈으로 합성한다 (예: `update-own`). 별도 segment로 분리하지 않는다.
- 와일드카드 매칭 시 `{domain}:*:*`, `*:{resource}:*` 형태로 사용할 수 있다.

**예시:**

| 퍼미션 | 설명 |
|--------|------|
| `tenant:tenant:create` | 테넌트 생성 |
| `iam:user:read` | 사용자 조회 |
| `iam:role:manage` | 역할 관리 |
| `course:course:create` | 강좌 생성 |
| `course:course:update` | 강좌 수정 (전체) |
| `course:course:update-own` | 강좌 수정 (본인 것만) |
| `course:lesson:create` | 레슨 생성 |
| `enrollment:enrollment:enroll` | 수강 등록 |
| `portal:notice:manage` | 공지사항 관리 |

**해석(Resolution) 로직:**

```
유효 퍼미션 = 역할 기본 퍼미션 (ROLE_PERMISSION_MAP)
            + MembershipPermission ALLOW 엔트리
            - MembershipPermission DENY 엔트리
```

- `SUPER_ADMIN`은 와일드카드(`*`)로 모든 권한을 자동 보유한다.
- `MembershipPermission` 테이블을 통해 특정 멤버십에 퍼미션을 추가(ALLOW)하거나 제거(DENY)할 수 있다.

### 9.4 AuthContext

```typescript
interface TenantContext {
  readonly tenantId: string;
  readonly membershipId: string;
  readonly role: MembershipRole;
  readonly regionCode?: string;
}

interface AuthContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly tenant: TenantContext | null;
  readonly permissions: ReadonlySet<string>;
}
```

테넌트 컨텍스트가 존재하는지 좁히려면 `requireTenantAuth(auth)` 타입 가드 함수를 사용한다. Non-null assertion(`!`) 대신 이 함수를 통해 `tenant`가 non-null인 `TenantAuthContext` 타입으로 좁힌다.

### 9.5 관련 파일

| 파일 | 역할 |
|------|------|
| `src/auth/permissions/permission.catalog.ts` | 퍼미션 카탈로그 (상수 정의) |
| `src/auth/permissions/role-permission.map.ts` | 역할별 기본 퍼미션 매핑 |
| `src/auth/services/permission-resolver.service.ts` | 유효 퍼미션 계산 서비스 |
| `src/auth/guards/tenant.guard.ts` | 테넌트 멤버십 조회 + AuthContext 구성 |
| `src/auth/guards/permission.guard.ts` | 퍼미션 체크 Guard |
| `src/auth/decorators/require-permission.decorator.ts` | `@RequirePermission()` 데코레이터 |
| `src/auth/decorators/current-auth.decorator.ts` | `@CurrentAuth()` 데코레이터 |
| `src/auth/decorators/public.decorator.ts` | `@AllowAnonymous()` 데코레이터 (인증 스킵) |
| `src/auth/decorators/optional-auth.decorator.ts` | `@OptionalAuth()` 데코레이터 (선택적 인증) |
| `src/auth/types/auth-context.type.ts` | `AuthContext`, `TenantContext`, `TenantAuthContext` 타입 정의 |

---

## 10. Bounded Context 간 통신

### 10.1 기본 원칙

도메인 간의 직접적인 엔티티 참조 및 상태 변경 호출은 절대 금지한다.

- **비동기 통신 (권장)**: 도메인 이벤트를 발생시키고, 타 도메인에서 구독하여 처리한다.
- **동기 조회 (필요 시)**: 타 도메인의 Query UseCase를 ACL 인터페이스로 추상화하여 호출한다. 타 도메인에 대한 상태 변경 명령(Command)은 허용되지 않는다.

### 10.2 직접 Import 금지

**BC 간 직접 코드 import를 금지**한다. `src/domains/{bcA}/**`에서 `src/domains/{bcB}/**`를 직접 import하는 것은 ESLint `import/no-restricted-paths`로 강제 차단된다. 모든 계층(domain, application, infrastructure, presentation)에 적용된다.

새 BC 추가 시 `eslint.config.js`의 `import/no-restricted-paths` zones 배열에 해당 BC 규칙을 추가해야 한다.

### 10.3 Context Mapping 패턴 (ACL)

모듈러 모놀리스에서 MSA로의 확장을 염두에 두고, BC 간 통신은 **네트워크 경계가 존재하는 것처럼 설계**한다.

**DDD Context Mapping 패턴:**

| 패턴 | 역할 | 적용 |
|------|------|------|
| **Open Host Service (OHS)** | 외부 BC에 공개하는 조회 서비스 | 각 BC의 Query UseCase |
| **Anti-Corruption Layer (ACL)** | 외부 BC 호출 및 응답 번역 | 호출하는 BC의 Application 계층 |
| **Published Language** | BC 간 공유 스키마 | DTO (도메인 엔티티 아님) |

**핵심 설계 원칙:**

1. **트랜잭션 경계 분리**: BC 간 호출은 같은 트랜잭션으로 묶이지 않는다. 강한 일관성 대신 최종 일관성을 기본으로 하며, 필요시 Saga 패턴 또는 보상 트랜잭션을 적용한다.
2. **ID 기반 참조**: Domain/Application 계층에서 다른 BC 엔티티는 ID(`string`)로만 참조한다. 도메인 객체 직접 참조를 금지한다.
3. **ORM 관계 매핑 금지**: Infrastructure 계층에서 다른 BC의 ORM Entity와 `@ManyToOne`, `@OneToMany` 등 관계 정의를 금지한다. `userId: string` 형태의 ID 컬럼만 사용한다.

**계층별 BC 간 통신 책임:**

| 계층 | 책임 |
|------|------|
| **Domain** | 다른 BC 존재를 모름. ID만 보유 |
| **Application** | ACL 인터페이스를 통해 타 BC 호출. CUD 시 보상 로직 포함 |
| **Infrastructure** | ACL 구현체 작성. MSA 전환 시 HTTP 클라이언트로 교체 |
| **Presentation** | 데이터 소유 BC가 `@ResolveField` 직접 구현. DataLoader로 N+1 방지 |

**MSA 전환 시 영향:**

| 항목 | 변경 여부 |
|------|----------|
| Domain 계층 | 변경 없음 |
| Application 계층 (UseCase, ACL 인터페이스) | 변경 없음 |
| Infrastructure 계층 (ACL 구현체) | HTTP 클라이언트 버전으로 교체 |
| Presentation 계층 (Resolver) | 변경 없음 |

### 10.4 ACL 구현 절차

ACL 구현체(`infrastructure/acl/`)는 타 BC의 UseCase를 호출하지만, **구현체 파일 내에서 타 BC의 코드를 직접 import하는 것을 금지**한다. 인터페이스 + Symbol 기반 DI 토큰으로 주입받는다.

**절차:**

1. **ACL 인터페이스 정의** (`application/acl/`): 타 BC 호출용 인터페이스와 타 BC UseCase를 추상화한 인터페이스 및 Symbol DI 토큰을 정의한다.
2. **ACL 구현체 작성** (`infrastructure/acl/`): 타 BC 직접 import 없이, 1에서 정의한 인터페이스와 DI 토큰만 import하여 구현한다.
3. **InfrastructureModule에서 바인딩**: 모듈 파일에서만 예외적으로 타 BC UseCase를 import하고, `useExisting`으로 DI 토큰에 바인딩한다.

**Application 계층에서 타 BC 조회 시** ACL 인터페이스에만 의존하며 구현체를 직접 import하지 않는다. **타 BC CUD 호출 시** 실패에 대비한 보상 로직(보상 트랜잭션)을 반드시 구현한다.

### 10.5 @ResolveField BC 간 데이터 조회

GraphQL ObjectType의 관계 필드가 다른 BC의 데이터를 필요로 할 때, **데이터를 소유한 BC가 해당 `@ResolveField`를 구현**한다.

| 원칙 | 설명 |
|------|------|
| **소유권 기반** | User 데이터는 Identity BC가, Tenant 데이터는 Tenant BC가 책임 |
| **Published Language** | 타 BC의 ObjectType(`*.output.gql.ts`)과 Output DTO(`*.output.dto.ts`) import 허용 |
| **N+1 방지** | Request-scoped DataLoader로 배치 조회 필수 |

**파일 위치:**

- DataLoader: `{소유-bc}/presentation/dataloaders/{entity}.dataloader.ts`
- FieldResolver: `{소유-bc}/presentation/resolvers/field-resolvers/{parent-type}-{field}.field-resolver.ts`

DataLoader는 Repository를 직접 주입하지 않고 **Query UseCase**(배치 조회용)를 통해 데이터를 조회한다. DataLoader를 포함한 PresentationModule은 **ApplicationModule만 import**한다.

### 10.6 N+1 문제 방지

**두 가지 DataLoader 전략**을 상황에 따라 사용한다.

**같은 BC 내 ORM 관계: MikroORM 내장 DataLoader**

- `mikro-orm.config.ts`에서 `dataloader: DataloaderType.ALL`을 설정하여 전역 자동 배칭을 활성화한다.
- `@ResolveField()`에서 `entity.relation.load()`를 호출하면 자동으로 배칭 처리된다.
- 같은 BC 내 ORM 관계에 수동 DataLoader를 구현하는 것을 **금지**한다.

**다른 BC 간 조회: 수동 DataLoader**

- ORM 관계가 없으므로 MikroORM 내장 DataLoader가 적용되지 않는다.
- 데이터를 소유한 BC의 Presentation 계층에서 수동 DataLoader + `@ResolveField`를 구현한다.
- DataLoader는 `@Injectable({ scope: Scope.REQUEST })`로 선언하고, Query UseCase를 통해 데이터를 조회한다.
- ACL 인터페이스에 `getByIds(ids: string[])` 형태의 배치 메서드를 정의한다.

### 10.7 금지 사항 요약

- 타 BC UseCase 직접 import 금지 (ACL 인터페이스를 통해 호출)
- ACL 구현체에서 타 BC 코드 직접 import 금지 (인터페이스 + Symbol DI 토큰 사용)
- ACL에서 다른 BC의 도메인 엔티티 직접 반환 금지 (DTO만 반환)
- BC 간 호출을 같은 트랜잭션으로 묶는 것 금지
- 다른 BC Entity와 ORM 관계 매핑 금지
- 타 BC CUD 호출 시 보상 로직 없이 호출 금지

### 10.8 Integration Service 패턴 (외부 플랫폼 연동)

**BC-to-BC ACL**과 **외부 플랫폼 연동**은 본질적으로 다른 관심사다. BC-to-BC ACL은 내부 도메인 간 경계를 보호하지만, 외부 플랫폼 연동은 **여러 BC의 데이터를 조합하여 외부 시스템 API를 호출**하는 크로스-커팅 인프라스트럭처 관심사이다.

**Integration Service**는 이러한 외부 연동 로직을 특정 BC에 종속시키지 않고 `@shared/infrastructure/platform/` 아래에 응집도 있게 배치하는 패턴이다.

**적용 기준:**

| 구분 | BC-to-BC ACL (10.3~10.4) | Integration Service (10.8) |
|------|--------------------------|---------------------------|
| **위치** | 호출하는 BC의 `application/acl/`, `infrastructure/acl/` | `@shared/infrastructure/platform/sync/` |
| **목적** | 내부 BC 간 경계 보호 | 외부 시스템 연동 (밀당 플랫폼 등) |
| **데이터 조합** | 1:1 (호출 BC → 대상 BC) | N:1 (여러 BC → 외부 시스템) |
| **ORM Entity 접근** | 금지 (UseCase/Repository 통해서만) | 허용 (읽기 전용, `em.fork()` 사용) |
| **DI 토큰** | BC `domain/constants.ts`에 정의 | 불필요 (같은 모듈 내 직접 주입) |

**구현 규칙:**

1. **위치**: `@shared/infrastructure/platform/sync/` 디렉토리에 서비스 클래스를 생성한다.
2. **명명**: `Platform{기능}SyncService` (예: `PlatformUserSyncService`, `PlatformCourseSyncService`)
3. **ORM Entity 접근**: 여러 BC의 ORM Entity를 **읽기 전용**으로 조회할 수 있다. 반드시 `em.fork()`로 격리된 EntityManager를 사용한다.
4. **쓰기 제한**: 동기화 결과(예: `platformGroupId`)를 저장하기 위한 해당 Entity 필드 업데이트만 허용하며, 도메인 비즈니스 로직에 해당하는 상태 변경은 금지한다.
5. **모듈 등록**: `PlatformModule`에 provider로 등록하며, BC Module에 등록하지 않는다.
6. **Props 타입**: 동기화 입력 데이터 타입은 `@shared/infrastructure/platform/sync/platform-sync.types.ts`에 정의한다.
7. **Outbox 연계**: Outbox Processor가 직접 주입하여 호출한다. `ModuleRef.get()` 지연 해결이 불필요하다.

**파일 구조:**

```
src/shared/infrastructure/platform/
├── sync/
│   ├── platform-sync.types.ts              # 동기화 Props 타입 정의
│   ├── platform-user-sync.service.ts       # 사용자 생성 + 조직 초대
│   ├── platform-role-sync.service.ts       # 역할 변경 동기화
│   └── platform-course-sync.service.ts     # 강좌(Group) 생성 + 커리큘럼
├── outbox/
│   ├── platform-outbox-event.handlers.ts   # 도메인 이벤트 → Outbox INSERT
│   └── platform-outbox.processor.ts        # Outbox 폴링 → Sync Service 호출
├── reconciliation/
│   └── platform-reconciliation.service.ts  # 동기화 불일치 점검
├── token/
│   └── platform-token.service.ts           # 밀당 인증 토큰 관리
├── platform-api.client.ts                  # GraphQL API 클라이언트 + Resilience
├── platform.constants.ts                   # DI 토큰, 설정 상수
├── platform.exceptions.ts                  # 플랫폼 전용 예외
└── platform.module.ts                      # @Global() 모듈
```

**DomainEventDispatcher 위치:**

`DomainEventDispatcher`는 Application 계층에서 사용하는 인프라-중립적 이벤트 버스이므로 `@shared/application/domain-event-dispatcher.ts`에 위치한다. UseCase에서 직접 주입하여 도메인 이벤트를 디스패치하며, `PlatformModule`에서 provider로 등록하고 export한다.

---

## 11. 에러 처리

### 11.1 에러 처리 전략

**Exception 기반 에러 처리**를 채택한다. Result/Either 모나드 패턴은 사용하지 않는다.

**선택 근거:**

1. NestJS/GraphQL 생태계의 Exception Filter를 통한 일관된 응답 처리
2. 반환 타입이 `User`로 명확 (vs `Result<User, Error>`)
3. 함수형 패턴 러닝 커브 없이 빠른 개발 가능

### 11.2 공유 예외 계층 구조

`shared/exceptions/`에 정의하며 모든 커스텀 예외는 `BaseException`을 상속한다.

| 예외 클래스 | 용도 | HTTP 상태 | 에러 코드 |
|-------------|------|-----------|-----------|
| `BaseException` | 모든 예외의 기반 | 500 | - |
| `ValidationException` | 입력값 유효성 검증 실패 | 400 | `VALIDATION_ERROR` |
| `BusinessException` | 일반 비즈니스 규칙 위반 | 400 | `BUSINESS_ERROR` |
| `NotFoundException` | 리소스 없음 | 404 | `RESOURCE_NOT_FOUND` |
| `ConflictException` | 중복/충돌 | 409 | `CONFLICT_ERROR` |
| `UnauthorizedException` | 인증 실패 | 401 | `UNAUTHORIZED` |
| `ForbiddenException` | 권한 부족 | 403 | `FORBIDDEN` |

도메인 고유의 비즈니스 규칙 위반은 `domains/{domain}/domain/exceptions/`에 도메인별 예외로 정의한다.

### 11.3 계층별 예외 처리 규칙

| 계층 | 예외 발생 | 예외 처리 |
|------|-----------|-----------|
| **도메인** | 도메인 예외 throw (프레임워크 독립, `BaseException` 상속만 허용) | 처리하지 않음 (상위로 전파) |
| **애플리케이션** | 도메인 예외를 그대로 전파 또는 래핑 | 필요 시 예외 변환 |
| **인프라** | 기술적 예외 발생 (DB, 외부 API 등) | 도메인 예외로 변환하여 throw. 원본 cause 보존 |
| **프레젠테이션** | 예외 발생하지 않음 | Exception Filter에서 응답 변환 |

### 11.4 GraphQL 에러 응답

GraphQL Yoga의 `maskedErrors` 설정을 활용하여 에러를 자동 변환하고, 보안 민감 에러는 일반화된 코드로 매핑한다.

**에러 코드 정의 위치:**

| 위치 | 용도 |
|------|------|
| `src/domains/{도메인}/domain/constants/error-codes.ts` | 도메인별 에러 코드 상수 (`as const`) |
| `src/shared/constants/error-codes.ts` | 공통 에러 코드 상수 |
| `src/shared/presentation/graphql/enums/error-code.enum.gql.ts` | GraphQL 스키마 `ErrorCode` Enum |
| `src/shared/presentation/graphql/enums/error-code.mapper.ts` | 내부 코드 → 공개 코드 매핑 함수 |

**새 에러 추가 절차:**

1. 해당 도메인의 `error-codes.ts`에 새 코드 추가
2. `error-code.enum.gql.ts`의 `ErrorCode` Enum에 동일 값 추가
3. 보안 민감 에러는 `error-code.mapper.ts`의 `authSensitiveCodes`에 추가
4. 테스트 실행하여 동기화 확인

**보안 민감 에러 분류:**

다음 유형은 클라이언트에 상세 코드를 노출하지 않고 `AUTHENTICATION_FAILED` 또는 `FORBIDDEN`으로 통합한다.

- 계정 존재 여부를 유추할 수 있는 에러
- 인증 실패 상세 사유 (비밀번호 불일치, 토큰 무효)
- 권한 거부 상세 사유 (소유자 불일치, 역할 미달)

**에러 응답:** 클라이언트는 `errors[].extensions.code`에서 에러 코드를, `errors[].extensions.statusCode`에서 HTTP 상태 코드와 동일한 의미를 가진 값을 참조한다.

**로깅:** 모든 예외는 서버 로그에 내부 코드, 메시지, 스택 트레이스가 기록된다. Production에서 클라이언트 응답에 스택 트레이스가 포함되지 않는다. `BaseException`이 아닌 예외는 `INTERNAL_SERVER_ERROR`로 마스킹된다.

### 11.5 에러 처리 금지 사항

- Result/Either 모나드 패턴 사용
- 빈 catch 블록 (`catch {}`)
- 도메인 계층에서 NestJS/GraphQL 예외 사용
- 에러 코드 없이 예외 생성
- 매직 스트링으로 에러 메시지 작성 (상수화 필요)

---

## 12. 코딩 표준

### 12.1 명명 규칙

**파일/폴더:** 모든 파일명과 폴더명은 kebab-case (예: `user.entity.ts`, `create-user.use-case.ts`, `domain-events/`)

**변수:**

| 유형 | 규칙 | 올바른 예 | 잘못된 예 |
|------|------|-----------|-----------|
| 불리언 | `is`, `has`, `can`, `should` 접두사 | `isActive`, `hasPermission` | `active`, `permission` |
| 배열/컬렉션 | 복수형 명사 | `users`, `orderItems` | `userList`, `orderItemArray` |
| 맵/딕셔너리 | 키-값 관계 명시 | `userById`, `ordersByStatus` | `userMap`, `orderDict` |
| 카운터 | `count`, `total` 접두사 | `userCount`, `totalOrders` | `cnt`, `num` |
| 날짜/시간 | `At`, `Date`, `Time` 접미사 | `createdAt`, `expirationDate` | `created`, `expiration` |
| ID 참조 | 엔티티명+Id | `userId`, `orderId` | `user`, `order` (ID인데 객체명) |
| DI 토큰 | `ENTITY_REPOSITORY` 패턴, Symbol 사용 | `USER_REPOSITORY = Symbol('IUserRepository')` | `'IUserRepository'` (문자열 금지) |
| 임시 변수 | 맥락 명시 | `filteredUsers` | `temp`, `data`, `item` |

**함수/메서드:**

| 동작 | 접두사 | 의미 | 예시 |
|------|--------|------|------|
| 조회(필수) | `get` | 존재 보장, 없으면 예외 | `getUserById` |
| 조회(선택) | `find` | 없으면 null 가능 | `findUserByEmail` |
| 조회(복수) | `list`, `findAll` | 컬렉션 반환 | `listActiveUsers` |
| 생성 | `create` | 새 엔티티 생성 | `createUser` |
| 수정 | `update` | 기존 엔티티 수정 | `updateUserProfile` |
| 삭제(물리) | `delete` | 완전 삭제 | `deleteUser` |
| 삭제(논리) | `remove` | soft delete | `removeFromCart` |
| 검증(예외) | `validate` | 실패 시 예외 | `validateEmail` |
| 검증(판단) | `check` | true/false 반환 | `checkPermission` |
| 변환 | `to`, `from`, `parse` | 형식 변환 | `toDto`, `fromEntity` |
| 계산 | `calculate`, `compute` | 연산 결과 반환 | `calculateTotal` |

**타입/인터페이스:**

| 유형 | 규칙 | 예시 |
|------|------|------|
| 저장소 인터페이스 | `I` + 엔티티명 + `Repository` | `IUserRepository` |
| 서비스 인터페이스 | `I` + 기능명 + `Service` | `IEmailService` |
| DTO (출력) | 용도 + `Dto` | `UserResponseDto` |
| DTO (입력) | 동작 + `Input` | `CreateUserInput` |
| 도메인 이벤트 | 과거형 동사 + `Event` | `UserCreatedEvent` |
| 값 객체 | 개념명 (접미사 선택) | `Email` 또는 `EmailVo` |
| 열거형 | 복수형 또는 Status/Type | `UserRoles`, `OrderStatus` |
| 예외 클래스 | 상황 + `Exception` | `UserNotFoundException` |
| 제네릭 파라미터 | 단일 대문자 | `T`, `K`, `V`, `E` |

### 12.2 파일 내 코드 순서

1. 클래스 데코레이터 (`@Injectable()`, `@Entity()` 등)
2. 클래스 선언 (`export class ...`)
3. 정적 상수 및 프로퍼티 (`static readonly`)
4. 정적 메서드 (`static create(...)`)
5. 인스턴스 프로퍼티 (`public` → `protected` → `private`)
6. 생성자 (`constructor`)
7. 라이프사이클 훅 (`onModuleInit` 등)
8. 공개 메서드 (`public`)
9. 보호 메서드 (`protected`)
10. 비공개 메서드 (`private`)
11. Getter/Setter

### 12.3 파라미터 객체화 (Props 패턴)

함수 및 생성자의 매개변수는 **단일 객체로 묶어서 전달**하는 것을 원칙으로 한다. 매개변수 순서 실수를 방지하고 각 인자의 의미를 명확히 전달하기 위함이다.

**적용 대상:**

- **생성자**: 엔티티, 값 객체 등의 생성자는 매개변수 개수와 상관없이 무조건 프로퍼티 객체를 받는다.
- **팩토리 메서드**: `create()`, `reconstitute()` 등도 동일하게 적용한다.
- **일반 메서드**: 인자가 2개 이상인 경우 객체로 묶는 것을 강력히 권장한다.

**인터페이스 명명:**

- 생성자용: `{클래스명}Props` (예: `UserProps`)
- 생성용(필수값만): `Create{클래스명}Props` (예: `CreateUserProps`)

**Props 인터페이스 위치:** 해당 클래스와 같은 파일에 정의한다. 별도 파일로 분리하지 않는다.

**예외:** 단일 식별자(ID)만 전달하는 경우, 단일 DTO나 엔티티만 전달하는 경우, 프레임워크가 특정 시그니처를 강제하는 경우, **단일 원시값을 감싸는 값 객체(Value Object)의 팩토리 메서드**인 경우 (예: `Email.create(value)`, `CourseTitle.create(value)` — 래핑할 원시값이 하나뿐이면 `{ value }` 객체화는 가독성만 낮추므로 직접 전달을 허용한다)

### 12.4 상수 및 DI 토큰

| 상수 유형 | 위치 | 명명 |
|-----------|------|------|
| 전역 상수 | `src/shared/constants/{purpose}.constants.ts` | `UPPER_SNAKE_CASE` |
| 도메인 상수 | `domains/{domain}/domain/constants.ts` | `UPPER_SNAKE_CASE` |
| DI 토큰 | `domains/{domain}/domain/constants.ts` (**유일한 정의 위치**) | `UPPER_SNAKE_CASE` (Symbol 사용) |

**규칙:**

- 매직 넘버/매직 스트링 사용 금지. 모든 숫자/반복 문자열은 상수로 추출한다.
- DI 토큰은 반드시 `Symbol`로 생성한다 (문자열 금지).
- DI 토큰은 **`domain/constants.ts`에만 단일 정의**한다. Repository/Service 인터페이스 파일 등 다른 파일에서의 중복 정의를 금지한다.
- DI 토큰 패턴: `{ENTITY}_REPOSITORY` 또는 `{SERVICE_NAME}_SERVICE`. Symbol 인자는 인터페이스 이름을 그대로 사용한다.
- **ACL용 DI 토큰 네이밍:** 타 BC UseCase를 추상화하기 위해 소비 BC에서 자체 정의하는 Shadow 토큰은 Symbol 설명 문자열에 `ACL/` 접두사를 붙인다. 제공 BC(원본 UseCase 소유)의 토큰은 접두사 없이 사용한다. 이를 통해 디버깅 시 해당 토큰이 자체 BC의 것인지 타 BC에서 가져온 것인지 즉시 구별할 수 있다.

```typescript
// ✅ 제공 BC (Identity) — 원본 UseCase 토큰
export const GET_USER_USE_CASE = Symbol('IGetUserUseCase');

// ✅ 소비 BC (Membership) — 타 BC UseCase를 추상화한 Shadow 토큰
export const GET_USER_USE_CASE = Symbol('ACL/IGetUserUseCase');
```

### 12.5 변수 및 불변성

- **const 우선:** 기본적으로 `const` 사용. 재할당이 꼭 필요한 경우에만 `let`. `var`는 절대 금지.
- **readonly 활용:** 변경되지 않는 클래스 프로퍼티는 반드시 `readonly` 수식어 사용.
- **as const:** 리터럴 타입 유지가 필요한 경우 `as const` 단언 사용.

### 12.6 null/undefined 처리

| 규칙 | 설명 |
|------|------|
| 의도적 부재 | 값이 없음을 명시할 때는 `null` |
| 미초기화/누락 | 값이 아직 할당되지 않았거나 생략된 경우 `undefined` |
| Non-null assertion(`expr!`) | 사용 금지. 타입 가드나 조건문으로 대체 |
| Definite assignment assertion(`prop!:`) | 원칙적으로 지양. 단, 데코레이터 기반 프레임워크 클래스(예: GraphQL Input/Output, ORM Entity)에서 초기화 시점을 TS가 추론할 수 없는 경우에 한해 예외적으로 허용 |
| 널 병합 연산자 | 기본값 처리에 `??` 사용 |
| 옵셔널 체이닝 | 중첩 객체 안전 접근에 `?.` 사용 |

### 12.7 제어문 및 주석

**제어문:**

- **조기 반환 (Early Return):** 중첩 if문 대신 조건 불만족 시 즉시 리턴하여 들여쓰기를 줄인다.
- **긍정 조건 우선:** `if (!isValid)` 보다 `if (isValid)`를 우선 사용한다.
- **삼항 연산자 제한:** 간단한 값 할당에만 사용. 중첩 삼항 연산자는 금지.
- **명시적 비교:** `if (array.length)` 대신 `if (array.length > 0)`와 같이 명시적 비교.

**주석:**

- **코드로 표현 우선:** 주석이 필요하면 변수명이나 함수명을 더 명확하게 리팩토링하는 것을 우선 고려.
- **Why 주석:** 코드의 동작(What)이 아닌 작성 이유(Why)를 설명.
- **TODO 형식:** `// TODO: [담당자] 내용` 형식.
- **JSDoc 범위:** 공개 API, 복잡한 로직, 라이브러리성 함수에만 JSDoc 작성.
- **주석 동기화:** 코드 수정 시 관련 주석도 반드시 업데이트.

### 12.8 비동기 코드

- **async/await 필수:** `.then()` 체이닝 대신 `async/await` 구문 사용.
- **Promise.all 활용:** 서로 의존성 없는 비동기 작업은 병렬 처리.
- **타임아웃 설정:** 외부 API 호출 시 반드시 타임아웃 설정.
- **void Promise 지양:** fire-and-forget 패턴 사용 시 반드시 `catch`로 에러 처리.

### 12.9 의존성 주입 (DI)

- **생성자 주입만 허용:** 프로퍼티 주입이나 메서드 주입은 사용 금지.
- **인터페이스 의존:** 구체 클래스를 주입받지 않고 인터페이스(DI 토큰)를 주입받는다.
- **private readonly:** 주입된 의존성은 `private readonly`로 선언.
- **순환 의존성 최소화:** `forwardRef`는 원칙적으로 금지하되, BC 간 양방향 ACL이 비즈니스상 불가피한 경우(예: 회원가입 시 멤버십 생성 ↔ 강사 신청 시 사용자 조회)에 한해 InfrastructureModule에서 제한적으로 사용할 수 있다. 향후 도메인 이벤트(비동기)로 전환하여 제거하는 것을 목표로 한다.
- **주입 순서:** `저장소` → `서비스` → `유틸리티` → `설정` 순으로 정렬 권장.

---

## 13. Import 규칙

### 13.1 Path Alias 강제

**모든 import에서 상대 경로(`../`)를 사용하는 것을 금지한다.** 모든 모듈 간 참조는 반드시 path alias를 사용한다. (동일 디렉토리 내의 `./`는 예외적으로 허용하나, 가급적 alias 사용을 권장한다.)

| Alias | 경로 | 용도 |
|-------|------|------|
| `@domains/*` | `src/domains/*` | 도메인 모듈 |
| `@shared/*` | `src/shared/*` | 공유 유틸리티, 기반 클래스 |
| `@libs/relay` | `libs/relay/src` (프로젝트 루트) | Relay 라이브러리 |
| `@config/*` | `src/config/*` | 설정 파일 |
| `@auth` / `@auth/*` | `src/auth` / `src/auth/*` | 인증/인가 모듈 |
| `@health/*` | `src/health/*` | 헬스체크 모듈 |
| `@graphql` | `src/graphql` | GraphQL 설정 |
| `@dev-debug/*` | `src/dev-debug/*` | 개발/디버그 전용 모듈 |
| `@app` | `src/app.module` | 앱 모듈 |

**주의:** `@libs/relay`는 `src/` 하위가 아닌 **프로젝트 루트**의 `libs/relay/src`를 가리킨다. 와일드카드(`@libs/*`)가 아닌 구체적 매핑이다.

**예외:** `src/` 외부 파일(예: `mikro-orm.config.ts`)을 import할 때는 상대 경로 사용 가능.

### 13.2 계층 간 Import 제한

다음 import는 ESLint에 의해 자동 차단된다.

| 대상 계층 | 금지된 import 출처 | 설명 |
|-----------|-------------------|------|
| 도메인 | 애플리케이션, 인프라, 프레젠테이션 | 도메인은 외부 계층을 알지 못한다 |
| 애플리케이션 | 인프라, 프레젠테이션 | 애플리케이션은 인프라 구현체와 프레젠테이션을 알지 못한다 |
| 인프라 | 애플리케이션 UseCase, 프레젠테이션 | 인프라는 애플리케이션 UseCase와 프레젠테이션을 알지 못한다 |
| 프레젠테이션 | 인프라 | 프레젠테이션은 인프라 구현체를 알지 못한다 |

**허용되는 import 방향:**

- 프레젠테이션 → 애플리케이션 → 도메인 (외부에서 내부로)
- 인프라 → 도메인 (인터페이스 구현을 위해)
- 모든 계층 → `@shared/*` (공유 유틸리티, 기반 클래스)

**ESLint 예외:**

- `infrastructure/acl/**/*.ts`: 계층 import 제한 해제 (ACL 구현체가 타 BC UseCase를 호출하기 위함)
- `infrastructure/**/*.module.ts`: 계층 import 제한 해제 (NestJS 모듈에서 DI 바인딩 목적)

### 13.3 console 사용 금지

ESLint `no-console` 규칙으로 `console.log`, `console.warn`, `console.error` 등 모든 `console` 메서드 사용을 금지한다. 로깅은 반드시 Winston 로거를 통해 수행한다. 디버깅 목적의 `console.log`가 프로덕션 코드에 포함되는 것을 방지하기 위함이다.

### 13.4 Barrel Export 금지

**Barrel export(`index.ts`를 통한 재수출)는 사용하지 않는다.**

금지 이유:

1. 순환 의존성 위험 증가
2. Tree-shaking 방해로 번들 크기 증가
3. TypeScript 컴파일러 빌드 성능 저하
4. 명시적 의존성 추적 어려움
5. IDE 자동완성 혼란

**예외:** `libs/` 폴더의 외부 라이브러리 public API는 단일 진입점을 위해 `index.ts` 사용 가능. 도메인 코드(`src/domains/`)에서는 절대 사용 금지.

---

## 14. 개발 워크플로우

### 14.1 패키지 매니저

- **yarn만 사용.** `npm install`, `pnpm add` 등 타 패키지 매니저 사용 금지.
- `yarn.lock`만 유지하며 `package-lock.json`/`pnpm-lock.yaml`은 생성하지 않는다.
- 스크립트 실행은 `yarn <script>` 형식 (예: `yarn test`, `yarn lint`).

---

_Last Updated: 2026-02-10_
