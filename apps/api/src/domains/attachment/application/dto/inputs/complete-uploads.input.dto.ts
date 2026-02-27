import { CompleteUploadInputDto } from './complete-upload.input.dto';

export class CompleteUploadsInputDto {
  readonly files: CompleteUploadInputDto[];

  constructor(props: { files: CompleteUploadInputDto[] }) {
    this.files = props.files;
  }
}
