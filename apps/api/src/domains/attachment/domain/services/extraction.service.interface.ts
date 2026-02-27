export interface ExtractionTeamMember {
  readonly friendId: string;
  readonly riotGameName: string | null;
  readonly riotTagLine: string | null;
}

export interface ExtractionInput {
  readonly attachmentId: string;
  readonly matchId: string;
  readonly s3Key: string;
  readonly teamA: ExtractionTeamMember[];
  readonly teamB: ExtractionTeamMember[];
}

export interface ExtractionOutput {
  readonly winnerSide: 'blue' | 'red' | 'unknown';
  readonly teamASide: 'blue' | 'red' | 'unknown';
  readonly confidence: Record<string, number>;
  readonly result: Record<string, unknown>;
}

export interface IExtractionService {
  execute(input: ExtractionInput): Promise<ExtractionOutput>;
}
