import Link from "next/link";
import { IconGear, IconPlus } from "@/components/icons";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { IconButton } from "@/components/ui/icon-button";
import { SessionCard } from "@/components/session/session-card";
import { sessions } from "@/lib/mock-data";

export default function SessionsPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />

        <div className="flex items-center justify-between px-[16px] py-[10px]">
          <div className="text-[18px] font-[800] tracking-[-0.2px] text-[var(--pn-text-primary)]">
            PlayNote
          </div>
          <IconButton aria-label="Settings">
            <IconGear className="h-[20px] w-[20px]" />
          </IconButton>
        </div>

        <div className="px-[16px] pb-[8px]">
          <div className="inline-flex items-center rounded-[999px] bg-[var(--pn-bg-card)] p-[4px]">
            <button className="h-[28px] rounded-[999px] bg-[var(--pn-primary)] px-[12px] text-[12px] font-[700] text-[var(--pn-text-on-primary)]">
              All
            </button>
            <button className="h-[28px] rounded-[999px] px-[12px] text-[12px] font-[700] text-[var(--pn-text-secondary)]">
              LoL
            </button>
            <button className="h-[28px] rounded-[999px] px-[12px] text-[12px] font-[700] text-[var(--pn-text-secondary)]">
              Futsal
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[16px] pt-[10px]">
          <div className="flex flex-col gap-[12px]">
            {sessions.map((s) => (
              <Link key={s.id} href={`/s/${s.id}/detail`} className="block">
                <SessionCard
                  title={s.title}
                  status={s.status}
                  dateLabel={s.dateLabel}
                  membersLabel={s.membersLabel}
                  matchesLabel={s.matchesLabel}
                  content={s.content}
                  teamA={s.teamA}
                  teamB={s.teamB}
                  note={s.note}
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <BottomTabBar />
          <Link
            href="/sessions/new"
            aria-label="New Session"
            className="absolute right-[16px] top-[-30px] flex h-[60px] w-[60px] items-center justify-center rounded-[999px] bg-[var(--pn-primary)] shadow-[0_10px_22px_rgba(33,150,243,0.35)]"
          >
            <IconPlus className="h-[28px] w-[28px]" />
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
