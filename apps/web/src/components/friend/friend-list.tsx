export function FriendRow({
  name,
  riotId,
  archived,
}: {
  readonly name: string;
  readonly riotId: string;
  readonly archived?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-[var(--pn-border)] py-[12px] ${
        archived ? "opacity-40" : ""
      }`}
    >
      <div>
        <div className="text-[13px] font-[800] text-[var(--pn-text-primary)]">
          {name}
        </div>
        <div className="text-[10px] font-[600] text-[var(--pn-text-muted)]">
          {riotId}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[10px] bg-[var(--pn-bg-card)] text-[12px] font-[900] text-[var(--pn-text-secondary)]">
          ✎
        </div>
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[10px] bg-[var(--pn-bg-card)] text-[12px] font-[900] text-[var(--pn-text-secondary)]">
          ⋮
        </div>
      </div>
    </div>
  );
}
