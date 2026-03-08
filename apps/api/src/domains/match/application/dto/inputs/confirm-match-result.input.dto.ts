import { Side } from '@domains/match/domain/enums/side.enum';
import { Team } from '@shared/domain/enums/team.enum';

export class ConfirmMatchResultInputDto {
  readonly matchId: string;
  readonly winnerSide: Side;
  readonly winnerTeam: Team | null;
  readonly teamASide: Side;

  constructor(props: {
    matchId: string;
    winnerSide: Side;
    winnerTeam?: Team | null;
    teamASide: Side;
  }) {
    this.matchId = props.matchId;
    this.winnerSide = props.winnerSide;
    this.winnerTeam = props.winnerTeam ?? null;
    this.teamASide = props.teamASide;
  }
}
