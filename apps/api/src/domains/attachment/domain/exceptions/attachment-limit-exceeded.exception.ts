import { BaseException } from '@shared/exceptions/base.exception';
import { ATTACHMENT_ERROR_CODES } from '../constants';

export class AttachmentLimitExceededException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Attachment limit exceeded',
      errorCode: ATTACHMENT_ERROR_CODES.ATTACHMENT_LIMIT_EXCEEDED,
      statusCode: 400,
      cause: props?.cause,
    });
  }
}
