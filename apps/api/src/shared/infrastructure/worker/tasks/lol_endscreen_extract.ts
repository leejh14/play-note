import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { QueryResultRow } from 'pg';
import type { JobHelpers, Task } from 'graphile-worker';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ExtractionFriendDictionaryEntry,
  ExtractionInput,
  ExtractionOptions,
  ExtractionOutput,
  IExtractionService,
} from '@domains/attachment/domain/services/extraction.service.interface';
import { PythonCliExtractionService } from '@domains/attachment/infrastructure/extraction/python-cli-extraction.service';

const ROI_PROFILE = 'LOL_ENDSCREEN_V1';

interface LolEndscreenExtractPayload {
  readonly attachmentId: string;
  readonly matchId: string;
}

interface AttachmentRow extends QueryResultRow {
  readonly id: string;
  readonly matchId: string | null;
  readonly s3Key: string;
  readonly type: string;
}

interface ExtractionResultRow extends QueryResultRow {
  readonly id: string;
  readonly status: string;
}

interface MatchMemberRow extends QueryResultRow {
  readonly friendId: string;
  readonly team: string;
  readonly riotGameName: string | null;
  readonly riotTagLine: string | null;
}

interface DownloadedAttachment {
  readonly filePath: string;
  cleanup(): Promise<void>;
}

export interface LolEndscreenExtractDependencies {
  readonly extractionService: Pick<IExtractionService, 'execute'>;
  downloadAttachmentToFile(input: {
    bucket: string;
    key: string;
    region: string;
  }): Promise<DownloadedAttachment>;
  getBucket(): string;
  getRegion(): string;
  getOptions(): ExtractionOptions;
}

export const buildLolEndscreenExtractTask = (
  overrides: Partial<LolEndscreenExtractDependencies> = {},
): Task => {
  const deps = createDependencies(overrides);

  return async (rawPayload, helpers): Promise<void> => {
    const payload = validatePayload(rawPayload);
    helpers.logger.info(
      `lol_endscreen_extract: started attachmentId=${payload.attachmentId} matchId=${payload.matchId}`,
    );

    const attachment = await getAttachment(helpers, payload);
    if (attachment.type !== 'LOL_RESULT_SCREEN') {
      throw new Error(
        `Attachment ${payload.attachmentId} is not a LOL_RESULT_SCREEN.`,
      );
    }

    const extractionResult = await getExtractionResult(helpers, payload.attachmentId);
    if (extractionResult.status === 'DONE') {
      helpers.logger.info(
        `lol_endscreen_extract: skipped attachmentId=${payload.attachmentId} reason=already_done`,
      );
      return;
    }

    const members = await getMatchMembers(helpers, payload.matchId);
    if (members.length === 0) {
      throw new Error(`Match ${payload.matchId} has no team members.`);
    }

    const bucket = deps.getBucket();
    const region = deps.getRegion();
    const downloaded = await deps.downloadAttachmentToFile({
      bucket,
      key: attachment.s3Key,
      region,
    });

    try {
      const input = buildExtractionInput({
        jobId: String(helpers.job.id),
        attachmentId: payload.attachmentId,
        matchId: payload.matchId,
        imagePath: downloaded.filePath,
        bucket,
        key: attachment.s3Key,
        region,
        members,
        options: deps.getOptions(),
      });

      const output = await deps.extractionService.execute(input);
      await markDone(helpers, payload.attachmentId, output);

      helpers.logger.info(
        `lol_endscreen_extract: completed attachmentId=${payload.attachmentId} status=done`,
      );
    } catch (error) {
      if (isFinalAttempt(helpers.job.attempts, helpers.job.max_attempts)) {
        await markFailed(helpers, payload.attachmentId);
      }

      const message = error instanceof Error ? error.message : String(error);
      helpers.logger.error(
        `lol_endscreen_extract: failed attachmentId=${payload.attachmentId} error=${message}`,
      );
      throw error;
    } finally {
      await downloaded.cleanup();
    }
  };
};

export default buildLolEndscreenExtractTask();

function createDependencies(
  overrides: Partial<LolEndscreenExtractDependencies>,
): LolEndscreenExtractDependencies {
  return {
    extractionService:
      overrides.extractionService ?? new PythonCliExtractionService(),
    downloadAttachmentToFile:
      overrides.downloadAttachmentToFile ?? downloadAttachmentToFile,
    getBucket: overrides.getBucket ?? (() => process.env.S3_BUCKET ?? 'playnote-attachments'),
    getRegion: overrides.getRegion ?? (() => process.env.AWS_REGION ?? 'ap-northeast-2'),
    getOptions: overrides.getOptions ?? resolveExtractionOptions,
  };
}

function validatePayload(rawPayload: unknown): LolEndscreenExtractPayload {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('Invalid lol_endscreen_extract payload.');
  }

  const attachmentId =
    'attachmentId' in rawPayload ? rawPayload.attachmentId : undefined;
  const matchId = 'matchId' in rawPayload ? rawPayload.matchId : undefined;

  if (typeof attachmentId !== 'string' || typeof matchId !== 'string') {
    throw new Error('lol_endscreen_extract payload requires attachmentId and matchId.');
  }

  return { attachmentId, matchId };
}

