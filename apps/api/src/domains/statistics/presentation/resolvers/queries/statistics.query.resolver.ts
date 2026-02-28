import { Args, Query, Resolver } from '@nestjs/graphql';
import { assertGlobalIdType } from '@libs/relay';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { GetStatsOverviewUseCase } from '@domains/statistics/application/use-cases/queries/get-stats-overview.use-case';
import { GetStatsDetailUseCase } from '@domains/statistics/application/use-cases/queries/get-stats-detail.use-case';
import { StatsQueryInputDto } from '@domains/statistics/application/dto/inputs/stats-query.input.dto';
import { StatsDetailQueryInputDto } from '@domains/statistics/application/dto/inputs/stats-detail-query.input.dto';
import { StatsOverview } from '@domains/statistics/presentation/graphql/types/stats-overview.gql';
import { StatsDetail } from '@domains/statistics/presentation/graphql/types/stats-detail.gql';
import { StatsOverviewInput } from '@domains/statistics/presentation/graphql/inputs/stats-overview.input.gql';
import { StatsDetailInput } from '@domains/statistics/presentation/graphql/inputs/stats-detail.input.gql';
import { StatsGqlMapper } from '@domains/statistics/presentation/mappers/stats.gql.mapper';

@Resolver()
export class StatisticsQueryResolver {
  constructor(
    private readonly getStatsOverviewUseCase: GetStatsOverviewUseCase,
    private readonly getStatsDetailUseCase: GetStatsDetailUseCase,
  ) {}

  @Query(() => StatsOverview, { nullable: false })
  async statsOverview(
    @Args('input', { type: () => StatsOverviewInput, nullable: true })
    input?: StatsOverviewInput,
  ): Promise<StatsOverview> {
    const output = await this.getStatsOverviewUseCase.execute(
      new StatsQueryInputDto({
        startDate: input?.startDate,
        endDate: input?.endDate,
        includeArchived: input?.includeArchived,
      }),
    );
    return StatsGqlMapper.toOverviewGql(output);
  }

  @Query(() => StatsDetail, { nullable: false })
  async statsDetail(
    @Args('input', { type: () => StatsDetailInput })
    input: StatsDetailInput,
  ): Promise<StatsDetail> {
    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    const output = await this.getStatsDetailUseCase.execute(
      new StatsDetailQueryInputDto({
        friendId,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    );
    return StatsGqlMapper.toDetailGql(output, friendId);
  }

  private decodeGlobalId(globalId: string, expectedType: string): string {
    try {
      return assertGlobalIdType(globalId, expectedType);
    } catch {
      throw new ValidationException({
        message: `Invalid ${expectedType} id`,
      });
    }
  }
}
