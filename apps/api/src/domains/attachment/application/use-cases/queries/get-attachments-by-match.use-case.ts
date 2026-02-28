import { Inject, Injectable } from '@nestjs/common';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';
import { AttachmentOutputDto } from '../../dto/outputs/attachment.output.dto';
import { AttachmentMapper } from '../../mappers/attachment.mapper';

@Injectable()
export class GetAttachmentsByMatchUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(input: { matchId: string }): Promise<AttachmentOutputDto[]> {
    const attachments = await this.attachmentRepository.findByMatchId(
      input.matchId,
    );
    return attachments.map((attachment) => AttachmentMapper.toDto(attachment));
  }
}
