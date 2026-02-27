export class AttachmentIdInputDto {
  readonly attachmentId: string;

  constructor(props: { attachmentId: string }) {
    this.attachmentId = props.attachmentId;
  }
}
