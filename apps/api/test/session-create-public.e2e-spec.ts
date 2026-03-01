import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  GraphQLModule,
  GraphQLSchemaHost,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { graphql, GraphQLSchema } from 'graphql';
import { SessionTokenGuard } from '@auth/guards/session-token.guard';
import { SessionTokenService } from '@auth/services/session-token.service';
import { GraphQLExceptionFilter } from '@shared/presentation/filters/graphql-exception.filter';
import { SessionMutationResolver } from '@domains/session/presentation/resolvers/mutations/session.mutation.resolver';
import { CreateSessionUseCase } from '@domains/session/application/use-cases/commands/create-session.use-case';
import { ConfirmSessionUseCase } from '@domains/session/application/use-cases/commands/confirm-session.use-case';
import { UpdateSessionUseCase } from '@domains/session/application/use-cases/commands/update-session.use-case';
import { MarkDoneUseCase } from '@domains/session/application/use-cases/commands/mark-done.use-case';
import { ReopenSessionUseCase } from '@domains/session/application/use-cases/commands/reopen-session.use-case';
import { DeleteSessionUseCase } from '@domains/session/application/use-cases/commands/delete-session.use-case';
import { SetAttendanceUseCase } from '@domains/session/application/use-cases/commands/set-attendance.use-case';
import { SetTeamMemberUseCase } from '@domains/session/application/use-cases/commands/set-team-member.use-case';
import { BulkSetTeamsUseCase } from '@domains/session/application/use-cases/commands/bulk-set-teams.use-case';
import { CreateCommentUseCase } from '@domains/session/application/use-cases/commands/create-comment.use-case';
import { DeleteCommentUseCase } from '@domains/session/application/use-cases/commands/delete-comment.use-case';
import { AdminUnlockUseCase } from '@domains/session/application/use-cases/commands/admin-unlock.use-case';
import { GetSessionUseCase } from '@domains/session/application/use-cases/queries/get-session.use-case';
import { GetCommentUseCase } from '@domains/session/application/use-cases/queries/get-comment.use-case';
import { SessionOutputDto } from '@domains/session/application/dto/outputs/session.output.dto';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';

import '@shared/presentation/graphql/enums/team.enum.gql';
import '@shared/presentation/graphql/enums/lane.enum.gql';
import '@shared/presentation/graphql/enums/order-direction.enum.gql';
import '@domains/session/presentation/graphql/enums/content-type.enum.gql';
import '@domains/session/presentation/graphql/enums/session-status.enum.gql';
import '@domains/session/presentation/graphql/enums/attendance-status.enum.gql';
import '@domains/session/presentation/graphql/enums/session-order-field.enum.gql';
import '@domains/match/presentation/graphql/enums/match-status.enum.gql';
import '@domains/match/presentation/graphql/enums/side.enum.gql';
import '@domains/attachment/presentation/graphql/enums/attachment-scope.enum.gql';
import '@domains/attachment/presentation/graphql/enums/attachment-type.enum.gql';
import '@domains/attachment/presentation/graphql/enums/extraction-status.enum.gql';

type UseCaseMock = {
  execute: jest.Mock<Promise<any>, any[]>;
};

const schemaOutputPath = join(
  __dirname,
  '.generated/session-create-public-schema.graphql',
);

@Resolver()
class SessionCreatePublicProbeResolver {
  @Query(() => String, { nullable: false })
  probe(): string {
    return 'ok';
  }
}

describe('CreateSession public mutation (e2e)', () => {
  let app: INestApplication;
  let schema: GraphQLSchema;

  const createSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const confirmSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const updateSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const markDoneUseCase: UseCaseMock = { execute: jest.fn() };
  const reopenSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const deleteSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const setAttendanceUseCase: UseCaseMock = { execute: jest.fn() };
  const setTeamMemberUseCase: UseCaseMock = { execute: jest.fn() };
  const bulkSetTeamsUseCase: UseCaseMock = { execute: jest.fn() };
  const createCommentUseCase: UseCaseMock = { execute: jest.fn() };
  const deleteCommentUseCase: UseCaseMock = { execute: jest.fn() };
  const adminUnlockUseCase: UseCaseMock = { execute: jest.fn() };
  const getSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const getCommentUseCase: UseCaseMock = { execute: jest.fn() };

  const sessionTokenService = {
    validateToken: jest.fn(),
  };

  beforeAll(async () => {
    mkdirSync(dirname(schemaOutputPath), { recursive: true });

    const moduleRef = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: schemaOutputPath,
          sortSchema: true,
          context: ({ req }: { req: unknown }) => ({ req }),
        }),
      ],
      providers: [
        SessionMutationResolver,
        SessionCreatePublicProbeResolver,
        { provide: CreateSessionUseCase, useValue: createSessionUseCase },
        { provide: ConfirmSessionUseCase, useValue: confirmSessionUseCase },
        { provide: UpdateSessionUseCase, useValue: updateSessionUseCase },
        { provide: MarkDoneUseCase, useValue: markDoneUseCase },
        { provide: ReopenSessionUseCase, useValue: reopenSessionUseCase },
        { provide: DeleteSessionUseCase, useValue: deleteSessionUseCase },
        { provide: SetAttendanceUseCase, useValue: setAttendanceUseCase },
        { provide: SetTeamMemberUseCase, useValue: setTeamMemberUseCase },
        { provide: BulkSetTeamsUseCase, useValue: bulkSetTeamsUseCase },
        { provide: CreateCommentUseCase, useValue: createCommentUseCase },
        { provide: DeleteCommentUseCase, useValue: deleteCommentUseCase },
        { provide: AdminUnlockUseCase, useValue: adminUnlockUseCase },
        { provide: GetSessionUseCase, useValue: getSessionUseCase },
        { provide: GetCommentUseCase, useValue: getCommentUseCase },
        { provide: SessionTokenService, useValue: sessionTokenService },
        {
          provide: APP_GUARD,
          useClass: SessionTokenGuard,
        },
        {
          provide: APP_FILTER,
          useClass: GraphQLExceptionFilter,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    schema = app.get(GraphQLSchemaHost).schema;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    createSessionUseCase.execute.mockResolvedValue({
      id: 'session-public-1',
      editorToken: 'editor-token-public',
      adminToken: 'admin-token-public',
    });
    getSessionUseCase.execute.mockResolvedValue(
      new SessionOutputDto({
        id: 'session-public-1',
        contentType: ContentType.LOL,
        title: 'Public Session',
        startsAt: new Date('2026-03-01T10:00:00.000Z'),
        status: SessionStatus.SCHEDULED,
        attendingCount: 0,
        matchCount: 0,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows createSession without auth headers', async () => {
    const result = await graphql({
      schema,
      source: `
        mutation CreateSession($input: CreateSessionInput!) {
          createSession(input: $input) {
            editorToken
            adminToken
            session {
              id
              status
            }
          }
        }
      `,
      variableValues: {
        input: {
          contentType: 'LOL',
          title: 'Public Session',
          startsAt: '2026-03-01T10:00:00.000Z',
        },
      },
      contextValue: {
        req: {
          headers: {},
        },
      },
    });

    expect(result.errors).toBeUndefined();
    const data = result.data as {
      createSession: {
        editorToken: string;
        adminToken: string;
        session: { status: string };
      };
    };
    expect(data.createSession.editorToken).toBe('editor-token-public');
    expect(data.createSession.adminToken).toBe('admin-token-public');
    expect(data.createSession.session.status).toBe('SCHEDULED');
    expect(sessionTokenService.validateToken).not.toHaveBeenCalled();
  });
});
