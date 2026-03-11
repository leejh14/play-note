import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { IncomingHttpHeaders } from "http";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule, GraphQLSchemaHost } from "@nestjs/graphql";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { graphql, GraphQLSchema } from "graphql";
import {
  ConnectionDto,
  EdgeDto,
  PageInfoDto,
  fromGlobalId,
  toGlobalId,
  validateRelayArgs,
} from "@libs/relay";
import { SessionTokenGuard } from "@auth/guards/session-token.guard";
import { SessionTokenService } from "@auth/services/session-token.service";
import { UnauthorizedException } from "@shared/exceptions/unauthorized.exception";
import { ValidationException } from "@shared/exceptions/validation.exception";
import { GraphQLExceptionFilter } from "@shared/presentation/filters/graphql-exception.filter";
import { NodeResolver } from "@shared/presentation/graphql/relay/node.resolver";
import { JSONScalar } from "@shared/presentation/graphql/scalars/json.scalar";
import { FriendQueryResolver } from "@domains/friend/presentation/resolvers/queries/friend.query.resolver";
import { FriendMutationResolver } from "@domains/friend/presentation/resolvers/mutations/friend.mutation.resolver";
import { SessionQueryResolver } from "@domains/session/presentation/resolvers/queries/session.query.resolver";
import { PublicSessionQueryResolver } from "@domains/session/presentation/resolvers/queries/public-session.query.resolver";
import { AttendanceFieldResolver } from "@domains/session/presentation/resolvers/field-resolvers/attendance.field.resolver";
import { TeamPresetMemberFieldResolver } from "@domains/session/presentation/resolvers/field-resolvers/team-preset-member.field.resolver";
import { MatchTeamMemberFieldResolver } from "@domains/match/presentation/resolvers/field-resolvers/match-team-member.field.resolver";
import { MatchMutationResolver } from "@domains/match/presentation/resolvers/mutations/match.mutation.resolver";
import { GetFriendsUseCase } from "@domains/friend/application/use-cases/queries/get-friends.use-case";
import { GetFriendUseCase } from "@domains/friend/application/use-cases/queries/get-friend.use-case";
import { CreateFriendUseCase } from "@domains/friend/application/use-cases/commands/create-friend.use-case";
import { UpdateFriendUseCase } from "@domains/friend/application/use-cases/commands/update-friend.use-case";
import { ArchiveFriendUseCase } from "@domains/friend/application/use-cases/commands/archive-friend.use-case";
import { RestoreFriendUseCase } from "@domains/friend/application/use-cases/commands/restore-friend.use-case";
import { GetSessionsUseCase } from "@domains/session/application/use-cases/queries/get-sessions.use-case";
import { GetSessionUseCase } from "@domains/session/application/use-cases/queries/get-session.use-case";
import { GetSessionPreviewUseCase } from "@domains/session/application/use-cases/queries/get-session-preview.use-case";
import { GetCommentsUseCase } from "@domains/session/application/use-cases/queries/get-comments.use-case";
import { GetMatchesBySessionUseCase } from "@domains/match/application/use-cases/queries/get-matches-by-session.use-case";
import { GetAttachmentsBySessionUseCase } from "@domains/attachment/application/use-cases/queries/get-attachments-by-session.use-case";
import { GetAttachmentsByMatchUseCase } from "@domains/attachment/application/use-cases/queries/get-attachments-by-match.use-case";
import { GetExtractionResultsByMatchUseCase } from "@domains/attachment/application/use-cases/queries/get-extraction-results-by-match.use-case";
import { CreateMatchFromPresetUseCase } from "@domains/match/application/use-cases/commands/create-match-from-preset.use-case";
import { SetLaneUseCase } from "@domains/match/application/use-cases/commands/set-lane.use-case";
import { SetChampionUseCase } from "@domains/match/application/use-cases/commands/set-champion.use-case";
import { ConfirmMatchResultUseCase } from "@domains/match/application/use-cases/commands/confirm-match-result.use-case";
import { DeleteMatchUseCase } from "@domains/match/application/use-cases/commands/delete-match.use-case";
import { GetMatchUseCase } from "@domains/match/application/use-cases/queries/get-match.use-case";
import { FriendOutputDto } from "@domains/friend/application/dto/outputs/friend.output.dto";
import { CommentOutputDto } from "@domains/session/application/dto/outputs/comment.output.dto";
import { SessionOutputDto } from "@domains/session/application/dto/outputs/session.output.dto";
import { SessionDetailOutputDto } from "@domains/session/application/dto/outputs/session-detail.output.dto";
import { SessionPreviewOutputDto } from "@domains/session/application/dto/outputs/session-preview.output.dto";
import { AttendanceOutputDto } from "@domains/session/application/dto/outputs/attendance.output.dto";
import { TeamPresetMemberOutputDto } from "@domains/session/application/dto/outputs/team-preset-member.output.dto";
import { MatchOutputDto } from "@domains/match/application/dto/outputs/match.output.dto";
import { MatchTeamMemberOutputDto } from "@domains/match/application/dto/outputs/match-team-member.output.dto";
import { AttachmentOutputDto } from "@domains/attachment/application/dto/outputs/attachment.output.dto";
import { ExtractionResultOutputDto } from "@domains/attachment/application/dto/outputs/extraction-result.output.dto";
import { ContentType } from "@domains/session/domain/enums/content-type.enum";
import { AttendanceStatus } from "@domains/session/domain/enums/attendance-status.enum";
import { SessionStatus } from "@domains/session/domain/enums/session-status.enum";
import { MatchStatus } from "@domains/match/domain/enums/match-status.enum";
import { Side } from "@domains/match/domain/enums/side.enum";
import { AttachmentScope } from "@domains/attachment/domain/enums/attachment-scope.enum";
import { AttachmentType } from "@domains/attachment/domain/enums/attachment-type.enum";
import { ExtractionStatus } from "@domains/attachment/domain/enums/extraction-status.enum";
import { Team } from "@shared/domain/enums/team.enum";
import { Lane } from "@shared/domain/enums/lane.enum";

