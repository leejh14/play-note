import { Module } from '@nestjs/common';
import { StatisticsInfrastructureModule } from '@domains/statistics/infrastructure/statistics.infrastructure.module';
import { GetStatsOverviewUseCase } from './use-cases/queries/get-stats-overview.use-case';
import { GetStatsDetailUseCase } from './use-cases/queries/get-stats-detail.use-case';

@Module({
  imports: [StatisticsInfrastructureModule],
  providers: [GetStatsOverviewUseCase, GetStatsDetailUseCase],
  exports: [GetStatsOverviewUseCase, GetStatsDetailUseCase],
})
export class StatisticsApplicationModule {}
