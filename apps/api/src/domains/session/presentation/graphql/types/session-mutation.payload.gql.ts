import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RelayMutationPayload, toGlobalId } from '@libs/relay';
import { Session } from './session.gql';
import { Comment } from './comment.gql';

@ObjectType('CreateSessionPayload')
export class CreateSessionPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;

  @Field(() => String, { nullable: false })
  editorToken!: string;

  @Field(() => String, { nullable: false })
  adminToken!: string;
}

@ObjectType('ConfirmSessionPayload')
export class ConfirmSessionPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('UpdateSessionPayload')
export class UpdateSessionPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('MarkDonePayload')
export class MarkDonePayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('ReopenSessionPayload')
export class ReopenSessionPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('DeleteSessionPayload')
export class DeleteSessionPayload extends RelayMutationPayload {
  deletedSessionLocalId!: string;

  @Field(() => ID, { nullable: false })
  get deletedSessionId(): string {
    return toGlobalId('Session', this.deletedSessionLocalId);
  }
}

@ObjectType('SetAttendancePayload')
export class SetAttendancePayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('SetTeamMemberPayload')
export class SetTeamMemberPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('BulkSetTeamsPayload')
export class BulkSetTeamsPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@ObjectType('CreateCommentPayload')
export class CreateCommentPayload extends RelayMutationPayload {
  commentId!: string;

  @Field(() => Comment, { nullable: true })
  comment?: Comment;
}

@ObjectType('DeleteCommentPayload')
export class DeleteCommentPayload extends RelayMutationPayload {
  deletedCommentLocalId!: string;

  @Field(() => ID, { nullable: false })
  get deletedCommentId(): string {
    return toGlobalId('Comment', this.deletedCommentLocalId);
  }
}

@ObjectType('AdminUnlockPayload')
export class AdminUnlockPayload extends RelayMutationPayload {
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  session?: Session;
}
