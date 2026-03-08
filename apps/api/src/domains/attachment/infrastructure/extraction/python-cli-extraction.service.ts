import { Injectable } from '@nestjs/common';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  IExtractionService,
  ExtractionInput,
  ExtractionOutput,
} from '@domains/attachment/domain/services/extraction.service.interface';
import { runExeca } from '@shared/infrastructure/process/execa.client';

const DEFAULT_TIMEOUT_MS = 60_000;

@Injectable()
export class PythonCliExtractionService implements IExtractionService {
  async execute(input: ExtractionInput): Promise<ExtractionOutput> {
    const scriptPath = path.join(
      process.cwd(),
      'scripts',
      'ocr',
      'extract.py',
    );
    const tempDir = await mkdtemp(path.join(tmpdir(), 'playnote-ocr-'));
    const inputPath = path.join(tempDir, 'input.json');
    const timeoutMs = this.resolveTimeoutMs();

    try {
      await writeFile(inputPath, JSON.stringify(input), 'utf8');

      const result = await runExeca('python3', [scriptPath, '--input', inputPath], {
        encoding: 'utf8',
        reject: false,
        timeout: timeoutMs,
      });
      const stdout = this.ensureText(result.stdout);
      const stderr = this.ensureText(result.stderr);

      if (result.failed) {
        throw new Error(
          this.extractProcessErrorMessage(stdout, stderr, result.message),
        );
      }

      const parsed = this.parseOutput(stdout);
      if ('error' in parsed) {
        throw new Error(parsed.error);
      }

      return parsed;
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private parseOutput(stdout: string): ExtractionOutput | { error: string } {
    try {
      return JSON.parse(stdout) as ExtractionOutput | { error: string };
    } catch {
      throw new Error('Python OCR CLI returned invalid JSON.');
    }
  }

  private extractProcessErrorMessage(
    stdout: string,
    stderr: string,
    fallbackMessage: string | undefined,
  ): string {
    const candidate = stdout.trim() || stderr.trim();
    if (!candidate) {
      return fallbackMessage ?? 'Python OCR CLI execution failed.';
    }

    try {
      const parsed = JSON.parse(candidate) as { error?: string };
      if (parsed.error) {
        return parsed.error;
      }
    } catch {
      return candidate;
    }

    return fallbackMessage ?? candidate;
  }

  private resolveTimeoutMs(): number {
    const parsed = Number(process.env.OCR_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
  }

  private ensureText(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === undefined || value === null) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    if (value instanceof Uint8Array) {
      return Buffer.from(value).toString('utf8');
    }
    return String(value);
  }
}
