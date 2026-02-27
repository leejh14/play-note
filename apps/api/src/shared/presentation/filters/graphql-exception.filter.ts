import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BaseException } from '@shared/exceptions/base.exception';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    GqlArgumentsHost.create(host);

    if (exception instanceof BaseException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.errorCode,
          statusCode: exception.statusCode,
        },
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    return new GraphQLError(
      isProduction ? 'Internal server error' : String(exception),
      {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        },
      },
    );
  }
}
