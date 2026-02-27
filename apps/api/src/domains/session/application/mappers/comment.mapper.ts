import { Comment } from '@domains/session/domain/aggregates/comment.aggregate';
import { CommentOutputDto } from '../dto/outputs/comment.output.dto';

export class CommentMapper {
  static toDto(comment: Comment): CommentOutputDto {
    return new CommentOutputDto({
      id: comment.id,
      sessionId: comment.sessionId,
      body: comment.body,
      displayName: comment.displayName,
      createdAt: comment.createdAt,
    });
  }
}
