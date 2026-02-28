"use client";

import { useQuery } from "@apollo/client";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { StatsTable, type StatsTableRow } from "@/components/stats/stats-table";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { STATS_OVERVIEW_QUERY } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { getDefaultSessionId, getToken } from "@/lib/token";

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
  const activeSessionId = getDefaultSessionId();
  const activeToken = activeSessionId ? getToken(activeSessionId) : null;
  const hasAuth = Boolean(activeSessionId && activeToken);

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
      <div className="flex min-h-screen flex-col">
        <StatusBar />

        <div className="flex h-[44px] items-center justify-center px-[16px]">
          <div className="text-[18px] font-[900] text-[var(--pn-text-primary)]">Statistics</div>
        </div>

        <div className="px-[16px] pt-[6px]">
          <div className="grid grid-cols-[1fr_64px_64px_64px] gap-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
            <div>Friend</div>
            <div className="text-right">WR</div>
            <div className="text-right">W-L</div>
            <div className="text-right">Lane</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[10px] pt-[10px]">
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

        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}
