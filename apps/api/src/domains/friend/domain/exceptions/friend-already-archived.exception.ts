import { BaseException } from '@shared/exceptions/base.exception';
import { FRIEND_ERROR_CODES } from '../constants';

export class FriendAlreadyArchivedException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Friend is already archived',
      errorCode: FRIEND_ERROR_CODES.FRIEND_ALREADY_ARCHIVED,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
