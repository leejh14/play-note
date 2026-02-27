import Link from "next/link";
import type { FriendStatRow } from "@/lib/mock-data";

export function StatsTable({
  rows,
}: {
  readonly rows: readonly FriendStatRow[];
}) {
  return (
    <div className="flex flex-col">
      {rows.map((r) => (
        <Link
          key={r.friendId}
          href={`/stats/${r.friendId}`}
          className="grid grid-cols-[1fr_64px_64px_64px] items-center gap-[8px] border-b border-[var(--pn-border)] py-[12px]"
        >
          <div className="flex items-center gap-[10px]">
            <div className="w-[16px] text-[11px] font-[800] text-[var(--pn-text-muted)]">
              {r.rank}
            </div>
            <div className="text-[13px] font-[800] text-[var(--pn-text-primary)]">
              {r.name}
            </div>
          </div>
          <div className="text-right text-[12px] font-[800] text-[var(--pn-primary)]">
            {r.wr}
          </div>
          <div className="text-right text-[12px] font-[700] text-[var(--pn-text-secondary)]">
            {r.wl}
          </div>
          <div className="ml-auto flex h-[22px] w-fit items-center justify-center rounded-[8px] bg-[var(--pn-bg-card)] px-[10px] text-[10px] font-[900] text-[var(--pn-text-secondary)]">
            {r.lane}
          </div>
        </Link>
      ))}
    </div>
  );
}
