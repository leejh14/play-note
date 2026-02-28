import {
  Args,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { assertGlobalIdType } from '@libs/relay';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { CreatePresignedUploadUseCase } from '@domains/attachment/application/use-cases/commands/create-presigned-upload.use-case';
import { CreatePresignedUploadsUseCase } from '@domains/attachment/application/use-cases/commands/create-presigned-uploads.use-case';
import { CompleteUploadUseCase } from '@domains/attachment/application/use-cases/commands/complete-upload.use-case';
import { CompleteUploadsUseCase } from '@domains/attachment/application/use-cases/commands/complete-uploads.use-case';
import { DeleteAttachmentUseCase } from '@domains/attachment/application/use-cases/commands/delete-attachment.use-case';
import { GetAttachmentUseCase } from '@domains/attachment/application/use-cases/queries/get-attachment.use-case';
import { GetMatchUseCase } from '@domains/match/application/use-cases/queries/get-match.use-case';
import { CreatePresignedUploadInputDto } from '@domains/attachment/application/dto/inputs/create-presigned-upload.input.dto';
import {
  CreatePresignedUploadItemDto,
  CreatePresignedUploadsInputDto,
} from '@domains/attachment/application/dto/inputs/create-presigned-uploads.input.dto';
import { CompleteUploadInputDto } from '@domains/attachment/application/dto/inputs/complete-upload.input.dto';
import { CompleteUploadsInputDto } from '@domains/attachment/application/dto/inputs/complete-uploads.input.dto';
import { AttachmentIdInputDto } from '@domains/attachment/application/dto/inputs/attachment-id.input.dto';
import { MatchIdInputDto } from '@domains/match/application/dto/inputs/match-id.input.dto';
import { PresignedUpload } from '@domains/attachment/presentation/graphql/types/presigned-upload.gql';
import {
  CompleteUploadPayload,
  CompleteUploadsPayload,
  CreatePresignedUploadPayload,
  CreatePresignedUploadsPayload,
  DeleteAttachmentPayload,
} from '@domains/attachment/presentation/graphql/types/attachment-mutation.payload.gql';
import { CreatePresignedUploadInput } from '@domains/attachment/presentation/graphql/inputs/create-presigned-upload.input.gql';
import { CreatePresignedUploadsInput } from '@domains/attachment/presentation/graphql/inputs/create-presigned-uploads.input.gql';
import { CompleteUploadInput } from '@domains/attachment/presentation/graphql/inputs/complete-upload.input.gql';
import { CompleteUploadsInput } from '@domains/attachment/presentation/graphql/inputs/complete-uploads.input.gql';
import { DeleteAttachmentInput } from '@domains/attachment/presentation/graphql/inputs/delete-attachment.input.gql';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentGqlMapper } from '@domains/attachment/presentation/mappers/attachment.gql.mapper';

@Resolver()
export class AttachmentMutationResolver {
  constructor(
    private readonly createPresignedUploadUseCase: CreatePresignedUploadUseCase,
    private readonly createPresignedUploadsUseCase: CreatePresignedUploadsUseCase,
    private readonly completeUploadUseCase: CompleteUploadUseCase,
    private readonly completeUploadsUseCase: CompleteUploadsUseCase,
    private readonly deleteAttachmentUseCase: DeleteAttachmentUseCase,
    private readonly getAttachmentUseCase: GetAttachmentUseCase,
    private readonly getMatchUseCase: GetMatchUseCase,
  ) {}

  @Mutation(() => CreatePresignedUploadPayload, { nullable: false })
  async createPresignedUpload(
    @Args('input', { type: () => CreatePresignedUploadInput })
    input: CreatePresignedUploadInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<CreatePresignedUploadPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const matchId = await this.decodeAndValidateMatchId({
      matchId: input.matchId,
      sessionId,
      scope: input.scope,
    });

    const output = await this.createPresignedUploadUseCase.execute(
      new CreatePresignedUploadInputDto({
        sessionId,
        matchId,
        scope: input.scope,
        type: input.type,
        contentType: input.contentType,
        originalFileName: input.originalFileName,
      }),
    );

    const upload = new PresignedUpload();
    upload.uploadId = output.uploadId;
    upload.presignedUrl = output.presignedUrl;
    return Object.assign(new CreatePresignedUploadPayload(), {
      clientMutationId: input.clientMutationId,
      upload,
    });
  }

  @Mutation(() => CreatePresignedUploadsPayload, { nullable: false })
  async createPresignedUploads(
    @Args('input', { type: () => CreatePresignedUploadsInput })
    input: CreatePresignedUploadsInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<CreatePresignedUploadsPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);

    const files: CreatePresignedUploadItemDto[] = [];
    for (const file of input.files) {
      const matchId = await this.decodeAndValidateMatchId({
        matchId: file.matchId,
        sessionId,
        scope: file.scope,
      });
      files.push(
        new CreatePresignedUploadItemDto({
          matchId,
          scope: file.scope,
          type: file.type,
          contentType: file.contentType,
          originalFileName: file.originalFileName,
        }),
      );
    }

