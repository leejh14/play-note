import { Inject, Injectable } from '@nestjs/common';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { AuthContext } from '@auth/types/auth-context.type';

@Injectable()
export class SessionTokenService {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async validateToken(input: {
    sessionId: string;
    token: string;
  }): Promise<AuthContext> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new UnauthorizedException({
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }

    const role = session.validateToken(input.token);
    return {
      sessionId: session.id,
      role,
    };
  }
}
