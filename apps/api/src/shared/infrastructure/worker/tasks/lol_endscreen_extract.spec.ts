jest.mock('@shared/infrastructure/process/execa.client', () => ({
  runExeca: jest.fn(),
}));

import type { JobHelpers } from 'graphile-worker';
import { buildLolEndscreenExtractTask } from './lol_endscreen_extract';

describe('lol_endscreen_extract task', () => {
  it('marks extraction results as DONE when OCR succeeds', async () => {
    const cleanup = jest.fn().mockResolvedValue(undefined);
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'attachment-1',
            matchId: 'match-1',
            s3Key: 'attachments/match-1/image.png',
            type: 'LOL_RESULT_SCREEN',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'result-1', status: 'PENDING' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            friendId: 'friend-a1',
            team: 'A',
            riotGameName: 'junho',
            riotTagLine: 'kr1',
          },
          {
            friendId: 'friend-a2',
            team: 'A',
            riotGameName: 'doran',
            riotTagLine: 'kr1',
          },
          {
            friendId: 'friend-a3',
            team: 'A',
            riotGameName: 'faker',
            riotTagLine: 'kr1',
          },
          {
            friendId: 'friend-b1',
            team: 'B',
            riotGameName: 'kanavi',
            riotTagLine: 'kr1',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });
    const execute = jest.fn().mockResolvedValue({
      winnerSide: 'blue',
      teamASide: 'blue',
      confidence: { teamASide: 1, winner: 0.87 },
      model: 'paddleocr-lol-endscreen-v1',
      result: {
        status: 'done',
        teamASideEvidence: { countABlue: 3, countARed: 0 },
      },
    });
    const task = buildLolEndscreenExtractTask({
      extractionService: { execute },
      downloadAttachmentToFile: jest.fn().mockResolvedValue({
        filePath: '/tmp/ocr-image.png',
        cleanup,
      }),
      getBucket: () => 'playnote-attachments',
      getRegion: () => 'ap-northeast-2',
      getOptions: () => ({
        topK: 3,
        minScoreFull: 90,
        minScoreNameOnly: 92,
      }),
    });
    const helpers = createHelpers(query, {
      id: 'job-1',
      attempts: 1,
      max_attempts: 3,
    });

    await task({ attachmentId: 'attachment-1', matchId: 'match-1' }, helpers);

    expect(execute).toHaveBeenCalledWith({
      jobId: 'job-1',
      attachmentId: 'attachment-1',
      matchId: 'match-1',
      roiProfile: 'LOL_ENDSCREEN_V1',
      imagePath: '/tmp/ocr-image.png',
      s3: {
        bucket: 'playnote-attachments',
        key: 'attachments/match-1/image.png',
        region: 'ap-northeast-2',
      },
      match: {
        teamA: ['friend-a1', 'friend-a2', 'friend-a3'],
        teamB: ['friend-b1'],
      },
      friendDictionary: [
        {
          friendId: 'friend-a1',
          primary: ['junho#kr1'],
          secondary: ['junho'],
        },
        {
          friendId: 'friend-a2',
          primary: ['doran#kr1'],
          secondary: ['doran'],
        },
        {
          friendId: 'friend-a3',
          primary: ['faker#kr1'],
          secondary: ['faker'],
        },
        {
          friendId: 'friend-b1',
          primary: ['kanavi#kr1'],
          secondary: ['kanavi'],
        },
      ],
      options: {
        topK: 3,
        minScoreFull: 90,
        minScoreNameOnly: 92,
      },
    });
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('update extraction_result'),
      [
        'attachment-1',
        'DONE',
        'paddleocr-lol-endscreen-v1',
        {
          status: 'done',
          teamASideEvidence: { countABlue: 3, countARed: 0 },
        },
      ],
    );
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('marks extraction results as FAILED on the final retry', async () => {
    const cleanup = jest.fn().mockResolvedValue(undefined);
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'attachment-1',
            matchId: 'match-1',
            s3Key: 'attachments/match-1/image.png',
            type: 'LOL_RESULT_SCREEN',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'result-1', status: 'PENDING' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            friendId: 'friend-a1',
            team: 'A',
            riotGameName: 'junho',
            riotTagLine: 'kr1',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });
    const execute = jest.fn().mockRejectedValue(new Error('OCR exploded'));
    const task = buildLolEndscreenExtractTask({
      extractionService: { execute },
      downloadAttachmentToFile: jest.fn().mockResolvedValue({
        filePath: '/tmp/ocr-image.png',
        cleanup,
      }),
      getBucket: () => 'playnote-attachments',
      getRegion: () => 'ap-northeast-2',
      getOptions: () => ({
        topK: 3,
        minScoreFull: 90,
        minScoreNameOnly: 92,
      }),
    });
    const helpers = createHelpers(query, {
      id: 'job-2',
      attempts: 3,
      max_attempts: 3,
    });

    await expect(
      task({ attachmentId: 'attachment-1', matchId: 'match-1' }, helpers),
    ).rejects.toThrow('OCR exploded');

    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('update extraction_result'),
      ['attachment-1', 'FAILED'],
    );
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('does not mark FAILED before the final retry', async () => {
    const cleanup = jest.fn().mockResolvedValue(undefined);
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'attachment-1',
            matchId: 'match-1',
            s3Key: 'attachments/match-1/image.png',
            type: 'LOL_RESULT_SCREEN',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'result-1', status: 'PENDING' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            friendId: 'friend-a1',
            team: 'A',
            riotGameName: 'junho',
            riotTagLine: 'kr1',
          },
        ],
      });
    const execute = jest.fn().mockRejectedValue(new Error('retry me'));
    const task = buildLolEndscreenExtractTask({
      extractionService: { execute },
      downloadAttachmentToFile: jest.fn().mockResolvedValue({
        filePath: '/tmp/ocr-image.png',
        cleanup,
      }),
      getBucket: () => 'playnote-attachments',
      getRegion: () => 'ap-northeast-2',
      getOptions: () => ({
        topK: 3,
        minScoreFull: 90,
        minScoreNameOnly: 92,
      }),
    });
    const helpers = createHelpers(query, {
      id: 'job-3',
      attempts: 1,
      max_attempts: 3,
    });

    await expect(
      task({ attachmentId: 'attachment-1', matchId: 'match-1' }, helpers),
    ).rejects.toThrow('retry me');

    expect(query).toHaveBeenCalledTimes(3);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

function createHelpers(
  query: jest.Mock,
  job: { id: string; attempts: number; max_attempts: number },
) {
  return {
    query,
    job,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as JobHelpers;
}
