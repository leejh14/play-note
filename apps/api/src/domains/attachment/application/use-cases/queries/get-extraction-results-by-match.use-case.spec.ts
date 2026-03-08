import { ExtractionResult } from '@domains/attachment/domain/aggregates/extraction-result.aggregate';
import { ExtractionStatus } from '@domains/attachment/domain/enums/extraction-status.enum';
import type { IExtractionResultRepository } from '@domains/attachment/domain/repositories/extraction-result.repository.interface';
import { GetExtractionResultsByMatchUseCase } from './get-extraction-results-by-match.use-case';

describe('GetExtractionResultsByMatchUseCase', () => {
  it('returns extraction results sorted by createdAt descending', async () => {
    const repository: jest.Mocked<IExtractionResultRepository> = {
      findById: jest.fn(),
      findByAttachmentId: jest.fn(),
      findByMatchId: jest.fn().mockResolvedValue([
        buildExtractionResult({
          id: 'older',
          createdAt: new Date('2026-03-08T09:00:00.000Z'),
        }),
        buildExtractionResult({
          id: 'newer',
          createdAt: new Date('2026-03-08T10:00:00.000Z'),
        }),
      ]),
      save: jest.fn(),
    };
    const useCase = new GetExtractionResultsByMatchUseCase(repository);

    const results = await useCase.execute({ matchId: 'match-1' });

    expect(results.map((result) => result.id)).toEqual(['newer', 'older']);
  });
});

function buildExtractionResult(input: {
  id: string;
  createdAt: Date;
}): ExtractionResult {
  return ExtractionResult.reconstitute({
    id: input.id,
    attachmentId: 'attachment-1',
    matchId: 'match-1',
    status: ExtractionStatus.DONE,
    model: 'paddleocr-lol-endscreen-v1',
    result: {
      winnerSide: 'unknown',
      teamASide: 'blue',
    },
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
