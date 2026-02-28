import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { AUTH_ERROR_CODES } from '@auth/constants/error-codes';
import { Public } from '@auth/decorators/public.decorator';
import { RequireAdmin } from '@auth/decorators/require-admin.decorator';
import { RequestWithAuth } from '@auth/types/request-with-auth.type';
import { SessionTokenService } from '@auth/services/session-token.service';
import { SessionTokenGuard } from '@auth/guards/session-token.guard';

class GuardProbeResolver {
  @Public()
  publicQuery(): string {
    return 'public';
  }

  protectedQuery(): string {
    return 'protected';
  }

  @RequireAdmin()
  adminMutation(): string {
    return 'admin';
  }
}

describe('SessionTokenGuard', () => {
  let guard: SessionTokenGuard;
  let sessionTokenService: jest.Mocked<SessionTokenService>;
  let gqlCreateSpy: jest.SpyInstance;

  beforeEach(() => {
    sessionTokenService = {
      validateToken: jest.fn(),
    } as unknown as jest.Mocked<SessionTokenService>;

    guard = new SessionTokenGuard(new Reflector(), sessionTokenService);
    gqlCreateSpy = jest.spyOn(GqlExecutionContext, 'create');
  });

  afterEach(() => {
    gqlCreateSpy.mockRestore();
  });

  it('skips auth when @Public is set', async () => {
    const context = createExecutionContext('publicQuery');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(gqlCreateSpy).not.toHaveBeenCalled();
    expect(sessionTokenService.validateToken).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when headers are missing', async () => {
    gqlCreateSpy.mockReturnValue({
      getContext: () => ({ req: { headers: {} } }),
    } as unknown as GqlExecutionContext);
    const context = createExecutionContext('protectedQuery');

    await expect(guard.canActivate(context)).rejects.toMatchObject<
      Partial<UnauthorizedException>
    >({
      errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('treats blank headers as missing', async () => {
    gqlCreateSpy.mockReturnValue({
      getContext: () => ({
        req: {
          headers: {
            'x-session-id': '   ',
            'x-session-token': 'editor-token',
          },
        },
      }),
    } as unknown as GqlExecutionContext);
    const context = createExecutionContext('protectedQuery');

    await expect(guard.canActivate(context)).rejects.toMatchObject<
      Partial<UnauthorizedException>
    >({
      errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
    });
    expect(sessionTokenService.validateToken).not.toHaveBeenCalled();
  });

  it('writes auth context to request after validation', async () => {
    const request: RequestWithAuth = {
      headers: {
        'x-session-id': 'session-1',
        'x-session-token': 'editor-token',
      },
    };
    gqlCreateSpy.mockReturnValue({
      getContext: () => ({ req: request }),
    } as unknown as GqlExecutionContext);
    sessionTokenService.validateToken.mockResolvedValue({
      sessionId: 'session-1',
      role: 'editor',
    });
    const context = createExecutionContext('protectedQuery');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(sessionTokenService.validateToken).toHaveBeenCalledWith({
      sessionId: 'session-1',
      token: 'editor-token',
    });
    expect(request.auth).toEqual({
      sessionId: 'session-1',
      role: 'editor',
    });
  });

  it('throws FORBIDDEN for @RequireAdmin with editor role', async () => {
    gqlCreateSpy.mockReturnValue({
      getContext: () => ({
        req: {
          headers: {
            'x-session-id': 'session-1',
            'x-session-token': 'editor-token',
          },
        },
      }),
    } as unknown as GqlExecutionContext);
    sessionTokenService.validateToken.mockResolvedValue({
      sessionId: 'session-1',
      role: 'editor',
    });
    const context = createExecutionContext('adminMutation');

    await expect(guard.canActivate(context)).rejects.toMatchObject<
      Partial<ForbiddenException>
    >({
      errorCode: AUTH_ERROR_CODES.FORBIDDEN,
    });
  });

  it('allows @RequireAdmin with admin role', async () => {
    gqlCreateSpy.mockReturnValue({
      getContext: () => ({
        req: {
          headers: {
            'x-session-id': 'session-1',
            'x-session-token': 'admin-token',
          },
        },
      }),
    } as unknown as GqlExecutionContext);
    sessionTokenService.validateToken.mockResolvedValue({
      sessionId: 'session-1',
      role: 'admin',
    });
    const context = createExecutionContext('adminMutation');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});

function createExecutionContext(
  method: keyof GuardProbeResolver,
): ExecutionContext {
  return {
    getHandler: () => GuardProbeResolver.prototype[method],
    getClass: () => GuardProbeResolver,
  } as unknown as ExecutionContext;
}
