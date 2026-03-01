"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { Button } from "@/components/ui/button";
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

type SessionStatus = "SCHEDULED" | "CONFIRMED" | "DONE";
type AuthErrorCode = "UNAUTHORIZED" | "INVALID_TOKEN" | "SESSION_NOT_FOUND";

const AUTH_ERROR_CODES = new Set<AuthErrorCode>([
  "UNAUTHORIZED",
  "INVALID_TOKEN",
  "SESSION_NOT_FOUND",
]);

function EntryLoading() {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-[13px] font-[700] text-[var(--pn-text-muted)]">
            세션 정보를 불러오는 중...
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
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
  const currentToken = useMemo(() => {
    if (!localSessionId) return null;
    if (tokenFromQuery) return tokenFromQuery;
    return getToken(localSessionId);
  }, [localSessionId, tokenFromQuery]);

  useEffect(() => {
    if (!localSessionId || !tokenFromQuery) return;

    saveToken(localSessionId, tokenFromQuery);
    saveShareToken(localSessionId, tokenFromQuery);
    setActiveSessionId(localSessionId);
  }, [localSessionId, tokenFromQuery]);

  const queryContext = useMemo(() => {
    if (!localSessionId || !currentToken) return undefined;
    return {
      headers: {
        "x-session-id": localSessionId,
        "x-session-token": currentToken,
      },
    };
  }, [localSessionId, currentToken]);

  const shouldFetchSession = Boolean(globalSessionId && localSessionId && currentToken);

  const { data, loading, error } = useQuery<{
    session: {
      status: SessionStatus;
    };
  }>(SESSION_QUERY, {
    variables: { sessionId: globalSessionId },
    skip: !shouldFetchSession,
    fetchPolicy: "network-only",
    context: queryContext,
  });

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
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <div className="flex flex-1 items-center px-[16px]">
            <TokenRequiredState
              title="세션 링크가 올바르지 않습니다"
              description="세션 링크를 다시 확인해주세요."
            />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (errorCode && AUTH_ERROR_CODES.has(errorCode as AuthErrorCode)) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <div className="flex flex-1 items-center px-[16px]">
            <TokenRequiredState
              title="다시 초대 링크가 필요합니다"
              description={getGraphqlErrorMessage(errorCode)}
            />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (!currentToken) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <div className="flex flex-1 items-center px-[16px]">
            <TokenRequiredState />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (error) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col">
          <StatusBar />
          <div className="flex flex-1 items-center px-[16px]">
            <div className="flex w-full flex-col items-center gap-[10px] rounded-[16px] border border-[var(--pn-border)] bg-white px-[20px] py-[28px] text-center">
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
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (loading || !data) {
    return <EntryLoading />;
  }

  return <EntryLoading />;
}
