"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { IconGear, IconPlus } from "@/components/icons";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { IconButton } from "@/components/ui/icon-button";
import { SessionCard } from "@/components/session/session-card";
import { SessionContextSwitcher } from "@/components/session/session-context-switcher";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { Button } from "@/components/ui/button";
import { SESSIONS_QUERY } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { useActiveSession } from "@/lib/use-active-session";

type SessionNode = {
  readonly id: string;
  readonly title: string | null;
  readonly contentType: "LOL" | "FUTSAL";
  readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
  readonly startsAt: string;
  readonly attendingCount: number;
  readonly matchCount: number;
};

type SessionsQueryData = {
  readonly sessions: {
    readonly edges: Array<{
      readonly cursor: string;
      readonly node: SessionNode;
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  };
};

type FilterKey = "ALL" | "LOL" | "FUTSAL";

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function SessionsPage() {
  const [filterKey, setFilterKey] = useState<FilterKey>("ALL");
  const {
    activeSessionId,
    hasAuth,
    storedSessions,
    selectSession,
    removeSession,
  } = useActiveSession();

  const variables = useMemo(
    () => ({
      first: 10,
      filter: filterKey === "ALL" ? undefined : { contentType: filterKey },
      orderBy: [
        { field: "DATE_PROXIMITY", direction: "ASC" },
        { field: "STATUS_PRIORITY", direction: "ASC" },
      ],
    }),
    [filterKey],
  );

  const { data, loading, error, fetchMore, refetch } = useQuery<SessionsQueryData>(SESSIONS_QUERY, {
    variables,
    skip: !hasAuth,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (!hasAuth) return;
    void refetch();
  }, [activeSessionId, hasAuth, refetch]);

  const edges = data?.sessions.edges ?? [];
  const pageInfo = data?.sessions.pageInfo;

  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />

        <div className="flex items-center justify-between px-[16px] py-[10px]">
          <div className="text-[18px] font-[800] tracking-[-0.2px] text-[var(--pn-text-primary)]">
            PlayNote
          </div>
          <IconButton aria-label="Settings">
            <IconGear className="h-[20px] w-[20px]" />
          </IconButton>
        </div>

        <div className="px-[16px] pb-[8px]">
          <div className="inline-flex items-center rounded-[999px] bg-[var(--pn-bg-card)] p-[4px]">
            {(["ALL", "LOL", "FUTSAL"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilterKey(item)}
                className={`h-[28px] rounded-[999px] px-[12px] text-[12px] font-[700] ${
                  filterKey === item
                    ? "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)]"
                    : "text-[var(--pn-text-secondary)]"
                }`}
              >
                {item === "ALL" ? "All" : item === "LOL" ? "LoL" : "Futsal"}
              </button>
            ))}
          </div>
          <SessionContextSwitcher
            activeSessionId={activeSessionId}
            sessions={storedSessions}
            onSelect={selectSession}
            onRemove={removeSession}
          />
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[10px]">
          {!hasAuth ? (
            <TokenRequiredState />
          ) : error ? (
            <div className="rounded-[16px] border border-[var(--pn-border)] bg-white px-[16px] py-[18px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
              {getGraphqlErrorMessage(error.graphQLErrors[0]?.extensions?.code as string | undefined)}
            </div>
          ) : (
            <div className="flex flex-col gap-[12px]">
              {edges.map(({ node }) => (
                <Link key={node.id} href={`/s/${encodeURIComponent(node.id)}`} className="block">
                  <SessionCard
                    title={node.title || "Untitled Session"}
                    status={node.status}
                    dateLabel={formatDateLabel(node.startsAt)}
                    membersLabel={`참가 ${node.attendingCount}`}
                    matchesLabel={`${node.matchCount} matches`}
                    content={node.contentType}
                  />
                </Link>
              ))}

              {loading ? (
                <div className="py-[10px] text-center text-[11px] font-[600] text-[var(--pn-text-muted)]">
                  불러오는 중...
                </div>
              ) : null}

              {hasAuth && pageInfo?.hasNextPage ? (
                <Button
                  variant="secondary"
                  className="h-[38px] rounded-[10px] text-[12px]"
                  onClick={() =>
                    fetchMore({
                      variables: {
                        ...variables,
                        after: pageInfo.endCursor,
                      },
                    })
                  }
                >
                  더 보기
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="relative">
          <BottomTabBar />
          <Link
            href="/sessions/new"
            aria-label="New Session"
            className="absolute right-[16px] top-[-30px] flex h-[60px] w-[60px] items-center justify-center rounded-[999px] bg-[var(--pn-primary)] shadow-[0_10px_22px_rgba(33,150,243,0.35)]"
          >
            <IconPlus className="h-[28px] w-[28px]" />
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
