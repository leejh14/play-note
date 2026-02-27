import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { MatchOrmEntity } from '@domains/match/infrastructure/persistence/match.orm-entity';
import { MatchTeamMemberOrmEntity } from '@domains/match/infrastructure/persistence/match-team-member.orm-entity';
import { Lane } from '@shared/domain/enums/lane.enum';

export interface MatchStatsMemberRawDto {
  readonly friendId: string;
  readonly team: string;
  readonly lane: Lane;
  readonly champion: string | null;
}

export interface MatchStatsRawDto {
  readonly matchId: string;
  readonly sessionId: string;
  readonly winnerSide: string;
  readonly teamASide: string;
  readonly members: MatchStatsMemberRawDto[];
}

export interface IMatchStatsContextAcl {
  getConfirmedMatchStats(input: {
    friendId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MatchStatsRawDto[]>;
}

@Injectable()
export class MatchStatsContextAcl implements IMatchStatsContextAcl {
  constructor(private readonly em: EntityManager) {}

  async getConfirmedMatchStats(input: {
    friendId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MatchStatsRawDto[]> {
    const where: Record<string, unknown> = { isConfirmed: true };
    if (input.friendId) {
      where.teamMembers = { friendId: input.friendId };
    }
    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) {
        (where.createdAt as Record<string, Date>).$gte = input.startDate;
      }
      if (input.endDate) {
        (where.createdAt as Record<string, Date>).$lte = input.endDate;
      }
    }
    const matches = await this.em.find(MatchOrmEntity, where, {
      populate: ['teamMembers', 'session'],
    });
    return matches.map((m) => ({
      matchId: m.id,
      sessionId: m.session.id,
      winnerSide: m.winnerSide,
      teamASide: m.teamASide,
      members: m.teamMembers.getItems().map((mtm) => ({
        friendId: mtm.friendId,
        team: mtm.team,
        lane: mtm.lane as Lane,
        champion: mtm.champion,
      })),
    }));
  }
}
