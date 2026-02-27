import { BaseException } from '@shared/exceptions/base.exception';
import { SESSION_ERROR_CODES } from '../constants';

export class SessionNotFoundException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Session not found',
      errorCode: SESSION_ERROR_CODES.SESSION_NOT_FOUND,
      statusCode: 404,
      cause: props?.cause,
    });
  }
}
