const DEFAULT_GRAPHQL_ENDPOINT = process.env.E2E_API_URL ?? "http://127.0.0.1:4000/graphql";

type GraphqlError = {
  readonly message: string;
  readonly extensions?: {
    readonly code?: string;
  };
};

type GraphqlResponse<T> = {
  readonly data?: T;
  readonly errors?: GraphqlError[];
};

export type CreatedSession = {
  readonly globalId: string;
  readonly localId: string;
  readonly editorToken: string;
  readonly adminToken: string;
};

export type SessionSnapshot = {
  readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
  readonly matchCount: number;
  readonly attachmentCount: number;
  readonly matchAttachmentCount: number;
};

export async function createSessionViaApi(input?: {
  readonly contentType?: "LOL" | "FUTSAL";
  readonly title?: string;
  readonly startsAt?: string;
}): Promise<CreatedSession> {
  const contentType = input?.contentType ?? "LOL";
  const title =
    input?.title ??
    `e2e-${contentType.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const startsAt = input?.startsAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const response = await executeGraphql<{
    readonly createSession: {
      readonly session: {
        readonly id: string;
      } | null;
      readonly editorToken: string;
      readonly adminToken: string;
    };
  }>({
    query: `
      mutation CreateSession($input: CreateSessionInput!) {
        createSession(input: $input) {
          session {
            id
          }
          editorToken
          adminToken
        }
      }
    `,
    variables: {
      input: {
        contentType,
        title,
        startsAt,
      },
    },
  });

  const payload = response.createSession;
  const globalId = payload.session?.id;
  if (!globalId) {
    throw new Error("createSession 응답에 session.id가 없습니다.");
  }

  return {
    globalId,
    localId: decodeGlobalId(globalId, "Session"),
    editorToken: payload.editorToken,
    adminToken: payload.adminToken,
  };
}

export async function getSessionSnapshotViaApi(input: {
  readonly globalSessionId: string;
  readonly localSessionId: string;
  readonly token: string;
}): Promise<SessionSnapshot> {
  const response = await executeGraphql<{
    readonly session: {
      readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
      readonly matches: Array<{
        readonly attachments: Array<{ readonly id: string }>;
      }>;
      readonly attachments: Array<{ readonly id: string }>;
    };
  }>({
    query: `
      query SessionSnapshot($sessionId: ID!) {
        session(sessionId: $sessionId) {
          status
          matches {
            attachments {
              id
            }
          }
          attachments {
            id
          }
        }
      }
    `,
    variables: {
      sessionId: input.globalSessionId,
    },
    headers: {
      "x-session-id": input.localSessionId,
      "x-session-token": input.token,
    },
  });

  const session = response.session;
  const matchAttachmentCount = session.matches.reduce(
    (count, match) => count + match.attachments.length,
    0,
  );

  return {
    status: session.status,
    matchCount: session.matches.length,
    attachmentCount: session.attachments.length,
    matchAttachmentCount,
  };
}

async function executeGraphql<T>(input: {
  readonly query: string;
  readonly variables?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
}): Promise<T> {
  const response = await fetch(DEFAULT_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(input.headers ?? {}),
    },
    body: JSON.stringify({
      query: input.query,
      variables: input.variables ?? {},
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP 요청 실패: ${response.status}`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length) {
    const firstError = payload.errors[0];
    const code = firstError?.extensions?.code;
    throw new Error(
      `GraphQL 에러: ${firstError?.message ?? "unknown"}${code ? ` (${code})` : ""}`,
    );
  }

  if (!payload.data) {
    throw new Error("GraphQL 응답 data가 없습니다.");
  }

  return payload.data;
}

function decodeGlobalId(globalId: string, expectedType: string): string {
  const decoded = Buffer.from(globalId, "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex <= 0) {
    throw new Error(`잘못된 global ID 형식입니다: ${globalId}`);
  }
  const typeName = decoded.slice(0, separatorIndex);
  if (typeName !== expectedType) {
    throw new Error(`Global ID 타입 불일치: expected=${expectedType}, actual=${typeName}`);
  }
  return decoded.slice(separatorIndex + 1);
}
