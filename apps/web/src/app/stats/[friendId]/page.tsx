"use client";

import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { LaneBarChart } from "@/components/stats/lane-bar-chart";
import { ChampionTable } from "@/components/stats/champion-table";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { STATS_DETAIL_QUERY } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { getDefaultSessionId, getToken } from "@/lib/token";

type StatsDetailQueryData = {
  readonly statsDetail: {
    readonly friend: {
      readonly id: string;
      readonly displayName: string;
      readonly riotGameName: string | null;
      readonly riotTagLine: string | null;
    };
    readonly winRate: number | null;
    readonly totalMatches: number;
    readonly topLane: string | null;
    readonly laneDistribution: Array<{
      readonly lane: string;
      readonly playCount: number;
    }>;
    readonly topChampions: Array<{
      readonly champion: string;
      readonly wins: number;
      readonly games: number;
      readonly winRate: number;
    }>;
  };
};

function StatCard({
  label,
  value,
  sub,
}: {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[16px] bg-white px-[10px] py-[14px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <div className="text-[10px] font-[700] text-[var(--pn-text-muted)]">{label}</div>
      <div className="mt-[6px] text-[18px] font-[900] text-[var(--pn-primary)]">{value}</div>
      <div className="mt-[4px] text-[10px] font-[700] text-[var(--pn-text-muted)]">{sub}</div>
    </div>
  );
}

export default function StatsFriendDetailPage() {
  const params = useParams<{ friendId: string }>();
  const activeSessionId = getDefaultSessionId();
  const activeToken = activeSessionId ? getToken(activeSessionId) : null;
  const hasAuth = Boolean(activeSessionId && activeToken);

  const { data, loading, error } = useQuery<StatsDetailQueryData>(STATS_DETAIL_QUERY, {
    variables: {
      input: {
        friendId: decodeURIComponent(params.friendId),
      },
    },
    skip: !hasAuth,
  });

  const detail = data?.statsDetail;
  const laneRows =
    detail?.laneDistribution.map((row) => ({
      label: row.lane,
      pct:
        detail.totalMatches > 0
          ? Math.round((row.playCount / detail.totalMatches) * 100)
          : 0,
    })) ?? [];
  const championRows =
    detail?.topChampions.map((row) => ({
      name: row.champion,
      wins: row.wins,
      games: row.games,
      wr: `${Math.round(row.winRate * 100)}%`,
    })) ?? [];

  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader title="Statistics" backHref="/stats" />

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px]">
          {!hasAuth ? (
            <TokenRequiredState />
          ) : error ? (
            <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
              {getGraphqlErrorMessage(error.graphQLErrors[0]?.extensions?.code as string | undefined)}
            </div>
          ) : loading || !detail ? (
            <div className="py-[20px] text-center text-[12px] font-[600] text-[var(--pn-text-muted)]">
              불러오는 중...
            </div>
          ) : (
            <>
              <div className="text-[14px] font-[900] text-[var(--pn-text-primary)]">
                {detail.friend.displayName}
              </div>
              <div className="mt-[6px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
                {detail.friend.riotGameName && detail.friend.riotTagLine
                  ? `${detail.friend.riotGameName}#${detail.friend.riotTagLine}`
                  : "Riot ID not linked"}{" "}
                · {detail.totalMatches} matches played
              </div>

              <div className="mt-[12px] flex gap-[12px]">
                <StatCard
                  label="Win Rate"
                  value={detail.winRate === null ? "–" : `${Math.round(detail.winRate * 100)}%`}
                  sub={`${detail.totalMatches} matches`}
                />
                <StatCard
                  label="Top Lane"
                  value={detail.topLane ?? "–"}
                  sub="most played"
                />
              </div>

              <div className="mt-[14px] text-[13px] font-[900] text-[var(--pn-text-primary)]">
                Lane Distribution
              </div>
              <div className="mt-[10px]">
                <LaneBarChart data={laneRows} />
              </div>

              <div className="mt-[14px] text-[13px] font-[900] text-[var(--pn-text-primary)]">
                Most Winning Champions
              </div>
              <div className="mt-[10px]">
                <ChampionTable rows={championRows} />
              </div>
            </>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
