import { BaseException } from '@shared/exceptions/base.exception';
import { FRIEND_ERROR_CODES } from '../constants';

export class FriendNotArchivedException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Friend is not archived',
      errorCode: FRIEND_ERROR_CODES.FRIEND_NOT_ARCHIVED,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
