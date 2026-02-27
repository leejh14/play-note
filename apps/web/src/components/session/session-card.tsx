import { Badge } from "@/components/ui/badge";
import type { SessionStatus, SessionContent } from "@/lib/mock-data";

export function SessionCard({
  title,
  status,
  dateLabel,
  membersLabel,
  matchesLabel,
  content,
  teamA,
  teamB,
  note,
}: {
  readonly title: string;
  readonly status: SessionStatus;
  readonly dateLabel: string;
  readonly membersLabel: string;
  readonly matchesLabel: string;
  readonly content: SessionContent;
  readonly teamA?: string;
  readonly teamB?: string;
  readonly note?: string;
}) {
  const statusTone =
    status === "Confirmed" ? "blueSoft" : "neutral";

  return (
    <div className="rounded-[16px] bg-white px-[14px] py-[14px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[var(--pn-primary-light)] text-[12px] font-[700] text-[var(--pn-primary)]">
            {content === "LoL" ? "LoL" : "F"}
          </div>
          <div className="text-[15px] font-[700] text-[var(--pn-text-primary)]">
            {title}
          </div>
        </div>
        <Badge tone={statusTone}>{status}</Badge>
      </div>

      <div className="mt-[10px] flex flex-wrap items-center gap-x-[12px] gap-y-[6px] text-[11px] font-[500] text-[var(--pn-text-muted)]">
        <span>{dateLabel}</span>
        <span>{membersLabel}</span>
        {matchesLabel ? <span>{matchesLabel}</span> : null}
      </div>

      {teamA && teamB ? (
        <div className="mt-[10px] flex gap-[8px]">
          <div className="flex-1 rounded-[12px] bg-[var(--pn-primary-light)] px-[10px] py-[8px] text-[11px] font-[600] text-[var(--pn-primary)]">
            {teamA}
          </div>
          <div className="flex-1 rounded-[12px] bg-[var(--pn-pink-soft)] px-[10px] py-[8px] text-[11px] font-[600] text-[var(--pn-pink)]">
            {teamB}
          </div>
        </div>
      ) : note ? (
        <div className="mt-[10px] text-[11px] font-[500] text-[var(--pn-text-muted)]">
          {note}
        </div>
      ) : null}
    </div>
  );
}
