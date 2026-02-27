import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ExtractionResult } from '@domains/attachment/domain/aggregates/extraction-result.aggregate';
import { IExtractionResultRepository } from '@domains/attachment/domain/repositories/extraction-result.repository.interface';
import { ExtractionStatus } from '@domains/attachment/domain/enums/extraction-status.enum';
import { ExtractionResultOrmEntity } from './extraction-result.orm-entity';

@Injectable()
export class MikroExtractionResultRepository implements IExtractionResultRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<ExtractionResult | null> {
    const orm = await this.em.findOne(ExtractionResultOrmEntity, { id });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findByAttachmentId(attachmentId: string): Promise<ExtractionResult | null> {
    const orm = await this.em.findOne(ExtractionResultOrmEntity, { attachmentId });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findByMatchId(matchId: string): Promise<ExtractionResult[]> {
    const list = await this.em.find(ExtractionResultOrmEntity, { matchId });
    return list.map((o) => this.toDomainEntity(o));
  }

  async save(result: ExtractionResult): Promise<void> {
    const orm = this.toOrmEntity(result);
    await this.em.upsert(orm);
    await this.em.flush();
  }

  private toOrmEntity(result: ExtractionResult): ExtractionResultOrmEntity {
    const orm = new ExtractionResultOrmEntity();
    orm.id = result.id;
    orm.attachmentId = result.attachmentId;
    orm.matchId = result.matchId;
    orm.status = result.status;
    orm.model = result.model;
    orm.result = result.result;
    orm.createdAt = result.createdAt;
    return orm;
  }

  private toDomainEntity(orm: ExtractionResultOrmEntity): ExtractionResult {
    return ExtractionResult.reconstitute({
      id: orm.id,
      attachmentId: orm.attachmentId,
      matchId: orm.matchId,
      status: orm.status as ExtractionStatus,
      model: orm.model,
      result: orm.result,
      createdAt: orm.createdAt,
      updatedAt: orm.createdAt,
    });
  }
}
