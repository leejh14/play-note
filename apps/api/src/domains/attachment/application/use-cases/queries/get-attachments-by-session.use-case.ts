import { Injectable, Inject } from '@nestjs/common';
import { IAttachmentRepository } from '@domains/attachment/domain/repositories/attachment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domains/attachment/domain/constants';
import { AttachmentMapper } from '../../mappers/attachment.mapper';
import { AttachmentsBySessionInputDto } from '../../dto/inputs/attachments-by-session.input.dto';
import { AttachmentOutputDto } from '../../dto/outputs/attachment.output.dto';

@Injectable()
export class GetAttachmentsBySessionUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(
    input: AttachmentsBySessionInputDto,
  ): Promise<AttachmentOutputDto[]> {
    const attachments = await this.attachmentRepository.findBySessionId(
      input.sessionId,
    );
    return attachments.map((a) => AttachmentMapper.toDto(a));
  }
}
