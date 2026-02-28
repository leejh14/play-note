export type SessionRole = 'editor' | 'admin';

export interface AuthContext {
  readonly sessionId: string;
  readonly role: SessionRole;
}
