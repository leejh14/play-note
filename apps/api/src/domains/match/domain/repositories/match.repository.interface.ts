import { Match } from '../aggregates/match.aggregate';

export interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
  findBySessionId(sessionId: string): Promise<Match[]>;
  getNextMatchNo(sessionId: string): Promise<number>;
  save(match: Match): Promise<void>;
  delete(match: Match): Promise<void>;
}
