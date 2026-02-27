import { ExtractionStatus } from '@domains/attachment/domain/enums/extraction-status.enum';

export class ExtractionResultOutputDto {
  readonly id: string;
  readonly attachmentId: string;
  readonly matchId: string;
  readonly status: ExtractionStatus;
  readonly model: string | null;
  readonly result: Record<string, unknown> | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    attachmentId: string;
    matchId: string;
    status: ExtractionStatus;
    model: string | null;
    result: Record<string, unknown> | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.attachmentId = props.attachmentId;
    this.matchId = props.matchId;
    this.status = props.status;
    this.model = props.model;
    this.result = props.result;
    this.createdAt = props.createdAt;
  }
}
