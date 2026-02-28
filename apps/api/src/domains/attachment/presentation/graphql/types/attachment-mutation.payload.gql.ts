import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RelayMutationPayload, toGlobalId } from '@libs/relay';
import { Attachment } from './attachment.gql';
import { PresignedUpload } from './presigned-upload.gql';

@ObjectType('CreatePresignedUploadPayload')
export class CreatePresignedUploadPayload extends RelayMutationPayload {
  @Field(() => PresignedUpload, { nullable: false })
  upload!: PresignedUpload;
}

@ObjectType('CreatePresignedUploadsPayload')
export class CreatePresignedUploadsPayload extends RelayMutationPayload {
  @Field(() => [PresignedUpload], { nullable: false })
  uploads!: PresignedUpload[];
}

@ObjectType('CompleteUploadPayload')
export class CompleteUploadPayload extends RelayMutationPayload {
  attachmentId!: string;

  @Field(() => Attachment, { nullable: true })
  attachment?: Attachment;
}

@ObjectType('CompleteUploadsPayload')
export class CompleteUploadsPayload extends RelayMutationPayload {
  attachmentIds!: string[];

  @Field(() => [Attachment], { nullable: false })
  attachments!: Attachment[];
}

@ObjectType('DeleteAttachmentPayload')
export class DeleteAttachmentPayload extends RelayMutationPayload {
  deletedAttachmentLocalId!: string;

  @Field(() => ID, { nullable: false })
  get deletedAttachmentId(): string {
    return toGlobalId('Attachment', this.deletedAttachmentLocalId);
  }
}
