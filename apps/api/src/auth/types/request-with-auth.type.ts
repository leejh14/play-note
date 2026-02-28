import { IncomingHttpHeaders } from 'http';
import { AuthContext } from './auth-context.type';

export interface RequestWithAuth {
  readonly headers: IncomingHttpHeaders;
  auth?: AuthContext;
}
