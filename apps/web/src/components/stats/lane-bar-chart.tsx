import { Card } from "@/components/ui/card";

export function LaneBarChart({
  data,
}: {
  readonly data: ReadonlyArray<{
    readonly label: string;
    readonly pct: number;
  }>;
}) {
  return (
    <Card className="space-y-[10px] px-[14px] py-[12px]">
      {data.map((row) => (
        <div key={row.label} className="flex items-center gap-[10px]">
          <div className="w-[40px] text-[11px] font-[800] text-[var(--pn-text-secondary)]">
            {row.label}
          </div>
          <div className="h-[12px] flex-1 overflow-hidden rounded-[999px] bg-[var(--pn-bg-card)]">
            <div
              className="h-full rounded-[999px] bg-[var(--pn-primary)]"
              style={{ width: `${Math.max(row.pct, 3)}%` }}
            />
          </div>
          <div className="w-[36px] text-right text-[10px] font-[800] text-[var(--pn-text-muted)]">
            {row.pct}%
          </div>
        </div>
      ))}
    </Card>
  );
}
