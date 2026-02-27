import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from '../mikro-orm.config';
import { envValidationSchema } from '@config/env.validation';
import { GraphileWorkerModule } from '@shared/infrastructure/worker/graphile-worker.module';
import { StorageModule } from '@shared/infrastructure/storage/storage.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
      registerRequestContext: true,
      autoLoadEntities: false, // entities는 config glob으로 로드, forFeature 중복 방지
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
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
  ],
})
export class AppModule {}
