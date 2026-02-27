# Worker + OCR 파이프라인 계획

> Graphile Worker 기반의 비동기 작업 처리.
> OCR 추출, S3 정리, 자동 done 전환 3개 task를 운영한다.

---

## 1. Graphile Worker 설정

### 설치

```bash
yarn add graphile-worker
```

### 초기화 방식

**A안: API 프로세스 내 실행 (MVP 선택)**

```typescript
// shared/infrastructure/worker/graphile-worker.service.ts
@Injectable()
export class GraphileWorkerService implements OnModuleInit, OnModuleDestroy {
  private runner: Runner;

  async onModuleInit() {
    this.runner = await run({
      connectionString: process.env.DATABASE_URL,
      concurrency: Number(process.env.GRAPHILE_WORKER_CONCURRENCY ?? 2),
      taskDirectory: `${__dirname}/tasks`,
      crontabFile: `${__dirname}/crontab`,
    });
  }

  async onModuleDestroy() {
    await this.runner.stop();
  }

  async addJob(taskName: string, payload: Record<string, unknown>) {
    await this.runner.addJob(taskName, payload);
  }
}
```

**B안: 별도 컨테이너 (확장 시)**
- `docker-compose.yml`에 worker 서비스 추가
- 동일 DB 연결, 별도 프로세스

### crontab

```
# crontab
# 매일 04:00 KST (UTC 19:00)에 자동 done 전환
0 19 * * * auto_done_sessions
```

---

## 2. Task 목록

### 2.1 `lol_endscreen_extract` — OCR 추출

**트리거**: `completeUpload(s)` UseCase에서 LOL_RESULT_SCREEN 업로드 완료 시

**Payload**:

```json
{
  "attachmentId": "uuid",
  "matchId": "uuid"
}
```

**실행 플로우**:

```
1. attachmentId → Attachment 조회 → s3Key 확인
2. matchId → Match + MatchTeamMember 조회 → Team A/B 멤버 목록
3. Friend 테이블에서 멤버들의 RiotID 조회
4. Python CLI input JSON 조립 (ocr_스팩.md 5.3 참조)
5. execa로 Python CLI 호출:
   python scripts/ocr/extract.py --input <json_file_path>
6. stdout → JSON 파싱 → ExtractionOutput
7. ExtractionResult.markDone({ model, result }) 또는 markFailed()
8. extractionResultRepository.save(result)
```

**에러 처리**:

```
- Python 프로세스 실패 → Graphile Worker 자동 retry
- 최종 실패 (maxRetries 초과) → ExtractionResult.status = FAILED
- timeout: 60초 (execa timeout 설정)
```

**retry 설정**:

```typescript
await addJob('lol_endscreen_extract', payload, {
  maxAttempts: 3,
  // Graphile Worker의 exponential backoff 기본 적용
});
```

### 2.2 `cleanup_s3_objects` — S3 파일 정리

**트리거**: `deleteSession`, `deleteMatch`, `deleteAttachment` UseCase에서 트랜잭션 커밋 후

**Payload**:

```json
{
  "s3Keys": ["attachments/session1/file1.png", "attachments/session1/file2.jpg"]
}
```

**실행 플로우**:

```
1. s3Keys 배열로 S3 deleteObjects 호출
2. 실패 시 retry (최대 3회)
3. 최종 실패 시 로그 기록 (orphan file은 추후 정리)
```

### 2.3 `auto_done_sessions` — 자동 마감 (cron)

**트리거**: crontab (매일 04:00 KST)

**실행 플로우**:

```sql
UPDATE session
SET status = 'DONE', updated_at = NOW()
WHERE status = 'CONFIRMED'
  AND starts_at < NOW() - INTERVAL '3 days';
```

```
1. 대상 세션 조회 (confirmed + startsAt < 3일 전)
2. 일괄 UPDATE
3. 전환된 세션 수 로그 기록: logger.info(`auto-done: transitioned ${count} sessions`)
4. scheduled 세션은 대상 아님
```

---

## 3. Python OCR CLI

### 위치

```
scripts/ocr/
├── extract.py                    # 진입점
├── requirements.txt
├── roi/
│   └── lol_endscreen_v1.py       # ROI 프로파일
├── matching/
│   └── friend_matcher.py         # RiotID 퍼지 매칭
└── README.md
```

### requirements.txt

```
paddleocr>=2.7
paddlepaddle>=2.5
opencv-python-headless>=4.8
rapidfuzz>=3.0
```

### CLI 인터페이스

```bash
python scripts/ocr/extract.py --input /tmp/ocr_input_xxx.json
# stdout: JSON (output 스키마)
# stderr: 로그/에러
# exit 0: 성공, exit 1: 실패
```

