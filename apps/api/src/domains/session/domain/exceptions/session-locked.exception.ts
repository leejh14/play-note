import { BaseException } from '@shared/exceptions/base.exception';
import { SESSION_ERROR_CODES } from '../constants';

export class SessionLockedException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Session structure is locked',
      errorCode: SESSION_ERROR_CODES.SESSION_LOCKED,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
