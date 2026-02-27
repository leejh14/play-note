export interface IAttachmentContextAcl {
  countBySessionId(sessionId: string): Promise<number>;
}
