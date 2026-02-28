import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { AUTH_ERROR_CODES } from '@auth/constants/error-codes';
import { SessionTokenService } from '@auth/services/session-token.service';
import { ISessionTokenReader } from '@auth/services/session-token-reader.interface';

describe('SessionTokenService', () => {
  let service: SessionTokenService;
  let sessionTokenReader: jest.Mocked<ISessionTokenReader>;

  beforeEach(() => {
    sessionTokenReader = {
      findBySessionId: jest.fn(),
    };
    service = new SessionTokenService(sessionTokenReader);
  });

  it('returns editor role when editor token matches', async () => {
    sessionTokenReader.findBySessionId.mockResolvedValue({
      sessionId: 'session-1',
      editorToken: 'editor-token',
      adminToken: 'admin-token',
    });

    const result = await service.validateToken({
      sessionId: 'session-1',
      token: 'editor-token',
    });

    expect(result).toEqual({
      sessionId: 'session-1',
      role: 'editor',
    });
  });

  it('returns admin role when admin token matches', async () => {
    sessionTokenReader.findBySessionId.mockResolvedValue({
      sessionId: 'session-1',
      editorToken: 'editor-token',
      adminToken: 'admin-token',
    });

    const result = await service.validateToken({
      sessionId: 'session-1',
      token: 'admin-token',
    });

    expect(result).toEqual({
      sessionId: 'session-1',
      role: 'admin',
    });
  });

  it('throws SESSION_NOT_FOUND when session does not exist', async () => {
    sessionTokenReader.findBySessionId.mockResolvedValue(null);

    await expect(
      service.validateToken({
        sessionId: 'missing-session',
        token: 'any',
      }),
    ).rejects.toMatchObject<Partial<UnauthorizedException>>({
      errorCode: AUTH_ERROR_CODES.SESSION_NOT_FOUND,
    });
  });

  it('throws INVALID_TOKEN when token does not match', async () => {
    sessionTokenReader.findBySessionId.mockResolvedValue({
      sessionId: 'session-1',
      editorToken: 'editor-token',
      adminToken: 'admin-token',
    });

    await expect(
      service.validateToken({
        sessionId: 'session-1',
        token: 'wrong-token',
      }),
    ).rejects.toMatchObject<Partial<UnauthorizedException>>({
      errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
    });
  });
});
