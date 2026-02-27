import { ConnectionArgsDto } from '@libs/relay';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import {
  SessionOrderField,
  SessionOrderDirection,
} from '@domains/session/domain/repositories/session.repository.interface';

export class GetSessionsInputDto extends ConnectionArgsDto {
  readonly filter?: {
    readonly contentType?: ContentType;
  };
  readonly orderBy?: {
    readonly field: SessionOrderField;
    readonly direction: SessionOrderDirection;
  }[];

  constructor(props: {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
    filter?: { contentType?: ContentType };
    orderBy?: { field: SessionOrderField; direction: SessionOrderDirection }[];
  }) {
    super({
      first: props.first,
      after: props.after,
      last: props.last,
      before: props.before,
    });
    this.filter = props.filter;
    this.orderBy = props.orderBy;
  }
}
