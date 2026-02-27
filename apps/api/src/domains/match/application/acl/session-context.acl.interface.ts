import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export interface TeamPresetDto {
  readonly friendId: string;
  readonly team: Team;
  readonly lane: Lane;
}

export interface ISessionContextAcl {
  getTeamPreset(sessionId: string): Promise<TeamPresetDto[]>;
  checkStructureChangeAllowed(sessionId: string): Promise<void>;
}
