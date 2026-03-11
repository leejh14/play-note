import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';

export class SessionOutputDto {
  readonly id: string;
  readonly contentType: ContentType;
  readonly title: string | null;
  readonly startsAt: Date;
  readonly status: SessionStatus;
  readonly isStructureLocked: boolean;
  readonly attendingCount: number;
  readonly matchCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    contentType: ContentType;
    title: string | null;
    startsAt: Date;
    status: SessionStatus;
    isStructureLocked: boolean;
    attendingCount: number;
    matchCount: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.contentType = props.contentType;
    this.title = props.title;
    this.startsAt = props.startsAt;
    this.status = props.status;
    this.isStructureLocked = props.isStructureLocked;
    this.attendingCount = props.attendingCount;
    this.matchCount = props.matchCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
