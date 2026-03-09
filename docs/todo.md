# PlayNote — 남은 작업 (2026-03-07 기준)

> 전제: 프론트 UI와 백엔드 API 연동은 완료된 상태로 본다.
>
> 현재 확인된 상태:
>
> - [x] `yarn build` 통과
> - [x] API 단위 테스트 통과 (`yarn workspace @playnote/api test`)
> - [x] API E2E 통과 (`yarn workspace @playnote/api test:e2e`)
> - [x] `yarn lint` 실패 (`ESLint v9`용 `eslint.config.*` 부재)
> - [x] Worker/OCR 태스크 실제 구현 미완료
> - [ ] 배포 산출물 미완료 (`docker-compose.yml`은 현재 postgres만 구성)

---

## P0. 출시 전 반드시 끝낼 것

- [x] **린트 체계 복구**
  - `ESLint v9` 기준 flat config 추가 (`eslint.config.js|mjs|cjs`)
  - `yarn lint`가 `api`와 `web` 모두 통과하도록 정리

- [x] **Worker/OCR 실제 구현**
  - `apps/api/src/shared/infrastructure/worker/tasks/lol_endscreen_extract.ts`
  - `apps/api/src/shared/infrastructure/worker/tasks/cleanup_s3_objects.ts`
  - `apps/api/src/shared/infrastructure/worker/tasks/auto_done_sessions.ts`
  - `apps/api/scripts/ocr/extract.py` stub 제거 및 실제 OCR 파이프라인 연결

- [ ] **배포 가능한 인프라 구성**
  - `docker-compose.yml`을 `postgres` 단독 구성에서 `api/web/nginx/postgres`까지 확장
  - `docker/api/Dockerfile`, `docker/web/Dockerfile`, nginx 설정 파일 추가
  - 프로덕션 빌드, 마이그레이션, 기동 절차를 실제로 검증

- [ ] **실서비스 외부 연동 검증**
  - Kakao Developers 도메인 등록, JavaScript 키, 공유 템플릿 실제 렌더링 확인
  - S3 버킷/CORS/presigned upload/delete를 실환경 기준으로 점검

- [ ] **웹 E2E 최소 커버리지 확보**
  - `/s/{id}?t=` 진입과 토큰 저장/갱신
  - `setup -> confirm -> detail` 핵심 플로우
  - presigned upload 플로우
  - admin 전용 UI/액션 노출 조건

---

## P1. 운영 안정화

- [ ] **실기기 QA**
  - 카카오톡 인앱 브라우저에서 링크 진입/공유/복사 확인
  - iOS Safari, Android Chrome에서 업로드/리다이렉트/에러 복구 확인

- [ ] **환경 변수와 런타임 설정 동기화**
  - `.env.example`와 실제 요구 변수 재점검
  - `apps/api/src/config/env.validation.ts`와 운영 환경 변수 세트 일치화
  - 웹/서버/워커가 각각 어떤 변수를 요구하는지 문서로 고정

- [ ] **운영 가시성 보강**
  - 배포 직후 smoke check 절차 정리
  - worker 실패 로그와 재시도 관찰 포인트 정리
  - 장애 시 확인할 최소 로그/명령어/runbook 정리

- [ ] **CI 자동화**
  - 최소 파이프라인: `build + api test + api e2e + lint`
  - 배포 전 자동 검증 경로 확보

---

## P2. 문서 정리

- [ ] **로드맵/계획 문서 상태 갱신**
  - `docs/plan/00-roadmap.md` 기준으로 완료/미완료 상태 재표기
  - Phase 6은 통계가 아니라 `Worker/OCR` 잔여 작업 중심으로 재정리
  - Phase 8은 배포/통합 테스트 항목만 남도록 정리

- [ ] **운영 문서 정리**
  - 배포 절차
  - 롤백 절차
  - DB migration/init 절차
  - 외부 서비스(Kakao, S3) 설정 체크리스트

---

## 메모

- 현재 코드 기준으로 가장 큰 남은 덩어리는 **Worker/OCR**과 **배포 준비**다.
- 기능 개발 자체보다 **출시 가능 상태로 만드는 작업**이 우선순위다.
