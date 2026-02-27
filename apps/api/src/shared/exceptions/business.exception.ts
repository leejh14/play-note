import { BaseException } from './base.exception';

export class BusinessException extends BaseException {
  constructor(props: { message: string; errorCode?: string; cause?: Error }) {
    super({
      message: props.message,
      errorCode: props.errorCode ?? 'BUSINESS_ERROR',
      statusCode: 400,
      cause: props.cause,
    });
  }
}
