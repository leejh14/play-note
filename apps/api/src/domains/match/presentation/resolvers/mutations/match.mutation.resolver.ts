import {
  Args,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { OnModuleInit } from '@nestjs/common';
import { assertGlobalIdType } from '@libs/relay';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { RequireAdmin } from '@auth/decorators/require-admin.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { NodeResolver } from '@shared/presentation/graphql/relay/node.resolver';
import { ForbiddenException } from '@shared/exceptions/forbidden.exception';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { CreateMatchFromPresetUseCase } from '@domains/match/application/use-cases/commands/create-match-from-preset.use-case';
import { SetLaneUseCase } from '@domains/match/application/use-cases/commands/set-lane.use-case';
import { SetChampionUseCase } from '@domains/match/application/use-cases/commands/set-champion.use-case';
import { ConfirmMatchResultUseCase } from '@domains/match/application/use-cases/commands/confirm-match-result.use-case';
import { DeleteMatchUseCase } from '@domains/match/application/use-cases/commands/delete-match.use-case';
import { GetMatchUseCase } from '@domains/match/application/use-cases/queries/get-match.use-case';
import { CreateMatchFromPresetInputDto } from '@domains/match/application/dto/inputs/create-match-from-preset.input.dto';
import { SetLaneInputDto } from '@domains/match/application/dto/inputs/set-lane.input.dto';
import { SetChampionInputDto } from '@domains/match/application/dto/inputs/set-champion.input.dto';
import { ConfirmMatchResultInputDto } from '@domains/match/application/dto/inputs/confirm-match-result.input.dto';
import { MatchIdInputDto } from '@domains/match/application/dto/inputs/match-id.input.dto';
import { CreateMatchFromPresetInput } from '@domains/match/presentation/graphql/inputs/create-match-from-preset.input.gql';
import { SetLaneInput } from '@domains/match/presentation/graphql/inputs/set-lane.input.gql';
import { SetChampionInput } from '@domains/match/presentation/graphql/inputs/set-champion.input.gql';
import { ConfirmMatchResultInput } from '@domains/match/presentation/graphql/inputs/confirm-match-result.input.gql';
import { DeleteMatchInput } from '@domains/match/presentation/graphql/inputs/delete-match.input.gql';
import {
  ConfirmMatchResultPayload,
  CreateMatchFromPresetPayload,
  DeleteMatchPayload,
  SetChampionPayload,
  SetLanePayload,
} from '@domains/match/presentation/graphql/types/match-mutation.payload.gql';
import { MatchGqlMapper } from '@domains/match/presentation/mappers/match.gql.mapper';

@Resolver()
export class MatchMutationResolver implements OnModuleInit {
  constructor(
    private readonly createMatchFromPresetUseCase: CreateMatchFromPresetUseCase,
    private readonly setLaneUseCase: SetLaneUseCase,
    private readonly setChampionUseCase: SetChampionUseCase,
    private readonly confirmMatchResultUseCase: ConfirmMatchResultUseCase,
    private readonly deleteMatchUseCase: DeleteMatchUseCase,
    private readonly getMatchUseCase: GetMatchUseCase,
    private readonly nodeResolver: NodeResolver,
  ) {}

  onModuleInit(): void {
    this.nodeResolver.registerNodeFetcher(
      'Match',
      async (input) => {
        try {
          const match = await this.getMatchUseCase.execute(
            new MatchIdInputDto({
              matchId: input.id,
            }),
          );
          this.assertSessionAccess(input.auth, match.sessionId);
          return MatchGqlMapper.toGql(match);
        } catch (error: unknown) {
          if (error instanceof NotFoundException) {
            return null;
          }
          throw error;
        }
      },
    );
  }

  @Mutation(() => CreateMatchFromPresetPayload, { nullable: false })
  async createMatchFromPreset(
    @Args('input', { type: () => CreateMatchFromPresetInput })
    input: CreateMatchFromPresetInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<CreateMatchFromPresetPayload> {
    const sessionId = this.decodeGlobalId(input.sessionId, 'Session');
    this.assertSessionAccess(auth, sessionId);
    const output = await this.createMatchFromPresetUseCase.execute(
      new CreateMatchFromPresetInputDto({
        sessionId,
      }),
    );
    const match = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId: output.id,
      }),
    );
    return Object.assign(new CreateMatchFromPresetPayload(), {
      clientMutationId: input.clientMutationId,
      matchId: output.id,
      match: MatchGqlMapper.toGql(match),
    });
  }

  @Mutation(() => SetLanePayload, { nullable: false })
  async setLane(
    @Args('input', { type: () => SetLaneInput })
    input: SetLaneInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<SetLanePayload> {
    const matchId = this.decodeGlobalId(input.matchId, 'Match');
    const match = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId,
      }),
    );
    this.assertSessionAccess(auth, match.sessionId);

    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    const output = await this.setLaneUseCase.execute(
      new SetLaneInputDto({
        matchId,
        friendId,
        lane: input.lane,
      }),
    );
    const updatedMatch = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId: output.id,
      }),
    );
    return Object.assign(new SetLanePayload(), {
      clientMutationId: input.clientMutationId,
      matchId: output.id,
      match: MatchGqlMapper.toGql(updatedMatch),
    });
  }

  @Mutation(() => SetChampionPayload, { nullable: false })
  async setChampion(
    @Args('input', { type: () => SetChampionInput })
    input: SetChampionInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<SetChampionPayload> {
    const matchId = this.decodeGlobalId(input.matchId, 'Match');
    const match = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId,
      }),
    );
    this.assertSessionAccess(auth, match.sessionId);

    const friendId = this.decodeGlobalId(input.friendId, 'Friend');
    const output = await this.setChampionUseCase.execute(
      new SetChampionInputDto({
        matchId,
        friendId,
        champion: input.champion ?? null,
      }),
    );
    const updatedMatch = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId: output.id,
      }),
    );
    return Object.assign(new SetChampionPayload(), {
      clientMutationId: input.clientMutationId,
      matchId: output.id,
      match: MatchGqlMapper.toGql(updatedMatch),
    });
  }

  @Mutation(() => ConfirmMatchResultPayload, { nullable: false })
  async confirmMatchResult(
    @Args('input', { type: () => ConfirmMatchResultInput })
    input: ConfirmMatchResultInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<ConfirmMatchResultPayload> {
    const matchId = this.decodeGlobalId(input.matchId, 'Match');
    const match = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId,
      }),
    );
    this.assertSessionAccess(auth, match.sessionId);

    const output = await this.confirmMatchResultUseCase.execute(
      new ConfirmMatchResultInputDto({
        matchId,
        winnerSide: input.winnerSide,
        teamASide: input.teamASide,
      }),
    );
    const updatedMatch = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId: output.id,
      }),
    );
    return Object.assign(new ConfirmMatchResultPayload(), {
      clientMutationId: input.clientMutationId,
      matchId: output.id,
      match: MatchGqlMapper.toGql(updatedMatch),
    });
  }

  @RequireAdmin()
  @Mutation(() => DeleteMatchPayload, { nullable: false })
  async deleteMatch(
    @Args('input', { type: () => DeleteMatchInput })
    input: DeleteMatchInput,
    @CurrentAuth() auth: AuthContext,
  ): Promise<DeleteMatchPayload> {
    const matchId = this.decodeGlobalId(input.matchId, 'Match');
    const match = await this.getMatchUseCase.execute(
      new MatchIdInputDto({
        matchId,
      }),
    );
    this.assertSessionAccess(auth, match.sessionId);

    await this.deleteMatchUseCase.execute(
      new MatchIdInputDto({
        matchId,
      }),
    );
    return Object.assign(new DeleteMatchPayload(), {
      clientMutationId: input.clientMutationId,
      deletedMatchId: MatchGqlMapper.toMatchIdGql(matchId),
    });
  }

  private assertSessionAccess(auth: AuthContext, sessionId: string): void {
    if (auth.sessionId !== sessionId) {
      throw new ForbiddenException({
        message: 'Access denied for session',
      });
    }
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
