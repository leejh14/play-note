import { ContentType } from '@domains/session/domain/enums/content-type.enum';

export class SessionPreviewOutputDto {
  readonly contentType: ContentType;
  readonly title: string | null;
  readonly startsAt: Date;

  constructor(props: {
    contentType: ContentType;
    title: string | null;
    startsAt: Date;
  }) {
    this.contentType = props.contentType;
    this.title = props.title;
    this.startsAt = props.startsAt;
  }
}
