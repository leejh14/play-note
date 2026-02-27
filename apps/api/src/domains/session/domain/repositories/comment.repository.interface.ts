import { Comment } from '../aggregates/comment.aggregate';

export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findBySessionId(sessionId: string): Promise<Comment[]>;
  save(comment: Comment): Promise<void>;
  delete(comment: Comment): Promise<void>;
}
