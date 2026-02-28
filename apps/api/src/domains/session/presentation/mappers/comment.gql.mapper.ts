import { toGlobalId } from '@libs/relay';
import { CommentOutputDto } from '@domains/session/application/dto/outputs/comment.output.dto';
import { Comment } from '@domains/session/presentation/graphql/types/comment.gql';

export class CommentGqlMapper {
  static toGql(dto: CommentOutputDto): Comment {
    const gql = new Comment();
    gql.id = toGlobalId('Comment', dto.id);
    gql.sessionId = dto.sessionId;
    gql.body = dto.body;
    gql.displayName = dto.displayName;
    gql.createdAt = dto.createdAt;
    return gql;
  }
}
