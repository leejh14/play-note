"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { IconGear, IconPlus } from "@/components/icons";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { IconButton } from "@/components/ui/icon-button";
import { SessionCard } from "@/components/session/session-card";
import { SessionContextSwitcher } from "@/components/session/session-context-switcher";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-[rgba(15,23,42,0.08)] px-[16px] py-[14px] sm:px-[20px] lg:px-[28px]">
              <div>
                <div className="text-[18px] font-[900] tracking-[-0.2px] text-[var(--pn-text-primary)]">
                  PlayNote
                </div>
                <div className="mt-[2px] text-[11px] font-[600] text-[var(--pn-text-muted)]">
                  세션 대시보드
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <Button asChild size="sm" className="gap-[6px]">
                  <Link href="/sessions/new">
                    <IconPlus className="h-[16px] w-[16px]" />
                    New Session
                  </Link>
                </Button>
                <IconButton aria-label="Settings">
                  <IconGear className="h-[20px] w-[20px]" />
                </IconButton>
              </div>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.08)] px-[16px] pb-[10px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              <ToggleGroup
                type="single"
                value={filterKey}
                onValueChange={(nextValue) => {
                  if (!nextValue) return;
                  setFilterKey(nextValue as FilterKey);
                }}
                className="inline-flex items-center rounded-[999px] border border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.03)] p-[4px]"
              >
                {(["ALL", "LOL", "FUTSAL"] as const).map((item) => (
                  <ToggleGroupItem
                    key={item}
                    value={item}
                    className="h-[30px] rounded-[999px] border-0 bg-transparent px-[14px] text-[12px] font-[700] data-[state=on]:bg-[var(--pn-primary)] data-[state=on]:text-[var(--pn-text-on-primary)] data-[state=off]:bg-transparent data-[state=off]:text-[var(--pn-text-secondary)]"
                  >
                    {item === "ALL" ? "All" : item === "LOL" ? "LoL" : "Futsal"}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <SessionContextSwitcher
                activeSessionId={activeSessionId}
                sessions={storedSessions}
                onSelect={selectSession}
                onRemove={removeSession}
              />
            </div>

            <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              {!hasAuth ? (
                <TokenRequiredState />
              ) : error ? (
                <div className="rounded-[16px] border border-[var(--pn-border)] bg-white px-[16px] py-[18px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
                  {getGraphqlErrorMessage(error.graphQLErrors[0]?.extensions?.code as string | undefined)}
                </div>
              ) : (
                <div className="flex flex-col gap-[12px]">
                  {!loading && edges.length === 0 ? (
                    <div className="rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-white px-[16px] py-[18px] text-[12px] font-[600] text-[var(--pn-text-muted)]">
                      표시할 세션이 없습니다. 새 세션을 생성해보세요.
                    </div>
                  ) : null}
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
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
}
