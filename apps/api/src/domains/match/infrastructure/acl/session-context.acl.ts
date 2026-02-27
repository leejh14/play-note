import { Injectable, Inject } from '@nestjs/common';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { ATTACHMENT_CONTEXT_ACL } from '@domains/session/domain/constants';
import { ISessionContextAcl, TeamPresetDto } from '@domains/match/application/acl/session-context.acl.interface';
import { IAttachmentContextAcl } from '@domains/session/application/acl/attachment-context.acl.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@Injectable()
export class SessionContextAcl implements ISessionContextAcl {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(ATTACHMENT_CONTEXT_ACL) private readonly attachmentContextAcl: IAttachmentContextAcl,
  ) {}

  async checkStructureChangeAllowed(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException({
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }
    const attachmentCount = await this.attachmentContextAcl.countBySessionId(
      sessionId,
    );
    session.checkStructureChangeAllowed(attachmentCount);
  }

  async getTeamPreset(sessionId: string): Promise<TeamPresetDto[]> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) return [];
    return session.getTeamPresetMembers().map((m) => ({
      friendId: m.friendId,
      team: m.team,
      lane: m.lane,
    }));
  }
}
