import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { AUTH_ERROR_CODES } from '@auth/constants/error-codes';
import { IS_PUBLIC_KEY } from '@auth/decorators/public.decorator';
import { REQUIRE_ADMIN_KEY } from '@auth/decorators/require-admin.decorator';
import { RequestWithAuth } from '@auth/types/request-with-auth.type';
import { SessionTokenService } from '@auth/services/session-token.service';

@Injectable()
export class SessionTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext<{ req?: RequestWithAuth }>().req;
    if (!request) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
      });
    }

    const sessionId = this.readHeader(request, 'x-session-id');
    const token = this.readHeader(request, 'x-session-token');

    if (!sessionId || !token) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
      });
    }

    const auth = await this.sessionTokenService.validateToken({
      sessionId,
      token,
    });
    request.auth = auth;

    const requireAdmin = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requireAdmin && auth.role !== 'admin') {
      throw new ForbiddenException({
        message: 'Admin role required',
        errorCode: AUTH_ERROR_CODES.FORBIDDEN,
      });
    }

    return true;
  }

  private readHeader(request: RequestWithAuth, headerName: string): string | null {
    const raw = request.headers[headerName];
    if (!raw) {
      return null;
    }

    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
