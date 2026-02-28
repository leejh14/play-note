import { Module } from '@nestjs/common';
import { SharedPresentationModule } from '@shared/presentation/shared.presentation.module';
import { StatisticsApplicationModule } from '@domains/statistics/application/statistics.application.module';
import { FriendApplicationModule } from '@domains/friend/application/friend.application.module';
import { StatisticsQueryResolver } from './resolvers/queries/statistics.query.resolver';
import {
  FriendStatsSummaryFieldResolver,
  StatsDetailFieldResolver,
} from './resolvers/field-resolvers/stats-friend.field.resolver';
import '@shared/presentation/graphql/enums/lane.enum.gql';

@Module({
  imports: [
    SharedPresentationModule,
    StatisticsApplicationModule,
    FriendApplicationModule,
  ],
  providers: [
    StatisticsQueryResolver,
    FriendStatsSummaryFieldResolver,
    StatsDetailFieldResolver,
  ],
})
export class StatisticsPresentationModule {}
