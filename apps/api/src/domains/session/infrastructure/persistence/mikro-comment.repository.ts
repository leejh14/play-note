import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Comment } from '@domains/session/domain/aggregates/comment.aggregate';
import { ICommentRepository } from '@domains/session/domain/repositories/comment.repository.interface';
import { CommentOrmEntity } from './comment.orm-entity';
import { SessionOrmEntity } from './session.orm-entity';

@Injectable()
export class MikroCommentRepository implements ICommentRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Comment | null> {
    const orm = await this.em.findOne(CommentOrmEntity, { id });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findBySessionId(sessionId: string): Promise<Comment[]> {
    const list = await this.em.find(CommentOrmEntity, {
      session: { id: sessionId },
    });
    return list.map((o) => this.toDomainEntity(o));
  }

  async save(comment: Comment): Promise<void> {
    const orm = this.toOrmEntity(comment);
    await this.em.upsert(orm);
    await this.em.flush();
  }

  async delete(comment: Comment): Promise<void> {
    const orm = await this.em.findOne(CommentOrmEntity, { id: comment.id });
    if (orm) {
      await this.em.removeAndFlush(orm);
    }
  }

  private toOrmEntity(comment: Comment): CommentOrmEntity {
    const orm = new CommentOrmEntity();
    orm.id = comment.id;
    orm.session = this.em.getReference(SessionOrmEntity, comment.sessionId);
    orm.body = comment.body;
    orm.displayName = comment.displayName;
    orm.createdAt = comment.createdAt;
    return orm;
  }

  private toDomainEntity(orm: CommentOrmEntity): Comment {
    return Comment.reconstitute({
      id: orm.id,
      sessionId: orm.session.id,
      body: orm.body,
      displayName: orm.displayName,
      createdAt: orm.createdAt,
      updatedAt: orm.createdAt,
    });
  }
}
