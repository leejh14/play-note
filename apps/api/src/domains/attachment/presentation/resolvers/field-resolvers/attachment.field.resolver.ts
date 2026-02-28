import {
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { S3StorageService } from '@shared/infrastructure/storage/s3-storage.service';
import { GetExtractionResultUseCase } from '@domains/attachment/application/use-cases/queries/get-extraction-result.use-case';
import { AttachmentIdInputDto } from '@domains/attachment/application/dto/inputs/attachment-id.input.dto';
import { Attachment } from '@domains/attachment/presentation/graphql/types/attachment.gql';
import { ExtractionResult } from '@domains/attachment/presentation/graphql/types/extraction-result.gql';
import { ExtractionResultGqlMapper } from '@domains/attachment/presentation/mappers/extraction-result.gql.mapper';

@Resolver(() => Attachment)
export class AttachmentFieldResolver {
  constructor(
    private readonly getExtractionResultUseCase: GetExtractionResultUseCase,
    private readonly s3StorageService: S3StorageService,
  ) {}

  @ResolveField(() => String, { nullable: false })
  async url(
    @Parent() attachment: Attachment,
    @CurrentAuth() auth: AuthContext,
  ): Promise<string> {
    this.assertSessionAccess(auth, attachment.sessionId);
    return this.s3StorageService.getSignedUrl(attachment.s3Key);
  }

  @ResolveField(() => ExtractionResult, { nullable: true })
  async extractionResult(
    @Parent() attachment: Attachment,
    @CurrentAuth() auth: AuthContext,
  ): Promise<ExtractionResult | null> {
    this.assertSessionAccess(auth, attachment.sessionId);
    const result = await this.getExtractionResultUseCase.execute(
      new AttachmentIdInputDto({
        attachmentId: attachment.localId,
      }),
    );
    return result ? ExtractionResultGqlMapper.toGql(result) : null;
  }

  private assertSessionAccess(auth: AuthContext, sessionId: string): void {
    if (auth.sessionId !== sessionId) {
      throw new ForbiddenException({
        message: 'Access denied for session',
      });
    }
  }
}
