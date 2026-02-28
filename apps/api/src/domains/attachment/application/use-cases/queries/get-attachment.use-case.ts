import { Inject, Injectable } from '@nestjs/common';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { AttachmentIdInputDto } from '../../dto/inputs/attachment-id.input.dto';
import { AttachmentOutputDto } from '../../dto/outputs/attachment.output.dto';
import { AttachmentMapper } from '../../mappers/attachment.mapper';

@Injectable()
export class GetAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(input: AttachmentIdInputDto): Promise<AttachmentOutputDto> {
    const attachment = await this.attachmentRepository.findById(
      input.attachmentId,
    );
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errorCode: 'ATTACHMENT_NOT_FOUND',
      });
    }
    return AttachmentMapper.toDto(attachment);
  }
}
