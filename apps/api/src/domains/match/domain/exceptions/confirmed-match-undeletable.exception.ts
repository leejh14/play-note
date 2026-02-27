import { BaseException } from '@shared/exceptions/base.exception';
import { MATCH_ERROR_CODES } from '../constants';

export class ConfirmedMatchUndeletableException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Confirmed match cannot be deleted',
      errorCode: MATCH_ERROR_CODES.CONFIRMED_MATCH_UNDELETABLE,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
