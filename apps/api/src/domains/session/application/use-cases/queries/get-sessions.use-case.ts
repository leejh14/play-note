import { Injectable, Inject } from '@nestjs/common';
import { ConnectionDto, EdgeDto } from '@libs/relay';
import { validateRelayArgs } from '@libs/relay';
import { ISessionRepository } from '@domains/session/domain/repositories/session.repository.interface';
import { IMatchRepository } from '@domains/match/domain/repositories/match.repository.interface';
import { SESSION_REPOSITORY } from '@domains/session/domain/constants';
import { MATCH_REPOSITORY } from '@domains/match/domain/constants';
import { SessionMapper } from '../../mappers/session.mapper';
import { GetSessionsInputDto } from '../../dto/inputs/get-sessions.input.dto';
import { SessionOutputDto } from '../../dto/outputs/session.output.dto';
import { Session } from '@domains/session/domain/aggregates/session.aggregate';

@Injectable()
export class GetSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(MATCH_REPOSITORY) private readonly matchRepository: IMatchRepository,
  ) {}

  async execute(
    input: GetSessionsInputDto,
  ): Promise<ConnectionDto<SessionOutputDto>> {
    validateRelayArgs(input);
    const orderBy = input.orderBy?.map((o) => ({
      field: o.field,
      direction: o.direction,
    }));
    const connection = await this.sessionRepository.findAll({
      first: input.first,
      after: input.after,
      last: input.last,
      before: input.before,
      filter: input.filter,
      orderBy,
    });

    const edges = await Promise.all(
      connection.edges.map(async (edge) => {
        const session = edge.node as Session;
        const attendingCount = SessionMapper.attendingCount(session);
        const matches = await this.matchRepository.findBySessionId(session.id);
        const matchCount = matches.length;
        const dto = SessionMapper.toDto(session, attendingCount, matchCount);
        return new EdgeDto({ node: dto, cursor: edge.cursor });
      }),
    );

    return new ConnectionDto({
      edges,
      pageInfo: connection.pageInfo,
    });
  }
}
