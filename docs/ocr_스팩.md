# PlayNote — OCR/Analysis Spec (LoL End Screen v1.0)

> 목적: LoL **게임 종료 결과창(1종)** 스크린샷에서 자동으로  
> **winnerSide(blue/red)**, **teamASide(Team A가 blue인지 red인지)** 를 추출하고,  
> 결과는 “초안”으로 저장한 뒤 UI에서 사용자가 확정하면 Match에 반영하여 집계에 사용한다.
>
> 핵심 최적화: **Friend 테이블의 Riot ID(riotGameName + riotTagLine)** 를 이용해 OCR 오차를 “사전 매칭(dictionary fitting)”으로 줄인다.

---

## 1) 스택(라이브러리/런타임) — 확정

### 1.1 Orchestration / Job

- **Graphile Worker (Postgres 기반 job queue)**
  - DB 기반 job 운영 확정
  - Task handler에서 OCR/분석 수행 및 결과 저장

### 1.2 Node(NestJS worker) 실행

- **Python CLI 호출** 방식 (Option A 확정)
  - Node에서 python 스크립트 실행 + stdout JSON 파싱
- 추천 런타임 유틸
  - **execa**: python 프로세스 실행/timeout/stdout 처리

### 1.3 Python 분석 스택

- **PaddleOCR**: OCR 엔진
- **opencv-python-headless**: ROI crop / 전처리
- **rapidfuzz**: RiotID 기반 퍼지 매칭(유사도)

> 참고: champion 자동 추출은 범위 밖. champion은 UI에서 수동 입력.

---

## 2) 입력/출력 정의

### 2.1 입력 이미지

- 타입: `LOL_RESULT_SCREEN`
- 포맷: **게임 종료 결과창 1종만 지원**
- 저장: S3 (presigned 업로드)
- 연관: `Attachment(scope=MATCH, type=LOL_RESULT_SCREEN, matchId, sessionId)`

### 2.2 출력(자동 추출 초안)

- `winnerSide`: `blue | red | unknown`
- `teamASide`: `blue | red | unknown`
- `confidence`: 숫자(0~1) 선택
- `nameMatching`: OCR로 읽은 문자열과 Friend 매칭 결과(디버깅/수정용)

---

## 3) 도메인 전제(추정에 필요한 데이터)

- 세션에는 **SessionTeamPreset**(Team A/B 사람팀)이 존재
- Match 생성 시 SessionTeamPreset을 복사하여 **MatchTeamMember(team A/B, friendId)**가 존재
- 즉, OCR 시점에 worker는 다음을 알고 있다:
  - 이 match의 Team A 멤버(friendId 5명)
  - 이 match의 Team B 멤버(friendId 5명)
  - Friend 테이블의 RiotID (riotGameName, riotTagLine)

---

## 4) 파이프라인(처리 단계)

### Step 0) Job 생성 트리거

- Attachment 업로드 complete 시점에:
  - `Attachment(type=LOL_RESULT_SCREEN)` 생성
  - Graphile Worker job enqueue: `lol_endscreen_extract`
  - payload 최소화: attachmentId, matchId

### Step 1) 이미지 로딩

- worker task:
  - attachmentId → Attachment 조회(s3Key 포함)
  - S3에서 이미지 다운로드(또는 presigned GET)

### Step 2) 입력 정규화 + ROI Crop

- 결과창 1종 고정 포맷이므로 ROI profile: `LOL_ENDSCREEN_V1`
- 해상도 normalize:
  - 기준 폭으로 리사이즈(예: width=1920 기준) 후 ROI 좌표 적용
- ROI 종류:
  - `winner_banner_roi`
  - `blue_list_roi`
  - `red_list_roi`

### Step 3) OCR 실행(PaddleOCR)

- ROI별 OCR 텍스트 후보 획득:
  - `winnerTextCandidates[]`
  - `blueTextCandidates[]`
  - `redTextCandidates[]`

### Step 4) winnerSide 판정

- 키워드 탐지:
  - KR: `승리`, `패배`
  - EN: `VICTORY`, `DEFEAT`
- winnerTextCandidates에서 탐지 결과로:
  - 승리 → `winnerSide = <승리한 진영>` (아래 Step 6에 의해 최종 확정)
  - 탐지 실패 → `winnerSide=unknown`

> winner 텍스트만으로 “어느 진영이 이겼는지”가 직접 나오지 않는 UI라면  
> winnerSide는 Step 6(TeamA_side + 승패) 기반으로만 확정하거나, 배너 위치/색상 정보를 함께 사용.

### Step 5) RiotID 파싱(텍스트 후보 → gameName#tagLine)

