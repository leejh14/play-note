import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { Comment } from '@domains/session/domain/aggregates/comment.aggregate';
import { ICommentRepository } from '@domains/session/domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '@domains/session/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { CreateCommentInputDto } from '../../dto/inputs/create-comment.input.dto';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: ICommentRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CreateCommentInputDto): Promise<{ id: string }> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }
    const comment = Comment.create({
      sessionId: input.sessionId,
      body: input.body,
      displayName: input.displayName,
    });
    await this.commentRepository.save(comment);
    return { id: comment.id };
  }
}
