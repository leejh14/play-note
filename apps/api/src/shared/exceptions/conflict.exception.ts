import { BaseException } from './base.exception';

export class ConflictException extends BaseException {
  constructor(props: { message: string; errorCode?: string; cause?: Error }) {
    super({
      message: props.message,
      errorCode: props.errorCode ?? 'CONFLICT_ERROR',
      statusCode: 409,
      cause: props.cause,
    });
  }
}