    const output = await this.createPresignedUploadsUseCase.execute(
      new CreatePresignedUploadsInputDto({
        sessionId,
        files,
      }),
    );

    const uploads = output.uploads.map((item) => {
      const upload = new PresignedUpload();
      upload.uploadId = item.uploadId;
      upload.presignedUrl = item.presignedUrl;
      return upload;
    });
    return Object.assign(new CreatePresignedUploadsPayload(), {
      clientMutationId: input.clientMutationId,
      uploads,
    });
  }

  @Mutation(() => CompleteUploadPayload, { nullable: false })
  async completeUpload(
    @Args('input', { type: () => CompleteUploadInput })
    input: CompleteUploadInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<CompleteUploadPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const matchId = await this.decodeAndValidateMatchId({
      matchId: input.matchId,
      sessionId,
      scope: input.scope,
    });

    const output = await this.completeUploadUseCase.execute(
      new CompleteUploadInputDto({
        uploadId: input.uploadId,
        sessionId,
        matchId,
        scope: input.scope,
        type: input.type,
        contentType: input.contentType,
        size: input.size,
        width: input.width,
        height: input.height,
        originalFileName: input.originalFileName,
      }),
    );
    const attachment = await this.getAttachmentUseCase.execute(
      new AttachmentIdInputDto({
        attachmentId: output.id,
      }),
    );
    this.assertSessionAccess(auth, attachment.sessionId);

    return Object.assign(new CompleteUploadPayload(), {
      clientMutationId: input.clientMutationId,
      attachmentId: output.id,
      attachment: AttachmentGqlMapper.toGql(attachment),
    });
  }

  @Mutation(() => CompleteUploadsPayload, { nullable: false })
  async completeUploads(
    @Args('input', { type: () => CompleteUploadsInput })
    input: CompleteUploadsInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<CompleteUploadsPayload> {
    const files: CompleteUploadInputDto[] = [];
    for (const file of input.files) {
      const sessionId = this.decodeGlobalId(file.sessionId, 'Session');
      this.assertSessionAccess(auth, sessionId);
      const matchId = await this.decodeAndValidateMatchId({
        matchId: file.matchId,
        sessionId,
        scope: file.scope,
      });
      files.push(
        new CompleteUploadInputDto({
          uploadId: file.uploadId,
          sessionId,
          matchId,
          scope: file.scope,
          type: file.type,
          contentType: file.contentType,
          size: file.size,
          width: file.width,
          height: file.height,
          originalFileName: file.originalFileName,
        }),
      );
    }

    const output = await this.completeUploadsUseCase.execute(
      new CompleteUploadsInputDto({
        files,
      }),
    );

    return Object.assign(new CompleteUploadsPayload(), {
      clientMutationId: input.clientMutationId,
      attachmentIds: output.map((attachment) => attachment.id),
      attachments: output.map((attachment) => AttachmentGqlMapper.toGql(attachment)),
    });
  }

  @Mutation(() => DeleteAttachmentPayload, { nullable: false })
  async deleteAttachment(
    @Args('input', { type: () => DeleteAttachmentInput })
    input: DeleteAttachmentInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<DeleteAttachmentPayload> {
    const attachmentId = this.decodeGlobalId(input.attachmentId, 'Attachment');
    const attachment = await this.getAttachmentUseCase.execute(
      new AttachmentIdInputDto({
        attachmentId,
      }),
    );
    this.assertSessionAccess(auth, attachment.sessionId);

    await this.deleteAttachmentUseCase.execute(
      new AttachmentIdInputDto({
        attachmentId,
      }),
    );

    return Object.assign(new DeleteAttachmentPayload(), {
      clientMutationId: input.clientMutationId,
      deletedAttachmentLocalId: attachmentId,
    });
  }

  private assertSessionAccess(auth: AuthContext, sessionId: string): void {
    if (auth.sessionId !== sessionId) {
      throw new ForbiddenException({
        message: 'Access denied for session',
      });
    }
  }

  private decodeGlobalId(globalId: string, expectedType: string): string {
    try {
      return assertGlobalIdType(globalId, expectedType);
    } catch {
      throw new ValidationException({
        message: `Invalid ${expectedType} id`,
      });
    }
  }

  private async decodeAndValidateMatchId(input: {
    matchId?: string;
    sessionId: string;
    scope: AttachmentScope;
  }): Promise<string | null> {
    if (input.scope === AttachmentScope.MATCH && !input.matchId) {
      throw new ValidationException({
        message: 'matchId is required when scope is MATCH',
      });
    }
    if (input.scope === AttachmentScope.SESSION && input.matchId) {
      throw new ValidationException({
        message: 'matchId must be null when scope is SESSION',
      });
    }
    if (!input.matchId) {
      return null;
    }

    const matchId = this.decodeGlobalId(input.matchId, 'Match');
    const match = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId,
      }),
    );
    if (match.sessionId !== input.sessionId) {
      throw new ForbiddenException({
        message: 'Match does not belong to the session',
      });
    }
    return matchId;
  }
}
