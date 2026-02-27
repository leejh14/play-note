import { BaseException } from './base.exception';

export class UnauthorizedException extends BaseException {
  constructor(props: { message: string; errorCode?: string; cause?: Error }) {
    super({
      message: props.message,
      errorCode: props.errorCode ?? 'UNAUTHORIZED',
      statusCode: 401,
      cause: props.cause,
    });
  }
}
