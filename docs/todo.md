# PlayNote — 후속 TODO (Phase 08/09 제외)

> 진행 상태: `[ ]` 미착수 · `[~]` 진행중 · `[x]` 완료 · `[-]` 스킵/불필요  
> 범위: **Phase 07 후속** 중심.  
> 제외: `docs/plan/08-worker-ocr.md`, `docs/plan/09-deployment.md`

---

## 1) Frontend 운영 안정화

- [x] **세션 컨텍스트 스위처 추가**
  - `/sessions`, `/stats`, `/friends`에서 active session 전환/제거 UI 제공
  - `playnote:active-session-id` 기준 컨텍스트 선택 동작 반영
- [x] **파괴적 액션 확인 다이얼로그 도입**
  - Friend archive/restore, Match delete 전 확인 모달 적용
- [x] **업로드 타겟 UX 보강**
  - LOL: match target 선택 후 `MATCH + LOL_RESULT_SCREEN` 업로드
  - FUTSAL: session 사진 업로드(`SESSION + FUTSAL_PHOTO`)
  - 상세 화면에서 session/match attachment 통합 표시

- [x] **온보딩/권한 정책 최종 정렬**
  - [x] `createSession` 무토큰 허용 (`@Public`) 적용 + 테스트 추가
  - [x] 무토큰 사용자 기본 진입 플로우(링크 유도 vs 생성 허용) 문구/화면 통일
  - [x] `/s/{id}?t=` 재진입 시 토큰 최신값으로 갱신(기존 값 덮어쓰기)
- [x] **세션 목록 정책 정렬**
  - active session 우선 선택 + 없을 때 최근 사용 세션 fallback 적용
  - 세션 스위처 옵션에 최근 사용 시각 노출(최근순 정렬)

---

## 2) 화면/컴포넌트 후속

- [x] 공통 `toast` 컴포넌트 도입 및 인라인 상태 메시지 교체
  - `ToastProvider + useToast` 도입
  - 공유 버튼/업로드 결과 인라인 메시지를 toast로 교체
- [x] 업로드 진행률 컴포넌트(`upload-progress`) 추가
  - presigned PUT 업로드 진행률(파일별) UI 반영
- [x] `share-complete` 화면/컴포넌트 보강 (세션 생성 직후 공유 UX)
  - `/sessions/new/share-complete` 경유 후 공유/복사/셋업 진입 흐름 적용
- [x] 세션 셋업 UX 고도화(드래그앤드롭 없이도 빠른 팀/라인 배치)
  - `균등 팀`, `라인 자동` 퀵 액션으로 bulk 배정 지원
- [x] 세션 상세 매치 편집 UX 고도화(라인/챔피언 수정 피드백 개선)
  - 라인/챔피언 저장 상태(`저장 중/저장됨/실패`) 및 챔피언 명시 저장 버튼 적용

---

## 3) 에러/권한 UX 정교화

- [x] `UNAUTHORIZED | INVALID_TOKEN | SESSION_NOT_FOUND | FORBIDDEN` 코드별 UX 카피 최종 확정
- [x] 토큰 무효/세션 삭제 시 localStorage 정리 정책 일관화
  - `INVALID_TOKEN | SESSION_NOT_FOUND | UNAUTHORIZED` 시 token/share-token/active-session 정리
- [x] admin/editor 경계 UI를 전 화면에서 일관되게 재검증
  - Friend CRUD, Match delete는 `authContext.role === ADMIN`일 때만 노출

---

## 4) 테스트/품질

- [x] Web 단위 테스트 추가
  - `lib/token.ts`
  - `lib/relay-id.ts`
  - error code → 사용자 메시지 매핑
- [x] API E2E 보강
  - `createSession` 무헤더 호출 허용 검증(`session-create-public.e2e-spec.ts`)
- [~] Web E2E 테스트(Playwright 권장)
  - [x] `/s/{id}?t=` 진입/저장/리다이렉트
  - [x] setup → confirm → detail
  - [~] admin/editor 분기(friend CRUD, match delete) — friend 분기 완료, match delete 대기
  - [x] presigned upload 플로우
- [ ] 모바일 수동 QA
  - 카카오 공유, 링크 복사, OG 프리뷰, 토큰 오류 케이스

---

## 5) 데이터/외부 연동 준비 (배포 제외)

- [ ] `init.sql` 초기 Friend 데이터 구성
- [ ] Kakao Developers 앱 실제 설정 검증
  - 도메인 등록
  - JavaScript 키 검증
  - 공유 템플릿 실제 렌더링 확인
- [ ] `.env.example`와 현재 프론트 요구 변수 동기화 점검

---

## 6) 문서 동기화

- [x] `docs/plan/07-frontend.md`의 페이지별 토큰 정책 표를 현재 구현과 일치시킴
- [x] `docs/시스템디자인.md`에 세션 컨텍스트 스위처/업로드 타겟 정책 반영
- [ ] 후속 Plan 수립 전에 본 TODO 우선순위 재정렬 (P0/P1/P2)
