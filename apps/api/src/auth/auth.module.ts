import { Module } from '@nestjs/common';
import { SessionInfrastructureModule } from '@domains/session/infrastructure/session.infrastructure.module';
import { SessionTokenService } from '@auth/services/session-token.service';
import { SessionTokenGuard } from '@auth/guards/session-token.guard';

@Module({
  imports: [SessionInfrastructureModule],
  providers: [SessionTokenService, SessionTokenGuard],
  exports: [SessionTokenService, SessionTokenGuard],
})
export class AuthModule {}
