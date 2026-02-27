import { Module } from '@nestjs/common';
import { MatchInfrastructureModule } from '@domains/match/infrastructure/match.infrastructure.module';
import { CreateMatchFromPresetUseCase } from './use-cases/commands/create-match-from-preset.use-case';
import { SetLaneUseCase } from './use-cases/commands/set-lane.use-case';
import { SetChampionUseCase } from './use-cases/commands/set-champion.use-case';
import { ConfirmMatchResultUseCase } from './use-cases/commands/confirm-match-result.use-case';
import { DeleteMatchUseCase } from './use-cases/commands/delete-match.use-case';
import { GetMatchUseCase } from './use-cases/queries/get-match.use-case';
import { GetMatchesBySessionUseCase } from './use-cases/queries/get-matches-by-session.use-case';

@Module({
  imports: [MatchInfrastructureModule],
  providers: [
    CreateMatchFromPresetUseCase,
    SetLaneUseCase,
    SetChampionUseCase,
    ConfirmMatchResultUseCase,
    DeleteMatchUseCase,
    GetMatchUseCase,
    GetMatchesBySessionUseCase,
  ],
  exports: [
    CreateMatchFromPresetUseCase,
    SetLaneUseCase,
    SetChampionUseCase,
    ConfirmMatchResultUseCase,
    DeleteMatchUseCase,
    GetMatchUseCase,
    GetMatchesBySessionUseCase,
  ],
})
export class MatchApplicationModule {}
