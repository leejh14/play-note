import { ConnectionArgsDto, ConnectionDto } from '@libs/relay';
import { Session } from '../aggregates/session.aggregate';
import { ContentType } from '../enums/content-type.enum';

export type SessionOrderField =
  | 'DATE_PROXIMITY'
  | 'STARTS_AT'
  | 'STATUS_PRIORITY'
  | 'CREATED_AT';

export type SessionOrderDirection = 'ASC' | 'DESC';

export interface SessionOrder {
  readonly field: SessionOrderField;
  readonly direction: SessionOrderDirection;
}

export interface FindAllSessionArgs extends ConnectionArgsDto {
  readonly filter?: {
    readonly contentType?: ContentType;
  };
  readonly orderBy?: SessionOrder[];
}

export interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findAll(args: FindAllSessionArgs): Promise<ConnectionDto<Session>>;
  save(session: Session): Promise<void>;
  delete(session: Session): Promise<void>;
}
