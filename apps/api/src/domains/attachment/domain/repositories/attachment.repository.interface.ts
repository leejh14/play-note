import { Attachment } from '../aggregates/attachment.aggregate';

export interface IAttachmentRepository {
  findById(id: string): Promise<Attachment | null>;
  findBySessionId(sessionId: string): Promise<Attachment[]>;
  findByMatchId(matchId: string): Promise<Attachment[]>;
  countBySessionId(sessionId: string): Promise<number>;
  countBySessionIdForUpdate(sessionId: string): Promise<number>;
  save(attachment: Attachment): Promise<void>;
  saveMany(attachments: Attachment[]): Promise<void>;
  delete(attachment: Attachment): Promise<void>;
  findS3KeysBySessionId(sessionId: string): Promise<string[]>;
  findS3KeysByMatchId(matchId: string): Promise<string[]>;
}
