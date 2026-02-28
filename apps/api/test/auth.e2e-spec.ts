import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { IncomingHttpHeaders } from 'http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  GraphQLModule,
  GraphQLSchemaHost,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { graphql, GraphQLSchema } from 'graphql';
import { SessionTokenGuard } from '@auth/guards/session-token.guard';
import { SessionTokenService } from '@auth/services/session-token.service';
import { Public } from '@auth/decorators/public.decorator';
import { RequireAdmin } from '@auth/decorators/require-admin.decorator';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { AUTH_ERROR_CODES } from '@auth/constants/error-codes';
import { GraphQLExceptionFilter } from '@shared/presentation/filters/graphql-exception.filter';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';

const schemaOutputPath = join(__dirname, '.generated/auth-schema.graphql');

@Resolver()
class AuthProbeResolver {
  @Query(() => String, { nullable: false })
  securePing(@CurrentAuth() auth: AuthContext): string {
    return `${auth.role}:${auth.sessionId}`;
  }

  @Public()
  @Query(() => String, { nullable: false })
  publicPing(): string {
    return 'public';
  }

  @RequireAdmin()
  @Mutation(() => String, { nullable: false })
  adminPing(@CurrentAuth() auth: AuthContext): string {
    return `admin:${auth.sessionId}`;
  }
}

describe('Auth guard flow (e2e)', () => {
  let app: INestApplication;
  let schema: GraphQLSchema;

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
        AuthProbeResolver,
        {
          provide: SessionTokenService,
          useValue: sessionTokenService,
        },
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
    await app.init();
    schema = app.get(GraphQLSchemaHost).schema;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    sessionTokenService.validateToken.mockImplementation(
      async (input: { sessionId: string; token: string }) => {
        if (input.sessionId === 'session-1' && input.token === 'editor-token') {
          return { sessionId: 'session-1', role: 'editor' as const };
        }
        if (input.sessionId === 'session-1' && input.token === 'admin-token') {
          return { sessionId: 'session-1', role: 'admin' as const };
        }
        if (input.sessionId === 'missing-session') {
          throw new UnauthorizedException({
            message: 'Unauthorized',
            errorCode: AUTH_ERROR_CODES.SESSION_NOT_FOUND,
          });
        }
        throw new UnauthorizedException({
          message: 'Unauthorized',
          errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
        });
      },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns UNAUTHORIZED when protected query has no headers', async () => {
    const result = await executeGraphql({
      schema,
      source: 'query { securePing }',
    });

    expect(result.errors?.[0]?.extensions?.code).toBe(
      AUTH_ERROR_CODES.UNAUTHORIZED,
    );
  });

  it('returns INVALID_TOKEN when token is invalid', async () => {
    const result = await executeGraphql({
      schema,
      source: 'query { securePing }',
      headers: {
        'x-session-id': 'session-1',
        'x-session-token': 'wrong-token',
      },
    });

    expect(result.errors?.[0]?.extensions?.code).toBe(
      AUTH_ERROR_CODES.INVALID_TOKEN,
    );
  });

  it('returns SESSION_NOT_FOUND when session does not exist', async () => {
    const result = await executeGraphql({
      schema,
      source: 'query { securePing }',
      headers: {
        'x-session-id': 'missing-session',
        'x-session-token': 'editor-token',
      },
    });

    expect(result.errors?.[0]?.extensions?.code).toBe(
      AUTH_ERROR_CODES.SESSION_NOT_FOUND,
    );
  });

  it('allows @Public query without token', async () => {
    const result = await executeGraphql({
      schema,
      source: 'query { publicPing }',
    });

    expect(result.errors).toBeUndefined();
    expect((result.data as { publicPing: string }).publicPing).toBe('public');
  });

  it('returns FORBIDDEN for @RequireAdmin mutation with editor role', async () => {
    const result = await executeGraphql({
      schema,
      source: 'mutation { adminPing }',
      headers: {
        'x-session-id': 'session-1',
        'x-session-token': 'editor-token',
      },
    });

    expect(result.errors?.[0]?.extensions?.code).toBe(
      AUTH_ERROR_CODES.FORBIDDEN,
    );
  });

  it('allows @RequireAdmin mutation with admin role', async () => {
    const result = await executeGraphql({
      schema,
      source: 'mutation { adminPing }',
      headers: {
        'x-session-id': 'session-1',
        'x-session-token': 'admin-token',
      },
    });

    expect(result.errors).toBeUndefined();
    expect((result.data as { adminPing: string }).adminPing).toBe(
      'admin:session-1',
    );
  });
});

async function executeGraphql(input: {
  schema: GraphQLSchema;
  source: string;
  headers?: IncomingHttpHeaders;
}): Promise<Awaited<ReturnType<typeof graphql>>> {
  return graphql({
    schema: input.schema,
    source: input.source,
    contextValue: {
      req: {
        headers: input.headers ?? {},
      },
    },
  });
}
