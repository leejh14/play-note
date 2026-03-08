import { Inject, Injectable } from '@nestjs/common';
import { IExtractionResultRepository } from '@domains/attachment/domain/repositories/extraction-result.repository.interface';
import { EXTRACTION_RESULT_REPOSITORY } from '@domains/attachment/domain/constants';
import { ExtractionResultOutputDto } from '../../dto/outputs/extraction-result.output.dto';
import { ExtractionResultMapper } from '../../mappers/extraction-result.mapper';

@Injectable()
export class GetExtractionResultsByMatchUseCase {
  constructor(
    @Inject(EXTRACTION_RESULT_REPOSITORY)
    private readonly extractionResultRepository: IExtractionResultRepository,
  ) {}

  async execute(input: { matchId: string }): Promise<ExtractionResultOutputDto[]> {
    const results = await this.extractionResultRepository.findByMatchId(
      input.matchId,
    );
    return results
      .slice()
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime(),
      )
      .map((result) => ExtractionResultMapper.toDto(result));
  }
}
