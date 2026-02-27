import { BaseException } from '@shared/exceptions/base.exception';
import { SESSION_ERROR_CODES } from '../constants';

export class InvalidStateTransitionException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Invalid state transition',
      errorCode: SESSION_ERROR_CODES.INVALID_STATE_TRANSITION,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