### 파이프라인 단계 (ocr_스팩.md 4절 참조)

```
Step 1) S3에서 이미지 다운로드 (boto3 또는 presigned GET URL)
Step 2) 해상도 정규화 + ROI crop (LOL_ENDSCREEN_V1)
Step 3) PaddleOCR 실행 → 텍스트 후보
Step 4) winnerSide 판정 (승리/패배/VICTORY/DEFEAT 키워드)
Step 5) RiotID 파싱 (gameName#tagLine)
Step 6) Friend Dictionary Fitting (rapidfuzz, 매치 참가자 10명 우선)
Step 7) teamASide 판정 (countABlue >= 3 → blue, countARed >= 3 → red)
Step 8) JSON 결과 출력 (stdout)
```

### Input JSON 스키마 (ocr_스팩.md 5.3)

```json
{
  "jobId": "uuid",
  "s3": { "bucket": "...", "key": "...", "region": "ap-northeast-2" },
  "roiProfile": "LOL_ENDSCREEN_V1",
  "match": {
    "teamA": ["friendId1", ...],
    "teamB": ["friendId6", ...]
  },
  "friendDictionary": [
    { "friendId": "...", "primary": ["junho#kr1"], "secondary": ["junho"] }
  ],
  "options": { "topK": 3, "minScoreFull": 90, "minScoreNameOnly": 92 }
}
```

### Output JSON 스키마 (ocr_스팩.md 5.3)

```json
{
  "jobId": "uuid",
  "status": "done",
  "winnerSide": "blue",
  "teamASide": "blue",
  "confidence": { "teamASide": 0.78, "winner": 0.95 },
  "ocr": { "winnerTextCandidates": [...], "blueTextCandidates": [...], "redTextCandidates": [...] },
  "parsed": { "blue": [...], "red": [...] },
  "matching": [...],
  "teamASideEvidence": { "countABlue": 3, "countARed": 0 },
  "unmatched": [...]
}
```

---

## 4. Node ↔ Python 연동

### execa 호출

```typescript
// attachment/infrastructure/extraction/python-cli-extraction.service.ts
import { execa } from 'execa';

@Injectable()
export class PythonCliExtractionService implements IExtractionService {
  async execute(input: ExtractionInput): Promise<ExtractionOutput> {
    const inputJson = this.buildInputJson(input);
    const tempFile = await this.writeTempFile(inputJson);

    try {
      const { stdout } = await execa('python3', [
        'scripts/ocr/extract.py',
        '--input', tempFile,
      ], {
        timeout: 60_000,
        cwd: process.cwd(),
      });

      const result = JSON.parse(stdout);
      return this.parseOutput(result);
    } finally {
      await this.removeTempFile(tempFile);
    }
  }
}
```

### DIP 교체 가능

```typescript
// attachment.infrastructure.module.ts
{
  provide: EXTRACTION_SERVICE,
  useClass: process.env.EXTRACTION_MODE === 'http'
    ? HttpExtractionService      // 향후 별도 서비스
    : PythonCliExtractionService, // 초기 (Python CLI)
}
```

---

## 5. Graphile Worker 테이블

Graphile Worker는 자체 테이블을 `graphile_worker` 스키마에 생성한다.

```sql
-- Graphile Worker가 자동 생성하는 테이블 (수동 생성 불필요)
graphile_worker.jobs
graphile_worker.job_queues
graphile_worker.known_crontabs
graphile_worker.migrations
```

### 초기 설정

```bash
# Graphile Worker 마이그레이션 (자동 실행됨)
# 첫 run() 호출 시 자동으로 graphile_worker 스키마 생성
```

---

## 6. 모니터링

### 로그

```typescript
// task 내부
logger.info('lol_endscreen_extract: started', { attachmentId, matchId });
logger.info('lol_endscreen_extract: completed', { attachmentId, status: 'done' });
logger.error('lol_endscreen_extract: failed', { attachmentId, error: err.message });
```

### 실패 추적

- `ExtractionResult.status = FAILED` → UI에서 "자동 추출 실패" 표시
- Graphile Worker의 `permanently_failed_jobs` 조회로 실패 job 추적

---

## 7. 검증 체크리스트

- [ ] Graphile Worker 초기화 성공 (graphile_worker 스키마 생성)
- [ ] `lol_endscreen_extract` job 등록 → 실행 → ExtractionResult DONE
- [ ] Python CLI 단독 실행 테스트 (sample 이미지)
- [ ] OCR 실패 시 retry → 최종 FAILED
- [ ] `cleanup_s3_objects` job → S3 파일 삭제 확인
- [ ] `auto_done_sessions` cron → 3일 경과 세션 DONE 전환
- [ ] API 프로세스 종료 시 Worker graceful shutdown
