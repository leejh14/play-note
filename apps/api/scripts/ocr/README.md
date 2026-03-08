# OCR Local Test Harness

Nest 서버를 거치지 않고 Python OCR 로직만 독립적으로 검증하기 위한 하네스다.

## 빠른 실행

```bash
cd apps/api
yarn test:ocr
python3 -m pip install -r scripts/ocr/requirements.txt
python3 scripts/ocr/extract.py --input '{"jobId":"demo","roiProfile":"LOL_ENDSCREEN_V1","imagePath":"scripts/ocr/datasets/cases/case-001-kr-blue-16x9/image.ppm","match":{"teamA":[],"teamB":[]},"friendDictionary":[],"ocr":{"winnerTextCandidates":[],"blueTextCandidates":[],"redTextCandidates":[]}}'
python3 scripts/ocr/evaluate.py
python3 scripts/ocr/evaluate.py --case case-101-real-kr-blue
python3 scripts/ocr/evaluate.py --format json
```

## 현재 범위

- CLI 계약 테스트: `--input` JSON 문자열 / 파일 경로 모두 지원
- Riot ID 정규화 / 퍼지 매칭 테스트
- dataset 기반 Team A side / winner side 회귀 테스트
- evaluator CLI로 `matchedFriendIds` precision/recall/F1 리포트 확인 가능
- `opencv + paddleocr`가 설치되면 실제 OCR 실행 가능
- 의존성이 없으면 `input.json`의 `ocr` 후보값으로 후처리 로직만 검증
- `winnerSide`는 strict 정책이다. `승리/패배`를 읽어도 side 단서가 없으면 `unknown`으로 유지한다.

## fixture 구조

`scripts/ocr/tests/fixtures/*.json`

```json
{
  "input": {
    "jobId": "case-id",
    "match": { "teamA": ["friend-a1"], "teamB": ["friend-b1"] },
    "friendDictionary": [
      { "friendId": "friend-a1", "primary": ["junho#kr1"], "secondary": ["junho"] }
    ],
    "ocr": {
      "winnerBannerSide": "blue",
      "winnerTextCandidates": ["VICTORY"],
      "blueTextCandidates": ["Junho#KR1"],
      "redTextCandidates": []
    }
  },
  "expected": {
    "winnerSide": "blue",
    "teamASide": "blue"
  }
}
```

## 실제 데이터셋 구조

기본 회귀 케이스는 아래 구조를 사용한다.

```text
scripts/ocr/datasets/
  cases/
    case-001/
      image.ppm
      input.json
      expected.json
```

실제 종료화면 데이터셋을 넣을 때는 `image.ppm` 대신 `png/jpg`를 사용해도 된다.
그 경우 `opencv-python-headless`가 설치되어 있어야 한다.

실제 캡처 케이스는 아래처럼 추가한다.

```text
scripts/ocr/datasets/cases/
  case-101-real-kr-blue/
    input.png
    input.json
    expected.json
```

- `input.json`의 `imagePath`는 보통 `input.png`처럼 상대경로로 둔다.
- 실제 OCR을 태우려면 `input.json`에 `ocr` 필드를 넣지 않는다.
- 단일 케이스 확인은 `python3 scripts/ocr/extract.py --input scripts/ocr/datasets/cases/<case-id>/input.json`
- 품질 비교는 `python3 scripts/ocr/evaluate.py --case <case-id>`로 본다.
