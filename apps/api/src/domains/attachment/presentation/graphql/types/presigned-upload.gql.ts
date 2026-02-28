import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('PresignedUpload')
export class PresignedUpload {
  @Field(() => String, { nullable: false })
  uploadId!: string;

  @Field(() => String, { nullable: false })
  presignedUrl!: string;
}
