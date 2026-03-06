"use client";

import { useEffect, useMemo } from "react";
import { useLazyQuery } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SESSION_QUERY } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { tryDecodeSessionId } from "@/lib/relay-id";
import {
  clearActiveSessionId,
  getActiveSessionId,
  getToken,
  removeToken,
  saveShareToken,
  saveToken,
  setActiveSessionId,
} from "@/lib/token";
import type { ReactNode } from "react";

type SessionStatus = "SCHEDULED" | "CONFIRMED" | "DONE";
type AuthErrorCode = "UNAUTHORIZED" | "INVALID_TOKEN" | "SESSION_NOT_FOUND";

const AUTH_ERROR_CODES = new Set<AuthErrorCode>([
  "UNAUTHORIZED",
  "INVALID_TOKEN",
  "SESSION_NOT_FOUND",
]);

function SessionEntryShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            {children}
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
}

function EntryLoading() {
  return (
    <SessionEntryShell>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-[13px] font-[700] text-[var(--pn-text-muted)]">
          세션 정보를 불러오는 중...
        </div>
      </div>
    </SessionEntryShell>
  );
}

function readEntryToken(localSessionId: string | null, tokenFromQuery: string | null): string | null {
  if (!localSessionId) return null;
  if (tokenFromQuery) return tokenFromQuery;
  return getToken(localSessionId);
}

export default function SessionEntryPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const globalSessionId = useMemo(
    () => decodeURIComponent(params.sessionId),
    [params.sessionId],
  );
  const localSessionId = useMemo(
    () => tryDecodeSessionId(globalSessionId),
    [globalSessionId],
  );
  const tokenFromQuery = searchParams.get("t")?.trim() || null;
  const isClient = typeof window !== "undefined";
  const requestToken = useMemo(() => {
    if (!isClient) return null;
    return readEntryToken(localSessionId, tokenFromQuery);
  }, [isClient, localSessionId, tokenFromQuery]);

  useEffect(() => {
    if (!localSessionId || !tokenFromQuery) return;

    saveToken(localSessionId, tokenFromQuery);
    saveShareToken(localSessionId, tokenFromQuery);
    setActiveSessionId(localSessionId);
  }, [localSessionId, tokenFromQuery]);

  const queryContext = useMemo(() => {
    if (!localSessionId || !requestToken) return undefined;
    return {
      headers: {
        "x-session-id": localSessionId,
        "x-session-token": requestToken,
      },
    };
  }, [localSessionId, requestToken]);

  const shouldFetchSession = Boolean(globalSessionId && localSessionId && requestToken);

  const [loadSession, { data, loading, error }] = useLazyQuery<{
    session: {
      status: SessionStatus;
    };
  }>(SESSION_QUERY, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!shouldFetchSession || !queryContext) return;
    void loadSession({
      variables: { sessionId: globalSessionId },
      context: queryContext,
    });
  }, [globalSessionId, loadSession, queryContext, shouldFetchSession]);

  const errorCode = useMemo(() => {
    const code = error?.graphQLErrors[0]?.extensions?.code;
    return typeof code === "string" ? code : null;
  }, [error]);

  useEffect(() => {
    if (!localSessionId || !errorCode) return;
    if (!AUTH_ERROR_CODES.has(errorCode as AuthErrorCode)) return;

    removeToken(localSessionId);
    if (getActiveSessionId() === localSessionId) {
      clearActiveSessionId();
    }
  }, [errorCode, localSessionId]);

  useEffect(() => {
    if (!localSessionId) return;
    if (!data?.session?.status) return;
    setActiveSessionId(localSessionId);

    const nextRoute =
      data.session.status === "SCHEDULED"
        ? `/s/${encodeURIComponent(globalSessionId)}/setup`
        : `/s/${encodeURIComponent(globalSessionId)}/detail`;
    router.replace(nextRoute);
  }, [data, globalSessionId, localSessionId, router]);

  if (!localSessionId) {
    return (
      <SessionEntryShell>
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <TokenRequiredState
            title="세션 링크가 올바르지 않습니다"
            description="세션 링크를 다시 확인해주세요."
          />
        </div>
      </SessionEntryShell>
    );
  }

  if (!isClient) {
    return <EntryLoading />;
  }

  if (errorCode && AUTH_ERROR_CODES.has(errorCode as AuthErrorCode)) {
    return (
      <SessionEntryShell>
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <TokenRequiredState
            title="다시 초대 링크가 필요합니다"
            description={getGraphqlErrorMessage(errorCode)}
          />
        </div>
      </SessionEntryShell>
    );
  }

  if (!requestToken) {
    return (
      <SessionEntryShell>
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <TokenRequiredState />
        </div>
      </SessionEntryShell>
    );
  }

  if (error) {
    return (
      <SessionEntryShell>
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <Card className="flex w-full flex-col items-center gap-[10px] border-[var(--pn-border)] px-[20px] py-[28px] text-center">
            <div className="text-[16px] font-[800] text-[var(--pn-text-primary)]">
              접근할 수 없습니다
            </div>
            <div className="text-[12px] font-[600] text-[var(--pn-text-muted)]">
              {getGraphqlErrorMessage(errorCode)}
            </div>
            <Button
              className="mt-[8px] h-[40px] rounded-[10px] px-[14px] text-[13px]"
              onClick={() => router.push("/sessions")}
            >
              세션 목록으로 이동
            </Button>
          </Card>
        </div>
      </SessionEntryShell>
    );
  }

  if (loading || !data) {
    return <EntryLoading />;
  }

  return <EntryLoading />;
}
