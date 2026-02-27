---
name: playnote-design-system
description: PlayNote 디자인 시스템 토큰과 원칙. 색상, 타이포그래피, 스페이싱, 컴포넌트 스타일 가이드. Pencil(.pen) 디자인 작업이나 프론트엔드 UI 구현 시 사용.
---

# PlayNote Design System

## 디자인 방향

- **모바일 퍼스트** — 주 사용 환경: 스마트폰 (카카오톡 링크 → 모바일 브라우저)
- **Minimal SaaS** — 화이트 베이스, 콘텐츠 중심, 장식 최소화
- **타이포그래피 위계** — 폰트 웨이트 대비(700 vs 400)로 구조 표현
- **컬러 절제** — primary는 CTA/활성 상태에만, 나머지는 흑백 + 회색
- **보더리스 카드** — 그림자/테두리 없이 배경색 차이로 구분

## 색상

| 토큰            | 값        | 용도                                             |
| --------------- | --------- | ------------------------------------------------ |
| `primary`       | `#2196F3` | 메인 컬러. CTA 버튼, 활성 탭, 링크, 토글 ON      |
| `primary-light` | `#E3F2FD` | 서브 컬러. 배지 배경, 선택 상태, 하이라이트 영역 |
| `white`         | `#FFFFFF` | 페이지 배경, 카드 배경                           |
| `black`         | `#18181B` | 제목, 본문 텍스트 (near-black)                   |
| `gray-100`      | `#F5F5F5` | 카드/섹션 배경                                   |
| `gray-300`      | `#E0E0E0` | 구분선, border                                   |
| `gray-500`      | `#9E9E9E` | 비활성 텍스트, 플레이스홀더                      |
| `gray-700`      | `#616161` | 부가 텍스트, 설명                                |
| `gray-900`      | `#212121` | 강조 검정                                        |

**Team Side 컬러**:
| 토큰 | 값 | 용도 |
|------|------|------|
| `red-light` | `#ffd6ff` | Team B / Red side 배경 |
| `red` | `#D81B60` | Team B / Red side 텍스트, 강조 |

> Team A / Blue = `primary` + `primary-light`, Team B / Red = `red` + `red-light`

**제한**: primary, primary-light, red, red-light, 흰색, 검정, 회색만 사용. 추가 컬러 금지.

## 타이포그래피

- **폰트**: Pretendard (단일 폰트, 한글/영문/숫자 모두)

| 토큰             | 크기 | 웨이트       | 용도               |
| ---------------- | ---- | ------------ | ------------------ |
| `font-size-2xl`  | 28px | Bold 700     | 화면 제목, 큰 숫자 |
| `font-size-xl`   | 24px | Bold 700     | 섹션 제목          |
| `font-size-lg`   | 20px | Semibold 600 | 카드 제목          |
| `font-size-md`   | 17px | Semibold 600 | 리스트 항목 제목   |
| `font-size-base` | 15px | Regular 400  | 본문               |
| `font-size-sm`   | 13px | Medium 500   | 보조 텍스트, 배지  |
| `font-size-xs`   | 11px | Medium 500   | 탭 라벨, 캡션      |

**웨이트**: 400(Regular), 500(Medium), 600(Semibold), 700(Bold)

## 스페이싱

| 토큰           | 값   | 용도                     |
| -------------- | ---- | ------------------------ |
| `spacing-xs`   | 4px  | 마이크로 간격            |
| `spacing-sm`   | 8px  | 아이콘-라벨, 인라인 요소 |
| `spacing-md`   | 12px | 카드 내부 요소 간격      |
| `spacing-base` | 16px | 기본 간격, 카드 간       |
| `spacing-lg`   | 20px | 헤더-콘텐츠 간격         |
| `spacing-xl`   | 24px | 콘텐츠 좌우 패딩         |
| `spacing-2xl`  | 32px | 섹션 간 간격             |

## Corner Radius

| 토큰          | 값    | 용도                |
| ------------- | ----- | ------------------- |
| `radius-sm`   | 8px   | 작은 배지, 인풋     |
| `radius-md`   | 12px  | 카드, 버튼          |
| `radius-lg`   | 16px  | 큰 카드, 모달       |
| `radius-full` | 100px | 필(pill) 버튼, 탭바 |

## 레이아웃

- **화면 폭**: 402px (iPhone 기준)
- **콘텐츠 패딩**: 좌우 24px
- **섹션 간격**: 32px
- **카드 간격**: 16px

## 아이콘

- **Lucide** 아이콘셋, outlined 스타일
- 크기: 16px(인라인), 20px(액션), 24px(네비게이션)
- 색상: `$black`(활성), `$gray-500`(비활성), `$white`(primary 배경 위)

## 컴포넌트 스타일 원칙

### 버튼

- Primary: `$primary` 배경 + `$white` 텍스트, radius-md
- Secondary: `$white` 배경 + `$primary` 텍스트 + `$gray-300` border, radius-md
- 높이: 48px (모바일 터치 타겟)

### 카드

- 배경: `$gray-100` 또는 `$white`
- border/shadow 없음
- padding: 16px
- radius: radius-md (12px)

### 입력 필드

- 배경: `$white`
- border: 1px `$gray-300`
- radius: radius-sm (8px)
- 높이: 44px
- placeholder: `$gray-500`

### 배지/태그

- 배경: `$primary-light`, 텍스트: `$primary`
- radius: radius-full
- padding: 4px 12px
- font-size: 13px, Medium 500

## Pencil(.pen) 작업 시 참고

- 변수 참조: `$primary`, `$font-size-base` 등 dollar prefix
- 폰트: `fontFamily: "Pretendard"`
- 텍스트 색상: `fill` 속성 사용 (`fill: "$black"`)
- 레이아웃: flexbox(vertical/horizontal) 우선, absolute positioning 최소화
- `fill_container` / `fit_content`로 반응형 사이징
- **Pencil MCP 호출 시 모든 프롬프트(name, context, content 등)는 반드시 영문으로 번역하여 전달**
