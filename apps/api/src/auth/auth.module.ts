import { Module } from '@nestjs/common';
import { SessionInfrastructureModule } from '@domains/session/infrastructure/session.infrastructure.module';
import { SessionTokenService } from '@auth/services/session-token.service';
import { SessionTokenGuard } from '@auth/guards/session-token.guard';
import { AuthQueryResolver } from '@auth/presentation/resolvers/auth.query.resolver';

@Module({
  imports: [SessionInfrastructureModule],
  providers: [SessionTokenService, SessionTokenGuard, AuthQueryResolver],
  exports: [SessionTokenService, SessionTokenGuard],
})
export class AuthModule {}
