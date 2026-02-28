import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ExtractionStatus } from '@domains/attachment/domain/enums/extraction-status.enum';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';
import { JSONScalar } from '@shared/presentation/graphql/scalars/json.scalar';
import { toGlobalId } from '@libs/relay';

@ObjectType('ExtractionResult')
export class ExtractionResult {
  localId!: string;

  @Field(() => ID, { nullable: false })
  get id(): string {
    return toGlobalId('ExtractionResult', this.localId);
  }

  @Field(() => ExtractionStatus, { nullable: false })
  status!: ExtractionStatus;

  @Field(() => String, { nullable: true })
  model!: string | null;

  @Field(() => JSONScalar, { nullable: true })
  result!: Record<string, unknown> | null;

  @Field(() => DateTimeScalar, { nullable: false })
  createdAt!: Date;
}
