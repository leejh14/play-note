import { Inject, Injectable } from '@nestjs/common';
import { ICommentRepository } from '@domains/session/domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '@domains/session/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { CommentIdInputDto } from '../../dto/inputs/comment-id.input.dto';
import { CommentOutputDto } from '../../dto/outputs/comment.output.dto';
import { CommentMapper } from '../../mappers/comment.mapper';

@Injectable()
export class GetCommentUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(input: CommentIdInputDto): Promise<CommentOutputDto> {
    const comment = await this.commentRepository.findById(input.commentId);
    if (!comment) {
      throw new NotFoundException({
        message: 'Comment not found',
        errorCode: 'COMMENT_NOT_FOUND',
      });
    }
    return CommentMapper.toDto(comment);
  }
}
