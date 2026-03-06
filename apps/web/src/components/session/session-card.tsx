import Link from "next/link";
import { Calendar, Users, Swords, Image } from "lucide-react";
import type { Session } from "@/lib/mock-data";

const statusStyle: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "bg-[var(--primary-light)]", text: "text-[var(--primary)]" },
  scheduled: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-700)]" },
  done: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-500)]" },
};

const statusLabel: Record<string, string> = {
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  done: "Done",
};

function ContentTypeBadge({ type }: { type: "lol" | "futsal" }) {
  return (
    <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-light)]">
      <span className="text-[14px] font-semibold text-[var(--primary)]">
        {type === "lol" ? "LoL" : "⚽"}
      </span>
    </div>
  );
}

export function SessionCard({ session }: { session: Session }) {
  const badge = statusStyle[session.status];

  return (
    <Link href={`/s/${session.id}`} className="block">
      <div className="flex flex-col gap-[14px] rounded-[var(--radius-lg)] bg-[var(--white)] p-[20px]">
        {/* Top row */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <ContentTypeBadge type={session.contentType} />
            <span className="text-[17px] font-bold text-[var(--black)]">
              {session.title}
            </span>
          </div>
          <span
            className={`rounded-[var(--radius-full)] px-[10px] py-[4px] text-[11px] font-semibold ${badge.bg} ${badge.text}`}
          >
            {statusLabel[session.status]}
          </span>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-[16px]">
          <span className="flex items-center gap-[4px] text-[13px] text-[var(--gray-500)]">
            <Calendar size={14} />
            {session.date}
          </span>
          <span className="flex items-center gap-[4px] text-[13px] text-[var(--gray-500)]">
            <Users size={14} />
            {session.status === "scheduled"
              ? `${session.members.filter((m) => m.attendance === "yes").length} / ${session.memberCount}`
              : `${session.memberCount} members`}
          </span>
          {session.matchCount > 0 && (
            <span className="flex items-center gap-[4px] text-[13px] text-[var(--gray-500)]">
              <Swords size={14} />
              {session.matchCount} matches
            </span>
          )}
          {session.photoCount > 0 && (
            <span className="flex items-center gap-[4px] text-[13px] text-[var(--gray-500)]">
              <Image size={14} />
              {session.photoCount} photos
            </span>
          )}
        </div>

        {/* Description for scheduled */}
        {session.status === "scheduled" && session.matchCount === 0 && (
          <p className="text-[12px] text-[var(--gray-500)]">
            Setup in progress — waiting for attendance
          </p>
        )}

        {/* Teams row */}
        {session.teamA.length > 0 && (
          <div className="flex w-full gap-[6px]">
            <div className="flex h-[28px] flex-1 items-center rounded-[6px] bg-[var(--primary-light)] px-[8px]">
              <span className="truncate text-[11px] font-medium text-[var(--primary)]">
                A: {session.teamA.slice(0, 2).join(", ")}
                {session.teamA.length > 2 && ` +${session.teamA.length - 2}`}
              </span>
            </div>
            <div className="flex h-[28px] flex-1 items-center rounded-[6px] bg-[var(--red-light)] px-[8px]">
              <span className="truncate text-[11px] font-medium text-[var(--red)]">
                B: {session.teamB.slice(0, 2).join(", ")}
                {session.teamB.length > 2 && ` +${session.teamB.length - 2}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
