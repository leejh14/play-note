import { Injectable } from '@nestjs/common';
import { execa } from 'execa';
import path from 'node:path';
import {
  IExtractionService,
  ExtractionInput,
  ExtractionOutput,
} from '@domains/attachment/domain/services/extraction.service.interface';

@Injectable()
export class PythonCliExtractionService implements IExtractionService {
  async execute(input: ExtractionInput): Promise<ExtractionOutput> {
    const scriptPath = path.join(
      process.cwd(),
      'scripts',
      'ocr',
      'extract.py',
    );
    const inputJson = JSON.stringify(input);

    const { stdout } = await execa('python3', [scriptPath, '--input', inputJson], {
      encoding: 'utf8',
    });

    const parsed = JSON.parse(stdout) as ExtractionOutput;
    if ('error' in parsed) {
      throw new Error((parsed as { error: string }).error);
    }
    return parsed;
  }
}
