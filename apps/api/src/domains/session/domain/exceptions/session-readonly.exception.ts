import { BaseException } from '@shared/exceptions/base.exception';
import { SESSION_ERROR_CODES } from '../constants';

export class SessionReadonlyException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Session is readonly (done status)',
      errorCode: SESSION_ERROR_CODES.SESSION_READONLY,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
