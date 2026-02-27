import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { ICommentRepository } from '@domains/session/domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '@domains/session/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { CommentIdInputDto } from '../../dto/inputs/comment-id.input.dto';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: ICommentRepository,
    private readonly em: EntityManager,
  ) {}

  @Transactional({ propagation: TransactionPropagation.REQUIRED })
  async execute(input: CommentIdInputDto): Promise<void> {
    const comment = await this.commentRepository.findById(input.commentId);
    if (!comment) {
      throw new NotFoundException({
        message: 'Comment not found',
        errorCode: 'COMMENT_NOT_FOUND',
      });
    }
    await this.commentRepository.delete(comment);
  }
}
