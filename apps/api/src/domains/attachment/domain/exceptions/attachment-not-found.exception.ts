import { BaseException } from '@shared/exceptions/base.exception';
import { ATTACHMENT_ERROR_CODES } from '../constants';

export class AttachmentNotFoundException extends BaseException {
  constructor(props?: { message?: string; cause?: Error }) {
    super({
      message: props?.message ?? 'Attachment not found',
      errorCode: ATTACHMENT_ERROR_CODES.ATTACHMENT_NOT_FOUND,
      statusCode: 404,
      cause: props?.cause,
    });
  }
}