- 입력 후보(blueTextCandidates + redTextCandidates)에 대해:
  - 구분자 통일: `＃`, `♯`, 공백 등 → `#`
  - 정규화: trim/lower
  - 정규식 예시:
    - full: `(.+?)\s*#\s*([A-Za-z0-9]{2,10})`
- 산출:
  - `riotIdCandidatesFull[]` : `"game#tag"`
  - `riotIdCandidatesNameOnly[]` : `"game"` (tagLine이 없는 경우)

### Step 6) Friend Dictionary Fitting (RiotID-first)

#### 6.1 Dictionary 생성 규칙(확정)

Friend마다 후보 키 생성:

- Primary: `normalize(riotGameName + "#" + riotTagLine)`
- Secondary: `normalize(riotGameName)`

매칭 범위 우선순위:

1. **이번 match 참가자(Team A+B) Friend 10명**만으로 1차 매칭 (closed set, 최강)
2. 애매하면 세션 roster → 그래도 애매하면 전역 friend로 확장(기본은 1차만으로 충분)

#### 6.2 매칭 로직

- 알고리즘: rapidfuzz 유사도
- Stage 1 (primary):
  - full riotId 후보를 primary key에 매칭
  - `minScoreFull` 이상이면 자동 확정 후보로 채택
- Stage 2 (secondary):
  - tagLine을 못 읽은 후보(gameName-only)에 대해 secondary 매칭
  - `minScoreNameOnly`는 더 보수적으로
  - 기본 정책: 자동 확정 대신 “확인 필요” 플래그

권장 기본값(초기):

- `topK = 3`
- `minScoreFull = 90`
- `minScoreNameOnly = 92`

### Step 7) teamASide 판정(닉네임 매칭 기반)

- blue 영역에서 매칭된 friend 중 Team A 멤버 수 = `countA_blue`
- red 영역에서 매칭된 friend 중 Team A 멤버 수 = `countA_red`

판정 규칙(초기):

- `countABlue >= 3` → `teamASide = blue`
- `countARed >= 3` → `teamASide = red`
- 그 외 → `unknown`

> 5명을 다 못 읽어도 3명만 안정적으로 잡히면 충분히 side 추정 가능.

### Step 8) 결과 저장(초안)

- ExtractionResult 테이블에 저장 (shadow table, status → DONE):
  - result jsonb: winnerSide, teamASide, confidence, ocr, parsed, matching, teamASideEvidence, unmatched

### Step 9) 사용자 확정(집계 반영)

- UI에서 사용자가 `confirmMatchResult` 수행 시:
  - `Match.winnerSide`, `Match.teamASide` 저장
  - `Match.isConfirmed = true`, `Match.status = COMPLETED`
- 통계는 `isConfirmed=true`만 집계

---

## 5) Graphile Worker Task Spec

### 5.1 Job Name

- `lol_endscreen_extract`

### 5.2 Payload (최소)

```json
{
  "attachmentId": "uuid",
  "matchId": "uuid"
}
```

### 5.3 input json

```json
{
  "jobId": "uuid",
  "s3": {
    "bucket": "xxx",
    "key": "attachments/....png",
    "region": "ap-northeast-2"
  },
  "roiProfile": "LOL_ENDSCREEN_V1",
  "match": {
    "teamA": ["friendId1", "friendId2", "friendId3", "friendId4", "friendId5"],
    "teamB": ["friendId6", "friendId7", "friendId8", "friendId9", "friendId10"]
  },
  "friendDictionary": [
    {
      "friendId": "friendId1",
      "primary": ["junho#kr1"],
      "secondary": ["junho"]
    }
  ],
  "options": {
    "topK": 3,
    "minScoreFull": 90,
    "minScoreNameOnly": 92
  }
}
```

### 5.3 output json

```json
{
  "jobId": "uuid",
  "status": "done",
  "winnerSide": "unknown",
  "teamASide": "blue",
  "confidence": { "teamASide": 0.78, "winner": 0.0 },
  "ocr": {
    "winnerTextCandidates": ["승리"],
    "blueTextCandidates": ["Junho#KR1", "..."],
    "redTextCandidates": ["..."]
  },
  "parsed": {
    "blue": [{ "gameName": "junho", "tagLine": "kr1", "raw": "Junho#KR1" }],
    "red": []
  },
  "matching": [
    {
      "raw": "Junho#KR1",
      "normalized": "junho#kr1",
      "top": [
        {
          "friendId": "friendId1",
          "score": 96,
          "matchedKey": "primary:junho#kr1"
        }
      ]
    }
  ],
  "teamASideEvidence": { "countABlue": 3, "countARed": 0 },
  "unmatched": ["???"]
}
```
