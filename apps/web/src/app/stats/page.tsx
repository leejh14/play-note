import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { StatsTable } from "@/components/stats/stats-table";
import { statisticsRows } from "@/lib/mock-data";

export default function StatsPage() {
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
          <StatsTable rows={statisticsRows} />
          <div className="pt-[24px] text-center text-[10px] font-[600] text-[var(--pn-text-muted)]">
            Tap a friend to see detailed stats
          </div>
        </div>

        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}
