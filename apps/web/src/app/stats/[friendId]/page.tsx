import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { LaneBarChart } from "@/components/stats/lane-bar-chart";
import { ChampionTable } from "@/components/stats/champion-table";

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
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader title="Statistics" backHref="/stats" />

        <div className="px-[16px] pt-[6px]">
          <div className="flex h-[40px] items-center justify-between rounded-[12px] bg-[var(--pn-bg-card)] px-[12px]">
            <div className="text-[12px] font-[800] text-[var(--pn-text-primary)]">Junho</div>
            <div className="text-[12px] font-[900] text-[var(--pn-text-muted)]">▾</div>
          </div>
          <div className="mt-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
            Junho#KR1 · 14 matches played
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[12px]">
          <div className="flex gap-[12px]">
            <StatCard label="Win Rate" value="64%" sub="9W 5L" />
            <StatCard label="Matches" value="14" sub="confirmed" />
            <StatCard label="Top Lane" value="MID" sub="8 times" />
          </div>

          <div className="mt-[14px] text-[13px] font-[900] text-[var(--pn-text-primary)]">Lane Distribution</div>
          <div className="mt-[10px]">
            <LaneBarChart
              data={[
                { label: "MID", pct: 57, barWidthClass: "w-[57%]" },
                { label: "ADC", pct: 21, barWidthClass: "w-[21%]" },
                { label: "SUP", pct: 14, barWidthClass: "w-[14%]" },
                { label: "TOP", pct: 7, barWidthClass: "w-[7%]" },
              ]}
            />
          </div>

          <div className="mt-[14px] text-[13px] font-[900] text-[var(--pn-text-primary)]">Most Winning Champions</div>
          <div className="mt-[10px]">
            <ChampionTable
              rows={[
                { name: "Ahri", wins: 5, games: 6, wr: "83%" },
                { name: "Syndra", wins: 3, games: 4, wr: "75%" },
                { name: "Orianna", wins: 1, games: 2, wr: "50%" },
              ]}
            />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
