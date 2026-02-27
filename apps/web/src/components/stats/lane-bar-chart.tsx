export function LaneBarChart({
  data,
}: {
  readonly data: ReadonlyArray<{
    readonly label: string;
    readonly pct: number;
    readonly barWidthClass: string;
  }>;
}) {
  return (
    <div className="space-y-[10px] rounded-[16px] bg-white px-[14px] py-[12px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      {data.map((row) => (
        <div key={row.label} className="flex items-center gap-[10px]">
          <div className="w-[40px] text-[10px] font-[800] text-[var(--pn-text-secondary)]">
            {row.label}
          </div>
          <div className="h-[10px] flex-1 overflow-hidden rounded-[999px] bg-[var(--pn-bg-card)]">
            <div
              className={`h-full rounded-[999px] bg-[var(--pn-primary)] ${row.barWidthClass}`}
            />
          </div>
          <div className="w-[36px] text-right text-[10px] font-[800] text-[var(--pn-text-muted)]">
            {row.pct}%
          </div>
        </div>
      ))}
    </div>
  );
}