async function getAttachment(
  helpers: JobHelpers,
  payload: LolEndscreenExtractPayload,
): Promise<AttachmentRow> {
  const result = await helpers.query<AttachmentRow>(
    `
      select
        id,
        match_id as "matchId",
        s3_key as "s3Key",
        type
      from attachment
      where id = $1
        and match_id = $2
      limit 1
    `,
    [payload.attachmentId, payload.matchId],
  );
  const attachment = result.rows[0];

  if (!attachment) {
    throw new Error(
      `Attachment ${payload.attachmentId} for match ${payload.matchId} was not found.`,
    );
  }

  return attachment;
}

async function getExtractionResult(
  helpers: JobHelpers,
  attachmentId: string,
): Promise<ExtractionResultRow> {
  const result = await helpers.query<ExtractionResultRow>(
    `
      select
        id,
        status
      from extraction_result
      where attachment_id = $1
      limit 1
    `,
    [attachmentId],
  );
  const extractionResult = result.rows[0];

  if (!extractionResult) {
    throw new Error(
      `ExtractionResult for attachment ${attachmentId} was not found.`,
    );
  }

  return extractionResult;
}

async function getMatchMembers(
  helpers: JobHelpers,
  matchId: string,
): Promise<MatchMemberRow[]> {
  const result = await helpers.query<MatchMemberRow>(
    `
      select
        mtm.friend_id as "friendId",
        mtm.team,
        f.riot_game_name as "riotGameName",
        f.riot_tag_line as "riotTagLine"
      from match_team_member mtm
      left join friend f on f.id = mtm.friend_id
      where mtm.match_id = $1
      order by mtm.created_at asc
    `,
    [matchId],
  );

  return result.rows;
}

function buildExtractionInput(input: {
  jobId: string;
  attachmentId: string;
  matchId: string;
  imagePath: string;
  bucket: string;
  key: string;
  region: string;
  members: MatchMemberRow[];
  options: ExtractionOptions;
}): ExtractionInput {
  const teamA = input.members
    .filter((member) => member.team === 'A')
    .map((member) => member.friendId);
  const teamB = input.members
    .filter((member) => member.team === 'B')
    .map((member) => member.friendId);

  return {
    jobId: input.jobId,
    attachmentId: input.attachmentId,
    matchId: input.matchId,
    roiProfile: ROI_PROFILE,
    imagePath: input.imagePath,
    s3: {
      bucket: input.bucket,
      key: input.key,
      region: input.region,
    },
    match: {
      teamA,
      teamB,
    },
    friendDictionary: buildFriendDictionary(input.members),
    options: input.options,
  };
}

function buildFriendDictionary(
  members: MatchMemberRow[],
): ExtractionFriendDictionaryEntry[] {
  return members.flatMap((member) => {
    const primary =
      member.riotGameName && member.riotTagLine
        ? [`${member.riotGameName}#${member.riotTagLine}`]
        : [];
    const secondary = member.riotGameName ? [member.riotGameName] : [];

    if (primary.length === 0 && secondary.length === 0) {
      return [];
    }

    return [
      {
        friendId: member.friendId,
        primary,
        secondary,
      },
    ];
  });
}

async function markDone(
  helpers: JobHelpers,
  attachmentId: string,
  output: ExtractionOutput,
): Promise<void> {
  await helpers.query(
    `
      update extraction_result
      set status = $2,
          model = $3,
          result = $4
      where attachment_id = $1
    `,
    [attachmentId, 'DONE', output.model, output.result],
  );
}

async function markFailed(
  helpers: JobHelpers,
  attachmentId: string,
): Promise<void> {
  await helpers.query(
    `
      update extraction_result
      set status = $2
      where attachment_id = $1
    `,
    [attachmentId, 'FAILED'],
  );
}

function isFinalAttempt(attempts: number, maxAttempts: number): boolean {
  return attempts >= maxAttempts;
}

function resolveExtractionOptions(): ExtractionOptions {
  return {
    topK: parseInteger(process.env.OCR_TOP_K, 3),
    minScoreFull: parseNumber(process.env.OCR_MIN_SCORE_FULL, 90),
    minScoreNameOnly: parseNumber(process.env.OCR_MIN_SCORE_NAME_ONLY, 92),
  };
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function downloadAttachmentToFile(input: {
  bucket: string;
  key: string;
  region: string;
}): Promise<DownloadedAttachment> {
  const client = new S3Client({
    region: input.region,
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        }
      : undefined,
  });
  const response = await client.send(
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object ${input.key} returned an empty body.`);
  }

  const tempDir = await mkdtemp(path.join(tmpdir(), 'playnote-worker-ocr-'));
  const filePath = path.join(
    tempDir,
    `attachment${path.extname(input.key) || '.bin'}`,
  );

  try {
    const bytes = await streamToBuffer(response.Body);
    await writeFile(filePath, bytes);

    return {
      filePath,
      cleanup: async () => {
        await rm(tempDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (
    typeof body === 'object' &&
    body !== null &&
    'transformToByteArray' in body &&
    typeof body.transformToByteArray === 'function'
  ) {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (!body || typeof (body as AsyncIterable<unknown>)[Symbol.asyncIterator] !== 'function') {
    throw new Error('Unsupported S3 response body type.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<unknown>) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }

    if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    throw new Error('Unsupported S3 response chunk type.');
  }

  return Buffer.concat(chunks);
}
