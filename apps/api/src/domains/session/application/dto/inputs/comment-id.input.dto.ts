export class CommentIdInputDto {
  readonly commentId: string;

  constructor(props: { commentId: string }) {
    this.commentId = props.commentId;
  }
}
