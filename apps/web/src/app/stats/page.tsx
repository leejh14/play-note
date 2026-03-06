"use client";

import { useQuery } from "@apollo/client";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatsTable, type StatsTableRow } from "@/components/stats/stats-table";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { SessionContextSwitcher } from "@/components/session/session-context-switcher";
import { STATS_OVERVIEW_QUERY } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { useActiveSession } from "@/lib/use-active-session";

type StatsOverviewQueryData = {
  readonly statsOverview: {
    readonly friends: Array<{
      readonly friendId: string;
      readonly friend: {
        readonly id: string;
        readonly displayName: string;
      };
      readonly winRate: number | null;
      readonly wins: number;
      readonly losses: number;
      readonly totalMatches: number;
      readonly topLane: string | null;
    }>;
  };
};

export default function StatsPage() {
  const {
    activeSessionId,
    hasAuth,
    storedSessions,
    selectSession,
    removeSession,
  } = useActiveSession();

  const { data, loading, error } = useQuery<StatsOverviewQueryData>(STATS_OVERVIEW_QUERY, {
    skip: !hasAuth,
  });

  const rows: StatsTableRow[] =
    data?.statsOverview.friends.map((item, index) => ({
      rank: index + 1,
      friendId: item.friend.id,
      name: item.friend.displayName,
      wr: item.winRate === null ? "–" : `${Math.round(item.winRate * 100)}%`,
      wl: `${item.wins}-${item.losses}`,
      lane: item.topLane ?? "–",
    })) ?? [];

  return (
    <PhoneFrame>
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <div className="border-b border-[rgba(15,23,42,0.08)] px-[16px] py-[14px] sm:px-[20px] lg:px-[28px]">
              <div className="text-[18px] font-[900] tracking-[-0.2px] text-[var(--pn-text-primary)]">
                Statistics
              </div>
              <div className="mt-[2px] text-[11px] font-[600] text-[var(--pn-text-muted)]">
                친구별 성과 요약
              </div>
            </div>

            <div className="border-b border-[rgba(15,23,42,0.08)] px-[16px] pb-[10px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              {hasAuth ? (
                <SessionContextSwitcher
                  activeSessionId={activeSessionId}
                  sessions={storedSessions}
                  onSelect={selectSession}
                  onRemove={removeSession}
                />
              ) : null}
              <div className="mt-[8px] grid grid-cols-[1fr_64px_64px_64px] gap-[8px] rounded-[10px] border border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.03)] px-[10px] py-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                <div>Friend</div>
                <div className="text-right">WR</div>
                <div className="text-right">W-L</div>
                <div className="text-right">Lane</div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              {!hasAuth ? (
                <TokenRequiredState />
              ) : error ? (
                <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
                  {getGraphqlErrorMessage(error.graphQLErrors[0]?.extensions?.code as string | undefined)}
                </div>
              ) : loading ? (
                <div className="py-[20px] text-center text-[12px] font-[600] text-[var(--pn-text-muted)]">
                  불러오는 중...
                </div>
              ) : (
                <>
                  <StatsTable rows={rows} />
                  <div className="pt-[24px] text-center text-[10px] font-[600] text-[var(--pn-text-muted)]">
                    Tap a friend to see detailed stats
                  </div>
                </>
              )}
            </div>
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
}
