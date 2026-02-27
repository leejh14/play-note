import { BaseException } from './base.exception';

export class NotFoundException extends BaseException {
  constructor(props: { message: string; errorCode?: string; cause?: Error }) {
    super({
      message: props.message,
      errorCode: props.errorCode ?? 'RESOURCE_NOT_FOUND',
      statusCode: 404,
      cause: props.cause,
    });
  }
}
