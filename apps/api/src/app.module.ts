import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { join } from 'path';
import mikroOrmConfig from '../mikro-orm.config';
import { envValidationSchema } from '@config/env.validation';
import { AuthModule } from '@auth/auth.module';
import { SessionTokenGuard } from '@auth/guards/session-token.guard';
import { GraphileWorkerModule } from '@shared/infrastructure/worker/graphile-worker.module';
import { StorageModule } from '@shared/infrastructure/storage/storage.module';
import { GraphQLExceptionFilter } from '@shared/presentation/filters/graphql-exception.filter';
import { FriendApplicationModule } from '@domains/friend/application/friend.application.module';
import { SessionApplicationModule } from '@domains/session/application/session.application.module';
import { MatchApplicationModule } from '@domains/match/application/match.application.module';
import { AttachmentApplicationModule } from '@domains/attachment/application/attachment.application.module';
import { StatisticsApplicationModule } from '@domains/statistics/application/statistics.application.module';
import { FriendInfrastructureModule } from '@domains/friend/infrastructure/friend.infrastructure.module';
import { AttachmentInfrastructureModule } from '@domains/attachment/infrastructure/attachment.infrastructure.module';
import { SessionInfrastructureModule } from '@domains/session/infrastructure/session.infrastructure.module';
import { MatchInfrastructureModule } from '@domains/match/infrastructure/match.infrastructure.module';
import { StatisticsInfrastructureModule } from '@domains/statistics/infrastructure/statistics.infrastructure.module';
import { FriendPresentationModule } from '@domains/friend/presentation/friend.presentation.module';
import { SessionPresentationModule } from '@domains/session/presentation/session.presentation.module';
import { MatchPresentationModule } from '@domains/match/presentation/match.presentation.module';
import { AttachmentPresentationModule } from '@domains/attachment/presentation/attachment.presentation.module';
import { StatisticsPresentationModule } from '@domains/statistics/presentation/statistics.presentation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    AuthModule,
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
      registerRequestContext: true,
      autoLoadEntities: false, // entities는 config glob으로 로드, forFeature 중복 방지
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/api/src/schema.graphql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    GraphileWorkerModule,
    StorageModule,
    FriendApplicationModule,
    SessionApplicationModule,
    MatchApplicationModule,
    AttachmentApplicationModule,
    StatisticsApplicationModule,
    FriendInfrastructureModule,
    AttachmentInfrastructureModule,
    SessionInfrastructureModule,
    MatchInfrastructureModule,
    StatisticsInfrastructureModule,
    FriendPresentationModule,
    SessionPresentationModule,
    MatchPresentationModule,
    AttachmentPresentationModule,
    StatisticsPresentationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionTokenGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GraphQLExceptionFilter,
    },
  ],
})
export class AppModule {}
