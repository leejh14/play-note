import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { Session } from '@domains/session/domain/aggregates/session.aggregate';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY, FRIEND_CONTEXT_ACL } from '@domains/session/domain/constants';
import { IFriendContextAcl } from '../../acl/friend-context.acl.interface';
import { CreateSessionInputDto } from '../../dto/inputs/create-session.input.dto';

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(FRIEND_CONTEXT_ACL) private readonly friendContextAcl: IFriendContextAcl,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CreateSessionInputDto): Promise<{
    id: string;
    editorToken: string;
    adminToken: string;
  }> {
    const activeFriendIds = await this.friendContextAcl.getActiveFriendIds();
    const session = Session.create({
      contentType: input.contentType,
      title: input.title,
      startsAt: input.startsAt,
      activeFriendIds,
    });
    await this.sessionRepository.save(session);
    return {
      id: session.id,
      editorToken: session.editorToken,
      adminToken: session.adminToken,
    };
  }
}
