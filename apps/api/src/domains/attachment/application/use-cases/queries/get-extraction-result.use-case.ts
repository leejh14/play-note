import { Injectable, Inject } from '@nestjs/common';
import { IExtractionResultRepository } from '@domains/attachment/domain/repositories/extraction-result.repository.interface';
import { EXTRACTION_RESULT_REPOSITORY } from '@domains/attachment/domain/constants';
import { ExtractionResultMapper } from '../../mappers/extraction-result.mapper';
import { AttachmentIdInputDto } from '../../dto/inputs/attachment-id.input.dto';
import { ExtractionResultOutputDto } from '../../dto/outputs/extraction-result.output.dto';

@Injectable()
export class GetExtractionResultUseCase {
  constructor(
    @Inject(EXTRACTION_RESULT_REPOSITORY) private readonly extractionResultRepository: IExtractionResultRepository,
  ) {}

  async execute(
    input: AttachmentIdInputDto,
  ): Promise<ExtractionResultOutputDto | null> {
    const result = await this.extractionResultRepository.findByAttachmentId(
      input.attachmentId,
    );
    return result ? ExtractionResultMapper.toDto(result) : null;
  }
}