import "@shared/presentation/graphql/enums/team.enum.gql";
import "@shared/presentation/graphql/enums/lane.enum.gql";
import "@shared/presentation/graphql/enums/order-direction.enum.gql";
import "@domains/session/presentation/graphql/enums/content-type.enum.gql";
import "@domains/session/presentation/graphql/enums/session-status.enum.gql";
import "@domains/session/presentation/graphql/enums/attendance-status.enum.gql";
import "@domains/session/presentation/graphql/enums/session-order-field.enum.gql";
import "@domains/match/presentation/graphql/enums/match-status.enum.gql";
import "@domains/match/presentation/graphql/enums/side.enum.gql";
import "@domains/attachment/presentation/graphql/enums/attachment-scope.enum.gql";
import "@domains/attachment/presentation/graphql/enums/attachment-type.enum.gql";
import "@domains/attachment/presentation/graphql/enums/extraction-status.enum.gql";

const schemaOutputPath = join(
  __dirname,
  ".generated/presentation-schema.graphql",
);

type UseCaseMock = {
  execute: jest.Mock<Promise<unknown>, any[]>;
};

describe("Presentation GraphQL (e2e)", () => {
  let app: INestApplication;
  let schema: GraphQLSchema;
  let friendStore: Record<string, FriendOutputDto>;

  const getFriendsUseCase: UseCaseMock = { execute: jest.fn() };
  const getFriendUseCase: UseCaseMock = { execute: jest.fn() };
  const createFriendUseCase: UseCaseMock = { execute: jest.fn() };
  const updateFriendUseCase: UseCaseMock = { execute: jest.fn() };
  const archiveFriendUseCase: UseCaseMock = { execute: jest.fn() };
  const restoreFriendUseCase: UseCaseMock = { execute: jest.fn() };

  const getSessionsUseCase: UseCaseMock = { execute: jest.fn() };
  const getSessionUseCase: UseCaseMock = { execute: jest.fn() };
  const getSessionPreviewUseCase: UseCaseMock = { execute: jest.fn() };
  const getCommentsUseCase: UseCaseMock = { execute: jest.fn() };
  const getMatchesBySessionUseCase: UseCaseMock = { execute: jest.fn() };
  const getAttachmentsBySessionUseCase: UseCaseMock = { execute: jest.fn() };
  const getAttachmentsByMatchUseCase: UseCaseMock = { execute: jest.fn() };
  const getExtractionResultsByMatchUseCase: UseCaseMock = {
    execute: jest.fn(),
  };

  const createMatchFromPresetUseCase: UseCaseMock = { execute: jest.fn() };
  const setLaneUseCase: UseCaseMock = { execute: jest.fn() };
  const setChampionUseCase: UseCaseMock = { execute: jest.fn() };
  const confirmMatchResultUseCase: UseCaseMock = { execute: jest.fn() };
  const deleteMatchUseCase: UseCaseMock = { execute: jest.fn() };
  const getMatchUseCase: UseCaseMock = { execute: jest.fn() };

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
        JSONScalar,
        NodeResolver,
        FriendQueryResolver,
        FriendMutationResolver,
        SessionQueryResolver,
        PublicSessionQueryResolver,
        AttendanceFieldResolver,
        TeamPresetMemberFieldResolver,
        MatchTeamMemberFieldResolver,
        MatchMutationResolver,
        { provide: GetFriendsUseCase, useValue: getFriendsUseCase },
        { provide: GetFriendUseCase, useValue: getFriendUseCase },
        { provide: CreateFriendUseCase, useValue: createFriendUseCase },
        { provide: UpdateFriendUseCase, useValue: updateFriendUseCase },
        { provide: ArchiveFriendUseCase, useValue: archiveFriendUseCase },
        { provide: RestoreFriendUseCase, useValue: restoreFriendUseCase },
        { provide: GetSessionsUseCase, useValue: getSessionsUseCase },
        { provide: GetSessionUseCase, useValue: getSessionUseCase },
        {
          provide: GetSessionPreviewUseCase,
          useValue: getSessionPreviewUseCase,
        },
        { provide: GetCommentsUseCase, useValue: getCommentsUseCase },
        {
          provide: GetMatchesBySessionUseCase,
          useValue: getMatchesBySessionUseCase,
        },
        {
          provide: GetAttachmentsBySessionUseCase,
          useValue: getAttachmentsBySessionUseCase,
        },
        {
          provide: GetAttachmentsByMatchUseCase,
          useValue: getAttachmentsByMatchUseCase,
        },
        {
          provide: GetExtractionResultsByMatchUseCase,
          useValue: getExtractionResultsByMatchUseCase,
        },
        {
          provide: CreateMatchFromPresetUseCase,
          useValue: createMatchFromPresetUseCase,
        },
        { provide: SetLaneUseCase, useValue: setLaneUseCase },
        { provide: SetChampionUseCase, useValue: setChampionUseCase },
        {
          provide: ConfirmMatchResultUseCase,
          useValue: confirmMatchResultUseCase,
        },
        { provide: DeleteMatchUseCase, useValue: deleteMatchUseCase },
        { provide: GetMatchUseCase, useValue: getMatchUseCase },
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
    friendStore = {
      "friend-1": buildFriend("friend-1", "Alice"),
      "friend-2": buildFriend("friend-2", "Bob"),
    };

    sessionTokenService.validateToken.mockImplementation(
      async (input: { sessionId: string; token: string }) => {
        if (input.sessionId === "session-1" && input.token === "editor-token") {
          return { sessionId: "session-1", role: "editor" as const };
        }
        if (input.sessionId === "session-1" && input.token === "admin-token") {
          return { sessionId: "session-1", role: "admin" as const };
        }
        throw new UnauthorizedException({
          message: "Unauthorized",
        });
      },
    );

    getFriendsUseCase.execute.mockResolvedValue(Object.values(friendStore));
    getFriendUseCase.execute.mockImplementation(
      async (input: { id: string }) =>
        friendStore[input.id] ?? buildFriend(input.id, "Ghost"),
    );
    createFriendUseCase.execute.mockImplementation(
      async (input: { displayName: string }) => {
        const created = buildFriend("friend-2", input.displayName);
        friendStore[created.id] = created;
        return { id: created.id };
      },
    );
    updateFriendUseCase.execute.mockResolvedValue({ id: "friend-1" });
    archiveFriendUseCase.execute.mockResolvedValue(undefined);
    restoreFriendUseCase.execute.mockResolvedValue(undefined);

    getSessionsUseCase.execute.mockImplementation(
      async (input: {
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }) => {
        try {
          validateRelayArgs(input);
        } catch (error: unknown) {
          throw new ValidationException({
            message:
              error instanceof Error
                ? error.message
                : "Invalid relay arguments",
          });
        }

        const session = buildSessionOutput("session-1");
        const edge = new EdgeDto({
          cursor: "cursor-session-1",
          node: session,
        });
        const pageInfo = new PageInfoDto({
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: edge.cursor,
          endCursor: edge.cursor,
        });
        return new ConnectionDto({
          edges: [edge],
          pageInfo,
        });
      },
    );

    getSessionUseCase.execute.mockImplementation(
      async (input: { sessionId: string }) =>
        buildSessionDetail(input.sessionId),
    );
    getSessionPreviewUseCase.execute.mockResolvedValue(
      new SessionPreviewOutputDto({
        contentType: ContentType.LOL,
        title: "Session Preview",
        startsAt: fixedDate(),
      }),
    );
    getCommentsUseCase.execute.mockImplementation(
      async (input: { sessionId: string }) => [
        buildCommentOutput(input.sessionId),
      ],
    );
    getMatchesBySessionUseCase.execute.mockImplementation(
      async (input: { sessionId: string }) => [
        buildMatchOutput(
          input.sessionId === "session-2" ? "match-2" : "match-1",
          input.sessionId,
        ),
      ],
    );
    getAttachmentsBySessionUseCase.execute.mockImplementation(
      async (input: { sessionId: string }) => [
        buildAttachmentOutput({
          id: `session-attachment-${input.sessionId}`,
          sessionId: input.sessionId,
          matchId: null,
          type: AttachmentType.FUTSAL_PHOTO,
          originalFileName: `${input.sessionId}-photo.png`,
        }),
      ],
    );
    getAttachmentsByMatchUseCase.execute.mockImplementation(
      async (input: { matchId: string }) => [
        buildAttachmentOutput({
          id: `match-attachment-${input.matchId}`,
          sessionId: input.matchId === "match-2" ? "session-2" : "session-1",
          matchId: input.matchId,
          type: AttachmentType.LOL_RESULT_SCREEN,
          originalFileName: `${input.matchId}-end.png`,
        }),
      ],
    );
    getExtractionResultsByMatchUseCase.execute.mockImplementation(
      async (input: { matchId: string }) => [
        buildExtractionResultOutput(input.matchId),
      ],
    );

    createMatchFromPresetUseCase.execute.mockResolvedValue({ id: "match-1" });
    setLaneUseCase.execute.mockResolvedValue({ id: "match-1" });
    setChampionUseCase.execute.mockResolvedValue({ id: "match-1" });
    confirmMatchResultUseCase.execute.mockResolvedValue({ id: "match-1" });
    deleteMatchUseCase.execute.mockResolvedValue(undefined);
    getMatchUseCase.execute.mockImplementation(
      async (input: { matchId: string }) =>
        input.matchId === "match-2"
          ? buildMatchOutput("match-2", "session-2")
          : buildMatchOutput("match-1", "session-1"),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns UNAUTHORIZED when token headers are missing", async () => {
    const result = await executeGraphql({
      schema,
      source: "query { friends { id } }",
    });

    expect(result.errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
  });

  it("allows @Public sessionPreview without token", async () => {
    const result = await executeGraphql({
      schema,
      source:
        "query($id: ID!) { sessionPreview(sessionId: $id) { contentType title startsAt } }",
      variables: {
        id: toGlobalId("Session", "session-1"),
      },
    });

    expect(result.errors).toBeUndefined();
    expect(
      (result.data as { sessionPreview: { title: string } }).sessionPreview
        .title,
    ).toBe("Session Preview");
  });

  it("allows publicSessions without token and returns nested public data", async () => {
    const result = await executeGraphql({
      schema,
      source: `
        query {
          publicSessions(first: 1) {
            edges {
              node {
                id
                title
                updatedAt
                attendances {
                  status
                  friend {
                    displayName
                  }
                }
                teamPresetMembers {
                  team
                  lane
                  friend {
                    displayName
                  }
                }
                matches {
                  matchNo
                  teamMembers {
                    friend {
                      displayName
                    }
                  }
                  attachments {
                    originalFileName
                  }
                  extractionResults {
                    status
                  }
                }
                attachments {
                  originalFileName
                }
                comments {
                  body
                }
              }
            }
          }
        }
      `,
    });

    expect(result.errors).toBeUndefined();
    const edge = (
      result.data as {
        publicSessions: {
          edges: Array<{
            node: {
              title: string;
              attendances: Array<{ friend: { displayName: string } }>;
              matches: Array<{
                attachments: Array<{ originalFileName: string | null }>;
                extractionResults: Array<{ status: string }>;
              }>;
              comments: Array<{ body: string }>;
            };
          }>;
        };
      }
    ).publicSessions.edges[0];

    expect(edge?.node.title).toBe("Session session-1");
    expect(edge?.node.attendances[0]?.friend.displayName).toBe("Alice");
    expect(edge?.node.matches[0]?.attachments[0]?.originalFileName).toBe(
      "match-1-end.png",
    );
    expect(edge?.node.matches[0]?.extractionResults[0]?.status).toBe("DONE");
    expect(edge?.node.comments[0]?.body).toBe("Comment for session-1");
  });

  it("allows publicSession without token", async () => {
    const result = await executeGraphql({
      schema,
      source: `
        query($id: ID!) {
          publicSession(sessionId: $id) {
            id
            title
            matchCount
            updatedAt
          }
        }
      `,
      variables: {
        id: toGlobalId("Session", "session-1"),
      },
    });

    expect(result.errors).toBeUndefined();
    const data = result.data as {
      publicSession: {
        id: string;
        title: string;
        matchCount: number;
        updatedAt: string;
      };
    };
    expect(data.publicSession.id).toBe(toGlobalId("Session", "session-1"));
    expect(data.publicSession.title).toBe("Session session-1");
    expect(data.publicSession.matchCount).toBe(1);
    expect(data.publicSession.updatedAt).toBe("2026-02-28T00:00:00.000Z");
  });

  it("enforces admin-only mutation", async () => {
    const mutation =
      "mutation($input: DeleteMatchInput!) { deleteMatch(input: $input) { clientMutationId deletedMatchId } }";
    const variables = {
      input: {
        clientMutationId: "cmid-delete",
        matchId: toGlobalId("Match", "match-1"),
      },
    };

    const forbidden = await executeGraphql({
      schema,
      source: mutation,
      variables,
      headers: authHeaders("editor-token", "session-1"),
    });
    expect(forbidden.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");

    const allowed = await executeGraphql({
      schema,
      source: mutation,
      variables,
      headers: authHeaders("admin-token", "session-1"),
    });
    expect(allowed.errors).toBeUndefined();
    expect(
      (allowed.data as { deleteMatch: { deletedMatchId: string } }).deleteMatch
        .deletedMatchId,
    ).toBe(toGlobalId("Match", "match-1"));
  });

  it("supports relay global id encode/decode", () => {
    const encoded = toGlobalId("Friend", "friend-1");
    expect(fromGlobalId(encoded)).toEqual({
      typeName: "Friend",
      localId: "friend-1",
    });
  });

  it("supports node and nodes queries", async () => {
    const single = await executeGraphql({
      schema,
      source:
        "query($id: ID!) { node(id: $id) { __typename id ... on Friend { displayName } } }",
      variables: {
        id: toGlobalId("Friend", "friend-1"),
      },
      headers: authHeaders("editor-token", "session-1"),
    });

    expect(single.errors).toBeUndefined();
    expect(
      (single.data as { node: { __typename: string } }).node.__typename,
    ).toBe("Friend");

    const many = await executeGraphql({
      schema,
      source: "query($ids: [ID!]!) { nodes(ids: $ids) { __typename id } }",
      variables: {
        ids: [
          toGlobalId("Friend", "friend-1"),
          toGlobalId("Session", "session-1"),
          toGlobalId("Match", "match-1"),
        ],
      },
      headers: authHeaders("editor-token", "session-1"),
    });

    expect(many.errors).toBeUndefined();
    const typenames = (
      many.data as { nodes: Array<{ __typename: string }> }
    ).nodes.map((node) => node.__typename);
    expect(typenames).toEqual(["Friend", "Session", "Match"]);
  });

  it("supports session connection pagination and rejects invalid relay args", async () => {
    const valid = await executeGraphql({
      schema,
      source:
        "query { sessions(first: 1) { edges { cursor node { id } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }",
      headers: authHeaders("editor-token", "session-1"),
    });

    expect(valid.errors).toBeUndefined();
    const validData = valid.data as {
      sessions: {
        edges: Array<{ node: { id: string } }>;
      };
    };
    expect(validData.sessions.edges).toHaveLength(1);
    expect(validData.sessions.edges[0]?.node.id).toBe(
      toGlobalId("Session", "session-1"),
    );

    const invalid = await executeGraphql({
      schema,
      source: "query { sessions(first: 1, last: 1) { edges { cursor } } }",
      headers: authHeaders("editor-token", "session-1"),
    });

    expect(invalid.errors?.[0]?.extensions?.code).toBe("VALIDATION_ERROR");
  });

  it("returns mutation payload with clientMutationId and resolved entity", async () => {
    const result = await executeGraphql({
      schema,
      source:
        "mutation($input: CreateFriendInput!) { createFriend(input: $input) { clientMutationId friend { id displayName } } }",
      variables: {
        input: {
          clientMutationId: "cmid-friend",
          displayName: "Neo",
        },
      },
      headers: authHeaders("admin-token", "session-1"),
    });

    expect(result.errors).toBeUndefined();
    const payload = (
      result.data as {
        createFriend: {
          clientMutationId: string;
          friend: { displayName: string };
        };
      }
    ).createFriend;
    expect(payload.clientMutationId).toBe("cmid-friend");
    expect(payload.friend.displayName).toBe("Neo");
  });

  it("blocks cross-session access with FORBIDDEN", async () => {
    const result = await executeGraphql({
      schema,
      source: "query($id: ID!) { session(sessionId: $id) { id } }",
      variables: {
        id: toGlobalId("Session", "session-2"),
      },
      headers: authHeaders("editor-token", "session-1"),
    });

    expect(result.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
  });

  it("generates schema file from code-first setup", () => {
    expect(existsSync(schemaOutputPath)).toBe(true);
  });
});

async function executeGraphql(input: {
  schema: GraphQLSchema;
  source: string;
  variables?: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
}) {
  return graphql({
    schema: input.schema,
    source: input.source,
    variableValues: input.variables,
    contextValue: {
      req: {
        headers: input.headers ?? {},
      },
    },
  });
}

function fixedDate(): Date {
  return new Date("2026-02-28T00:00:00.000Z");
}

function authHeaders(token: string, sessionId: string): IncomingHttpHeaders {
  return {
    "x-session-id": sessionId,
    "x-session-token": token,
  };
}

function buildFriend(id: string, displayName: string): FriendOutputDto {
  const now = fixedDate();
  return new FriendOutputDto({
    id,
    displayName,
    riotGameName: null,
    riotTagLine: null,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  });
}

function buildSessionOutput(id: string): SessionOutputDto {
  return new SessionOutputDto({
    id,
    contentType: ContentType.LOL,
    title: `Session ${id}`,
    startsAt: fixedDate(),
    status: SessionStatus.SCHEDULED,
    isStructureLocked: false,
    attendingCount: 0,
    matchCount: 1,
    createdAt: fixedDate(),
    updatedAt: fixedDate(),
  });
}

function buildSessionDetail(id: string): SessionDetailOutputDto {
  return new SessionDetailOutputDto({
    id,
    contentType: ContentType.LOL,
    title: `Session ${id}`,
    startsAt: fixedDate(),
    status: SessionStatus.SCHEDULED,
    isStructureLocked: false,
    editorToken: "editor-token",
    adminToken: "admin-token",
    attendances: [
      new AttendanceOutputDto({
        id: `attendance-${id}-1`,
        friendId: "friend-1",
        status: AttendanceStatus.ATTENDING,
      }),
      new AttendanceOutputDto({
        id: `attendance-${id}-2`,
        friendId: "friend-2",
        status: AttendanceStatus.ATTENDING,
      }),
    ],
    teamPresetMembers: [
      new TeamPresetMemberOutputDto({
        id: `preset-${id}-1`,
        friendId: "friend-1",
        team: Team.A,
        lane: Lane.TOP,
      }),
      new TeamPresetMemberOutputDto({
        id: `preset-${id}-2`,
        friendId: "friend-2",
        team: Team.B,
        lane: Lane.JG,
      }),
    ],
    createdAt: fixedDate(),
    updatedAt: fixedDate(),
  });
}

function buildMatchOutput(id: string, sessionId: string): MatchOutputDto {
  return new MatchOutputDto({
    id,
    sessionId,
    matchNo: 1,
    status: MatchStatus.DRAFT,
    winnerSide: Side.UNKNOWN,
    winnerTeam: null,
    teamASide: Side.UNKNOWN,
    isConfirmed: false,
    teamMembers: [
      new MatchTeamMemberOutputDto({
        id: `member-${id}-1`,
        friendId: "friend-1",
        team: Team.A,
        lane: Lane.TOP,
        champion: "Ahri",
      }),
      new MatchTeamMemberOutputDto({
        id: `member-${id}-2`,
        friendId: "friend-2",
        team: Team.B,
        lane: Lane.JG,
        champion: null,
      }),
    ],
    createdAt: fixedDate(),
  });
}

function buildCommentOutput(sessionId: string): CommentOutputDto {
  return new CommentOutputDto({
    id: `comment-${sessionId}`,
    sessionId,
    body: `Comment for ${sessionId}`,
    displayName: "Alice",
    createdAt: fixedDate(),
  });
}

function buildAttachmentOutput(input: {
  id: string;
  sessionId: string;
  matchId: string | null;
  type: AttachmentType;
  originalFileName: string;
}): AttachmentOutputDto {
  return new AttachmentOutputDto({
    id: input.id,
    sessionId: input.sessionId,
    matchId: input.matchId,
    scope:
      input.matchId === null ? AttachmentScope.SESSION : AttachmentScope.MATCH,
    type: input.type,
    s3Key: `uploads/${input.id}`,
    contentType: "image/png",
    size: 100,
    width: 100,
    height: 100,
    originalFileName: input.originalFileName,
    createdAt: fixedDate(),
  });
}

function buildExtractionResultOutput(
  matchId: string,
): ExtractionResultOutputDto {
  return new ExtractionResultOutputDto({
    id: `extraction-${matchId}`,
    attachmentId: `match-attachment-${matchId}`,
    matchId,
    status: ExtractionStatus.DONE,
    model: "ocr-v1",
    result: null,
    createdAt: fixedDate(),
  });
}
