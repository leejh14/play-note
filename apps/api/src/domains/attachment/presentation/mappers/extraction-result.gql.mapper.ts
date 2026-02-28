import { ExtractionResultOutputDto } from '@domains/attachment/application/dto/outputs/extraction-result.output.dto';
import { ExtractionResult } from '@domains/attachment/presentation/graphql/types/extraction-result.gql';

export class ExtractionResultGqlMapper {
  static toGql(dto: ExtractionResultOutputDto): ExtractionResult {
    const gql = new ExtractionResult();
    gql.localId = dto.id;
    gql.status = dto.status;
    gql.model = dto.model;
    gql.result = dto.result;
    gql.createdAt = dto.createdAt;
    return gql;
  }
}
