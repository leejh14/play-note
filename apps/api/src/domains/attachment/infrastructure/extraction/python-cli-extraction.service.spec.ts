import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import {
  ExtractionInput,
  ExtractionOutput,
} from '@domains/attachment/domain/services/extraction.service.interface';
import { runExeca } from '@shared/infrastructure/process/execa.client';
import { PythonCliExtractionService } from './python-cli-extraction.service';

jest.mock('@shared/infrastructure/process/execa.client', () => ({
  runExeca: jest.fn(),
}));

const mockedRunExeca = runExeca as unknown as jest.Mock;

describe('PythonCliExtractionService', () => {
  const service = new PythonCliExtractionService();

  beforeEach(() => {
    mockedRunExeca.mockReset();
  });

  it('writes a temp input file and parses the CLI output', async () => {
    const input: ExtractionInput = {
      jobId: 'job-1',
      attachmentId: 'attachment-1',
      matchId: 'match-1',
      imagePath: '/tmp/input.png',
      roiProfile: 'LOL_ENDSCREEN_V1',
      match: {
        teamA: ['friend-a1', 'friend-a2', 'friend-a3'],
        teamB: ['friend-b1', 'friend-b2', 'friend-b3'],
      },
      friendDictionary: [
        {
          friendId: 'friend-a1',
          primary: ['junho#kr1'],
          secondary: ['junho'],
        },
      ],
      options: {
        topK: 3,
        minScoreFull: 90,
        minScoreNameOnly: 92,
      },
    };
    const output: ExtractionOutput = {
      winnerSide: 'blue',
      teamASide: 'blue',
      confidence: {
        teamASide: 1,
        winner: 0.84,
      },
      model: 'paddleocr-lol-endscreen-v1',
      result: {
        status: 'done',
      },
    };

    let tempInputPath = '';
    mockedRunExeca.mockImplementation(async (_file: string, args: string[]) => {
      tempInputPath = String(args[2]);
      const payload = JSON.parse(await readFile(tempInputPath, 'utf8'));

      expect(payload).toEqual(input);

      return createExecaResult({
        stdout: JSON.stringify(output),
      });
    });

    await expect(service.execute(input)).resolves.toEqual(output);
    expect(existsSync(tempInputPath)).toBe(false);
  });

  it('surfaces Python CLI errors and still removes the temp file', async () => {
    const input: ExtractionInput = {
      jobId: 'job-2',
      match: {
        teamA: ['friend-a1'],
        teamB: ['friend-b1'],
      },
      friendDictionary: [],
    };

    let tempInputPath = '';
    mockedRunExeca.mockImplementation(async (_file: string, args: string[]) => {
      tempInputPath = String(args[2]);

      return createExecaResult({
        failed: true,
        exitCode: 1,
        stdout: JSON.stringify({ error: 'OCR failed' }),
        message: 'Command failed with exit code 1',
      });
    });

    await expect(service.execute(input)).rejects.toThrow('OCR failed');
    expect(existsSync(tempInputPath)).toBe(false);
  });
});

function createExecaResult(overrides: Record<string, unknown>) {
  return {
    stdout: '',
    stderr: '',
    all: undefined,
    stdio: [undefined, '', ''],
    ipcOutput: [],
    pipedFrom: [],
    command: 'python3',
    escapedCommand: 'python3',
    cwd: process.cwd(),
    durationMs: 1,
    failed: false,
    timedOut: false,
    isCanceled: false,
    isGracefullyCanceled: false,
    isMaxBuffer: false,
    isTerminated: false,
    isForcefullyTerminated: false,
    exitCode: 0,
    ...overrides,
  } as unknown;
}
