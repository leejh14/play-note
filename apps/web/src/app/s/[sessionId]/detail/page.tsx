"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { sessions } from "@/lib/mock-data";

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const session = sessions.find((s) => s.id === params.sessionId) ?? sessions[0];
  const match = session.matches[0];

  if (!match) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--gray-500)]">No match data available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--white)]">
      {/* Header */}
      <div className="flex flex-col gap-[12px] px-[24px] pt-[16px] pb-[20px]">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-[var(--black)]" />
          </button>
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[10px] py-[4px] text-[11px] font-semibold text-[var(--primary)]">
            Completed
          </span>
        </div>
        <div className="flex items-center gap-[8px]">
          <h1 className="text-[22px] font-bold text-[var(--black)]">
            Match #{match.number}
          </h1>
          <span className="text-[14px] text-[var(--gray-500)]">
            {session.title}
          </span>
        </div>
      </div>

      {/* Result Card */}
      <div className="px-[24px]">
        <div className="flex items-center justify-around rounded-[var(--radius-lg)] bg-gradient-to-r from-[var(--primary-light)] to-[var(--red-light)] py-[24px]">
          <div className="flex flex-col items-center gap-[4px]">
            <span className="text-[12px] font-bold text-[var(--primary)]">
              Team A
            </span>
            <span className="rounded-[4px] bg-[var(--primary)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]">
              BLUE
            </span>
            <span className="text-[28px] font-bold text-[var(--primary)]">
              WIN
            </span>
          </div>
          <span className="text-[16px] font-medium text-[var(--gray-500)]">
            vs
          </span>
          <div className="flex flex-col items-center gap-[4px]">
            <span className="text-[12px] font-bold text-[var(--red)]">
              Team B
            </span>
            <span className="rounded-[4px] bg-[var(--red)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]">
              RED
            </span>
            <span className="text-[28px] font-bold text-[var(--red)]">
              LOSE
            </span>
          </div>
        </div>
      </div>

      {/* Lineup */}
      <div className="flex flex-col gap-[16px] px-[24px] py-[20px]">
        <h2 className="text-[20px] font-bold text-[var(--black)]">Lineup</h2>

        {/* Team A */}
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold text-[var(--primary)]">
            Team A · Blue Side
          </span>
          {match.teamAPlayers.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--primary-light)] px-[12px] py-[8px]"
            >
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[4px] bg-[var(--primary)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--white)]">
                  {p.lane}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {p.name}
                </span>
              </div>
              <span className="text-[13px] text-[var(--gray-700)]">
                {p.champion}
              </span>
            </div>
          ))}
        </div>

        {/* Team B */}
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold text-[var(--red)]">
            Team B · Red Side
          </span>
          {match.teamBPlayers.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--red-light)] px-[12px] py-[8px]"
            >
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[4px] bg-[var(--red)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--white)]">
                  {p.lane}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {p.name}
                </span>
              </div>
              <span className="text-[13px] text-[var(--gray-700)]">
                {p.champion}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* End Screen Section */}
      <div className="flex flex-col gap-[10px] px-[24px] py-[20px]">
        <h2 className="text-[20px] font-bold text-[var(--black)]">
          End Screen
        </h2>
        <div className="flex flex-col gap-[8px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px]">
          <span className="text-[13px] text-[var(--gray-700)]">
            📎 endscreen_match1.png
          </span>
          <span className="text-[12px] text-[var(--gray-500)]">
            Auto-detected: Match result confirmed via OCR
          </span>
          <span className="text-[12px] font-semibold text-[var(--primary)]">
            OCR Done
          </span>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Confirm Section */}
      <div className="flex flex-col gap-[12px] px-[24px] pt-[20px] pb-[32px]">
        <div className="flex flex-col gap-[8px] rounded-[var(--radius-md)] bg-[var(--gray-100)] p-[16px]">
          <span className="text-[13px] text-[var(--gray-700)]">
            Verify the auto-detected result, and confirm to<br />
            finalize the match record.
          </span>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Team A Side</span>
            <span className="rounded-[4px] bg-[var(--primary)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]">
              BLUE
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--gray-700)]">Winner Side</span>
            <span className="rounded-[4px] bg-[var(--primary)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--white)]">
              BLUE
            </span>
          </div>
        </div>

        <button className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[var(--radius-md)] bg-[var(--primary)] text-[16px] font-bold text-[var(--white)]">
          <Check size={20} />
          Confirm Match Result
        </button>
      </div>
    </div>
  );
}
