import { MatchStatus } from '@domains/match/domain/enums/match-status.enum';
import { Side } from '@domains/match/domain/enums/side.enum';
import { Team } from '@shared/domain/enums/team.enum';
import { MatchTeamMemberOutputDto } from './match-team-member.output.dto';

export class MatchDetailOutputDto {
  readonly id: string;
  readonly sessionId: string;
  readonly matchNo: number;
  readonly status: MatchStatus;
  readonly winnerSide: Side;
  readonly winnerTeam: Team | null;
  readonly teamASide: Side;
  readonly isConfirmed: boolean;
  readonly teamMembers: MatchTeamMemberOutputDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    sessionId: string;
    matchNo: number;
    status: MatchStatus;
    winnerSide: Side;
    winnerTeam: Team | null;
    teamASide: Side;
    isConfirmed: boolean;
    teamMembers: MatchTeamMemberOutputDto[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.sessionId = props.sessionId;
    this.matchNo = props.matchNo;
    this.status = props.status;
    this.winnerSide = props.winnerSide;
    this.winnerTeam = props.winnerTeam;
    this.teamASide = props.teamASide;
    this.isConfirmed = props.isConfirmed;
    this.teamMembers = props.teamMembers;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
