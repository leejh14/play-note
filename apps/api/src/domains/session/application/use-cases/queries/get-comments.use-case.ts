import { Injectable, Inject } from '@nestjs/common';
import { ICommentRepository } from '@domains/session/domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '@domains/session/domain/constants';
import { CommentMapper } from '../../mappers/comment.mapper';
import { SessionIdInputDto } from '../../dto/inputs/session-id.input.dto';
import { CommentOutputDto } from '../../dto/outputs/comment.output.dto';

@Injectable()
export class GetCommentsUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(input: SessionIdInputDto): Promise<CommentOutputDto[]> {
    const comments = await this.commentRepository.findBySessionId(
      input.sessionId,
    );
    return comments.map((c) => CommentMapper.toDto(c));
  }
}
