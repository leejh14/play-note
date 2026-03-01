import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Attachment } from '@domains/attachment/domain/aggregates/attachment.aggregate';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { AttachmentScope } from '@domains/attachment/domain/enums/attachment-scope.enum';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';
import { AttachmentOrmEntity } from './attachment.orm-entity';

@Injectable()
export class MikroAttachmentRepository implements IAttachmentRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Attachment | null> {
    const orm = await this.em.findOne(AttachmentOrmEntity, { id });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findBySessionId(sessionId: string): Promise<Attachment[]> {
    const list = await this.em.find(AttachmentOrmEntity, { sessionId });
    return list.map((o) => this.toDomainEntity(o));
  }

  async findByMatchId(matchId: string): Promise<Attachment[]> {
    const list = await this.em.find(AttachmentOrmEntity, { matchId });
    return list.map((o) => this.toDomainEntity(o));
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return this.em.count(AttachmentOrmEntity, { sessionId });
  }

  async countBySessionIdForUpdate(sessionId: string): Promise<number> {
    const conn = this.em.getConnection();
    await conn.execute(
      `SELECT id FROM "session" WHERE id = ? FOR UPDATE`,
      [sessionId],
      'get',
    );
    return this.em.count(AttachmentOrmEntity, { sessionId });
  }

  async save(attachment: Attachment): Promise<void> {
    const orm = this.toOrmEntity(attachment);
    await this.em.upsert(orm);
    await this.em.flush();
  }

  async saveMany(attachments: Attachment[]): Promise<void> {
    const orms = attachments.map((a) => this.toOrmEntity(a));
    for (const orm of orms) {
      this.em.persist(orm);
    }
    await this.em.flush();
  }

  async delete(attachment: Attachment): Promise<void> {
    const orm = await this.em.findOne(AttachmentOrmEntity, { id: attachment.id });
    if (orm) {
      await this.em.removeAndFlush(orm);
    }
  }

  async findS3KeysBySessionId(sessionId: string): Promise<string[]> {
    const list = await this.em.find(
      AttachmentOrmEntity,
      { sessionId },
      { fields: ['s3Key'] },
    );
    return list.map((o) => o.s3Key);
  }

  async findS3KeysByMatchId(matchId: string): Promise<string[]> {
    const list = await this.em.find(
      AttachmentOrmEntity,
      { matchId },
      { fields: ['s3Key'] },
    );
    return list.map((o) => o.s3Key);
  }

  private toOrmEntity(attachment: Attachment): AttachmentOrmEntity {
    const orm = new AttachmentOrmEntity();
    orm.id = attachment.id;
    orm.sessionId = attachment.sessionId;
    orm.matchId = attachment.matchId;
    orm.scope = attachment.scope;
    orm.type = attachment.type;
    orm.s3Key = attachment.s3Key;
    orm.contentType = attachment.contentType;
    orm.size = attachment.size;
    orm.width = attachment.width;
    orm.height = attachment.height;
    orm.originalFileName = attachment.originalFileName;
    orm.createdAt = attachment.createdAt;
    return orm;
  }

  private toDomainEntity(orm: AttachmentOrmEntity): Attachment {
    return Attachment.reconstitute({
      id: orm.id,
      sessionId: orm.sessionId,
      matchId: orm.matchId,
      scope: orm.scope as AttachmentScope,
      type: orm.type as AttachmentType,
      s3Key: orm.s3Key,
      contentType: orm.contentType,
      size: orm.size,
      width: orm.width,
      height: orm.height,
      originalFileName: orm.originalFileName,
      createdAt: orm.createdAt,
      updatedAt: orm.createdAt,
    });
  }
}
