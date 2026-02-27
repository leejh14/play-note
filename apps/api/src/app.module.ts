import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from '../mikro-orm.config';
import { envValidationSchema } from '@config/env.validation';
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
    FriendInfrastructureModule,
    AttachmentInfrastructureModule,
    SessionInfrastructureModule,
    MatchInfrastructureModule,
    StatisticsInfrastructureModule,
  ],
})
export class AppModule {}
