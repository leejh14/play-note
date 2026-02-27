import { Match } from '@domains/match/domain/aggregates/match.aggregate';
import { MatchTeamMember } from '@domains/match/domain/entities/match-team-member.entity';
import { MatchOutputDto } from '../dto/outputs/match.output.dto';
import { MatchDetailOutputDto } from '../dto/outputs/match-detail.output.dto';
import { MatchTeamMemberOutputDto } from '../dto/outputs/match-team-member.output.dto';

export class MatchMapper {
  static toDto(match: Match): MatchOutputDto {
    const teamMembers = match.getTeamMembers().map((m) =>
      MatchMapper.toTeamMemberDto(m),
    );
    return new MatchOutputDto({
      id: match.id,
      sessionId: match.sessionId,
      matchNo: match.matchNo,
      status: match.status,
      winnerSide: match.winnerSide,
      teamASide: match.teamASide,
      isConfirmed: match.isConfirmed,
      teamMembers,
      createdAt: match.createdAt,
    });
  }

  static toDetailDto(match: Match): MatchDetailOutputDto {
    const teamMembers = match.getTeamMembers().map((m) =>
      MatchMapper.toTeamMemberDto(m),
    );
    return new MatchDetailOutputDto({
      id: match.id,
      sessionId: match.sessionId,
      matchNo: match.matchNo,
      status: match.status,
      winnerSide: match.winnerSide,
      teamASide: match.teamASide,
      isConfirmed: match.isConfirmed,
      teamMembers,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    });
  }

  private static toTeamMemberDto(member: MatchTeamMember): MatchTeamMemberOutputDto {
    return new MatchTeamMemberOutputDto({
      id: member.id,
      friendId: member.friendId,
      team: member.team,
      lane: member.lane,
      champion: member.champion,
    });
  }
}
