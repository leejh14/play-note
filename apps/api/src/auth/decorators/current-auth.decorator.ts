import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { AuthContext } from '@auth/types/auth-context.type';
import { RequestWithAuth } from '@auth/types/request-with-auth.type';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext<{ req?: RequestWithAuth }>().req;
    const auth = request?.auth;

    if (!auth) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
      });
    }

    return auth;
  },
);
