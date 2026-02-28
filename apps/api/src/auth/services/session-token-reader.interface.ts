export interface SessionTokenRecord {
  readonly sessionId: string;
  readonly editorToken: string;
  readonly adminToken: string;
}

export interface ISessionTokenReader {
  findBySessionId(sessionId: string): Promise<SessionTokenRecord | null>;
}
