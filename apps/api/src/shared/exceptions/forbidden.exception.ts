import { BaseException } from './base.exception';

export class ForbiddenException extends BaseException {
  constructor(props: { message: string; errorCode?: string; cause?: Error }) {
    super({
      message: props.message,
      errorCode: props.errorCode ?? 'FORBIDDEN',
      statusCode: 403,
      cause: props.cause,
    });
  }
}
