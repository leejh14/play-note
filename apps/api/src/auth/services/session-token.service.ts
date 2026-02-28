import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { AuthContext } from '@auth/types/auth-context.type';
import { AUTH_ERROR_CODES } from '@auth/constants/error-codes';
import { SESSION_TOKEN_READER } from '@auth/constants/tokens';
import { ISessionTokenReader } from './session-token-reader.interface';

@Injectable()
export class SessionTokenService {
  constructor(
    @Inject(SESSION_TOKEN_READER)
    private readonly sessionTokenReader: ISessionTokenReader,
  ) {}

  async validateToken(input: {
    sessionId: string;
    token: string;
  }): Promise<AuthContext> {
    const sessionToken = await this.sessionTokenReader.findBySessionId(
      input.sessionId,
    );

    if (!sessionToken) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        errorCode: AUTH_ERROR_CODES.SESSION_NOT_FOUND,
      });
    }

    const role =
      input.token === sessionToken.adminToken
        ? 'admin'
        : input.token === sessionToken.editorToken
          ? 'editor'
          : null;

    if (!role) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
      });
    }

    return {
      sessionId: sessionToken.sessionId,
      role,
    };
  }
}
