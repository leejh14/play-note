import { BaseException } from '@shared/exceptions/base.exception';
import { MATCH_ERROR_CODES } from '../constants';

export class MatchNotFoundException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Match not found',
      errorCode: MATCH_ERROR_CODES.MATCH_NOT_FOUND,
      statusCode: 404,
      cause: props?.cause,
    });
  }
}
