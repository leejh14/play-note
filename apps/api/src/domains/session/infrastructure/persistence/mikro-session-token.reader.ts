import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import {
  ISessionTokenReader,
  SessionTokenRecord,
} from '@auth/services/session-token-reader.interface';
import { SessionOrmEntity } from './session.orm-entity';

@Injectable()
export class MikroSessionTokenReader implements ISessionTokenReader {
  constructor(
    private readonly em: EntityManager,
  ) {}

  async findBySessionId(sessionId: string): Promise<SessionTokenRecord | null> {
    const session = await this.em.findOne(
      SessionOrmEntity,
      { id: sessionId },
      {
        fields: ['id', 'editorToken', 'adminToken'],
      },
    );

    if (!session) {
      return null;
    }

    return {
      sessionId: session.id,
      editorToken: session.editorToken,
      adminToken: session.adminToken,
    };
  }
}
