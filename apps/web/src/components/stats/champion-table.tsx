import { Badge } from "@/components/ui/badge";

export function ChampionTable({
  rows,
}: {
  readonly rows: ReadonlyArray<{
    readonly name: string;
    readonly wins: number;
    readonly games: number;
    readonly wr: string;
  }>;
}) {
  return (
    <div className="rounded-[16px] bg-white px-[14px] py-[12px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-[1fr_44px_44px_44px] gap-[8px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
        <div>Champion</div>
        <div className="text-right">Wins</div>
        <div className="text-right">Games</div>
        <div className="text-right">WR</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.name}
          className="mt-[10px] grid grid-cols-[1fr_44px_44px_44px] items-center gap-[8px]"
        >
          <div className="flex items-center gap-[10px]">
            <div className="h-[26px] w-[26px] rounded-[999px] bg-[var(--pn-border)]" />
            <div className="text-[12px] font-[800] text-[var(--pn-text-primary)]">
              {row.name}
            </div>
          </div>
          <div className="text-right text-[11px] font-[800] text-[var(--pn-primary)]">
            {row.wins}
          </div>
          <div className="text-right text-[11px] font-[700] text-[var(--pn-text-secondary)]">
            {row.games}
          </div>
          <div className="text-right">
            <Badge tone="blueSoft">{row.wr}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
