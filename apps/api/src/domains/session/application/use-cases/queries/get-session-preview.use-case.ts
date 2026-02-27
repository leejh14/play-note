import { Injectable, Inject } from '@nestjs/common';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { SessionMapper } from '../../mappers/session.mapper';
import { SessionIdInputDto } from '../../dto/inputs/session-id.input.dto';
import { SessionPreviewOutputDto } from '../../dto/outputs/session-preview.output.dto';

@Injectable()
export class GetSessionPreviewUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(input: SessionIdInputDto): Promise<SessionPreviewOutputDto> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }
    return SessionMapper.toPreviewDto(session);
  }
}
