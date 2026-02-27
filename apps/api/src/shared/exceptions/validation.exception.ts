import { BaseException } from './base.exception';

export class ValidationException extends BaseException {
  constructor(props: { message: string; errorCode?: string; cause?: Error }) {
    super({
      message: props.message,
      errorCode: props.errorCode ?? 'VALIDATION_ERROR',
      statusCode: 400,
      cause: props.cause,
    });
  }
}
