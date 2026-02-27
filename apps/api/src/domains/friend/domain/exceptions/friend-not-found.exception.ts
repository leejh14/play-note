import { BaseException } from '@shared/exceptions/base.exception';
import { FRIEND_ERROR_CODES } from '../constants';

export class FriendNotFoundException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Friend not found',
      errorCode: FRIEND_ERROR_CODES.FRIEND_NOT_FOUND,
      statusCode: 404,
      cause: props?.cause,
    });
  }
}
