export interface ExtractionTeamMember {
  readonly friendId: string;
  readonly riotGameName: string | null;
  readonly riotTagLine: string | null;
}

export interface ExtractionS3Source {
  readonly bucket: string;
  readonly key: string;
  readonly region: string;
}

export interface ExtractionMatch {
  readonly teamA: string[];
  readonly teamB: string[];
}

export interface ExtractionFriendDictionaryEntry {
  readonly friendId: string;
  readonly primary: string[];
  readonly secondary: string[];
}

export interface ExtractionOptions {
  readonly topK?: number;
  readonly minScoreFull?: number;
  readonly minScoreNameOnly?: number;
}

export interface ExtractionOcrCandidates {
  readonly winnerBannerSide?: 'blue' | 'red' | 'unknown';
  readonly winnerTextCandidates?: string[];
  readonly blueTextCandidates?: string[];
  readonly redTextCandidates?: string[];
}

export interface ExtractionInput {
  readonly jobId: string;
  readonly attachmentId?: string;
  readonly matchId?: string;
  readonly roiProfile?: string;
  readonly imagePath?: string;
  readonly s3?: ExtractionS3Source;
  readonly match: ExtractionMatch;
  readonly friendDictionary: ExtractionFriendDictionaryEntry[];
  readonly options?: ExtractionOptions;
  readonly ocr?: ExtractionOcrCandidates;
}

export interface ExtractionOutput {
  readonly winnerSide: 'blue' | 'red' | 'unknown';
  readonly teamASide: 'blue' | 'red' | 'unknown';
  readonly confidence: Record<string, number>;
  readonly model: string;
  readonly result: Record<string, unknown>;
}

export interface IExtractionService {
  execute(input: ExtractionInput): Promise<ExtractionOutput>;
}
