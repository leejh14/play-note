export class BaseException extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly cause?: Error;

  constructor(props: {
    message: string;
    errorCode: string;
    statusCode?: number;
    cause?: Error;
  }) {
    super(props.message);
    this.name = this.constructor.name;
    this.errorCode = props.errorCode;
    this.statusCode = props.statusCode ?? 500;
    this.cause = props.cause;
  }
}
