import { Injectable, Inject } from '@nestjs/common';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export interface TeamPresetDto {
  readonly friendId: string;
  readonly team: Team;
  readonly lane: Lane;
}

export interface ISessionContextAcl {
  getTeamPreset(sessionId: string): Promise<TeamPresetDto[]>;
}

@Injectable()
export class SessionContextAcl implements ISessionContextAcl {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
  ) {}

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
