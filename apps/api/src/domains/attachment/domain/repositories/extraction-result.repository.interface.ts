import { ExtractionResult } from '../aggregates/extraction-result.aggregate';

export interface IExtractionResultRepository {
  findById(id: string): Promise<ExtractionResult | null>;
  findByAttachmentId(attachmentId: string): Promise<ExtractionResult | null>;
  findByMatchId(matchId: string): Promise<ExtractionResult[]>;
  save(result: ExtractionResult): Promise<void>;
}
