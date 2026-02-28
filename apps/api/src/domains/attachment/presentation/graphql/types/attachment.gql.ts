import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';
import { ExtractionResult } from './extraction-result.gql';

@ObjectType('Attachment')
export class Attachment {
  @Field(() => ID, { nullable: false })
  id!: string;

  localId!: string;
  sessionId!: string;
  matchId!: string | null;
  s3Key!: string;

  @Field(() => AttachmentScope, { nullable: false })
  scope!: AttachmentScope;

  @Field(() => AttachmentType, { nullable: false })
  type!: AttachmentType;

  @Field(() => String, { nullable: false })
  url!: string;

  @Field(() => String, { nullable: false })
  contentType!: string;

  @Field(() => Int, { nullable: false })
  size!: number;

  @Field(() => Int, { nullable: true })
  width!: number | null;

  @Field(() => Int, { nullable: true })
  height!: number | null;

  @Field(() => String, { nullable: true })
  originalFileName!: string | null;

  @Field(() => ExtractionResult, { nullable: true })
  extractionResult?: ExtractionResult | null;

  @Field(() => DateTimeScalar, { nullable: false })
  createdAt!: Date;
}
