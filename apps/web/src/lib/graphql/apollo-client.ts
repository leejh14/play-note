"use client";

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import {
  extractSessionLocalIdFromPath,
  tryDecodeSessionId,
} from "@/lib/relay-id";
import { getDefaultSessionId, getToken, removeToken } from "@/lib/token";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
const SESSION_RESET_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "INVALID_TOKEN",
  "SESSION_NOT_FOUND",
]);

function findSessionIdInVariables(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findSessionIdInVariables(child);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.sessionId === "string") {
    const normalized = record.sessionId.trim();
    if (!normalized) return null;
    return tryDecodeSessionId(normalized) ?? normalized;
  }

  for (const child of Object.values(record)) {
    const found = findSessionIdInVariables(child);
    if (found) return found;
  }

  return null;
}

function resolveSessionId(operation: { variables?: Record<string, unknown> }): string | null {
  const variableSessionId = findSessionIdInVariables(operation.variables);
  if (variableSessionId) return variableSessionId;

  if (typeof window !== "undefined") {
    const pathSessionId = extractSessionLocalIdFromPath(window.location.pathname);
    if (pathSessionId) return pathSessionId;
  }

  return getDefaultSessionId();
}

export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  const httpLink = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
  });

  const authLink = setContext((operation, previousContext) => {
    const sessionId = resolveSessionId(operation);
    const token = sessionId ? getToken(sessionId) : null;

    if (!sessionId || !token) {
      return {
        headers: {
          ...previousContext.headers,
        },
      };
    }

    return {
      headers: {
        ...previousContext.headers,
        "x-session-id": sessionId,
        "x-session-token": token,
      },
    };
  });

  const errorLink = onError(({ graphQLErrors, operation }) => {
    if (typeof window === "undefined") return;
    if (!graphQLErrors?.length) return;

    const shouldResetToken = graphQLErrors.some((error) => {
      const code = error.extensions?.code;
      return typeof code === "string" && SESSION_RESET_ERROR_CODES.has(code);
    });
    if (!shouldResetToken) return;

    const sessionId = resolveSessionId(operation);
    if (!sessionId) return;
    removeToken(sessionId);
  });

  return new ApolloClient({
    link: ApolloLink.from([authLink, errorLink, httpLink]),
    cache: new InMemoryCache(),
    devtools: {
      enabled: process.env.NODE_ENV !== "production",
    },
  });
}
