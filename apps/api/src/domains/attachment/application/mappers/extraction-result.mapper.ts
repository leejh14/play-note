import { ExtractionResult } from '@domains/attachment/domain/aggregates/extraction-result.aggregate';
import { ExtractionResultOutputDto } from '../dto/outputs/extraction-result.output.dto';

export class ExtractionResultMapper {
  static toDto(result: ExtractionResult): ExtractionResultOutputDto {
    return new ExtractionResultOutputDto({
      id: result.id,
      attachmentId: result.attachmentId,
      matchId: result.matchId,
      status: result.status,
      model: result.model,
      result: result.result,
      createdAt: result.createdAt,
    });
  }
}
