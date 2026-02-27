import { BaseException } from '@shared/exceptions/base.exception';
import { MATCH_ERROR_CODES } from '../constants';

export class InvalidMatchStateException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Invalid match state',
      errorCode: MATCH_ERROR_CODES.INVALID_MATCH_STATE,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
