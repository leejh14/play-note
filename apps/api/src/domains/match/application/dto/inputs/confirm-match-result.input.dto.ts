import { Side } from '@domains/match/domain/enums/side.enum';

export class ConfirmMatchResultInputDto {
  readonly matchId: string;
  readonly winnerSide: Side;
  readonly teamASide: Side;

  constructor(props: {
    matchId: string;
    winnerSide: Side;
    teamASide: Side;
  }) {
    this.matchId = props.matchId;
    this.winnerSide = props.winnerSide;
    this.teamASide = props.teamASide;
  }
}
