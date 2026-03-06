"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { sessions, type AttendanceStatus, type Lane, type Team } from "@/lib/mock-data";

const lanes: Lane[] = ["TOP", "JG", "MID", "ADC", "SUP"];

interface SetupMember {
  id: string;
  name: string;
  initials: string;
  attendance: AttendanceStatus;
  team?: Team;
  lane?: Lane;
}

export default function SessionSetupPage() {
  const router = useRouter();
  const session = sessions[0];

  const [members] = useState<SetupMember[]>([
    { id: "1", name: "Junho", initials: "JH", attendance: "yes", team: "A", lane: "TOP" },
    { id: "5", name: "Minjae", initials: "MJ", attendance: "maybe", team: "B", lane: "MID" },
    { id: "2", name: "Seungwoo", initials: "SW", attendance: "yes", team: "A", lane: "JG" },
  ]);

  const yesCount = members.filter((m) => m.attendance === "yes").length;
  const teamA = members.filter((m) => m.team === "A");
  const teamB = members.filter((m) => m.team === "B");

  const handleConfirm = () => {
    router.push(`/s/${session.id}`);
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--white)]">
      {/* Header */}
      <div className="flex w-full items-center justify-between px-[24px] py-[16px]">
        <button onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-[var(--black)]" />
        </button>
        <h1 className="text-[18px] font-bold text-[var(--black)]">
          Session Setup
        </h1>
        <div className="w-[24px]" />
      </div>

      {/* Info Bar */}
      <div className="flex w-full items-center gap-[8px] bg-[var(--primary-light)] px-[24px] py-[12px]">
        <span className="rounded-[var(--radius-full)] bg-[var(--primary)] px-[10px] py-[3px] text-[11px] font-semibold text-[var(--white)]">
          LoL
        </span>
        <span className="text-[14px] font-semibold text-[var(--primary)]">
          {session.title}
        </span>
        <span className="text-[13px] text-[var(--primary)]">
          {session.date}
        </span>
      </div>

      {/* Step 1: Attendance */}
      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--primary)]">
            <span className="text-[12px] font-bold text-[var(--white)]">1</span>
          </div>
          <span className="text-[18px] font-bold text-[var(--black)]">
            Attendance
          </span>
          <span className="text-[14px] font-medium text-[var(--primary)]">
            {yesCount} / {members.length + 7}
          </span>
        </div>

        <div className="flex flex-col gap-[4px]">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-[10px] bg-[var(--gray-100)] px-[14px] py-[10px]"
            >
              <div className="flex items-center gap-[10px]">
                <div
                  className={`flex h-[28px] w-[28px] items-center justify-center rounded-full text-[10px] font-semibold ${
                    member.attendance === "yes"
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "bg-[var(--gray-300)] text-[var(--gray-700)]"
                  }`}
                >
                  {member.initials}
                </div>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {member.name}
                </span>
              </div>

              <div className="flex h-[28px] overflow-hidden rounded-[6px] border border-[var(--gray-300)] bg-[var(--white)]">
                {(["yes", "maybe", "no"] as const).map((status) => {
                  const labels = { yes: "Y", maybe: "?", no: "N" };
                  const active = member.attendance === status;
                  return (
                    <button
                      key={status}
                      className={`flex h-full items-center justify-center px-[10px] text-[11px] font-semibold ${
                        active && status === "yes"
                          ? "rounded-[5px] bg-[var(--primary)] text-[var(--white)]"
                          : active && status === "maybe"
                            ? "rounded-[5px] bg-[var(--gray-500)] text-[var(--white)]"
                            : "text-[var(--gray-500)]"
                      }`}
                    >
                      {labels[status]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Step 2: Team Assignment */}
      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--primary)]">
            <span className="text-[12px] font-bold text-[var(--white)]">2</span>
          </div>
          <span className="text-[18px] font-bold text-[var(--black)]">
            Team Assignment
          </span>
        </div>

        <div className="flex gap-[12px]">
          {/* Team A */}
          <div className="flex flex-1 flex-col gap-[6px] rounded-[var(--radius-md)] bg-[var(--primary-light)] p-[14px]">
            <span className="text-[14px] font-bold text-[var(--primary)]">
              Team A
            </span>
            {teamA.map((m) => (
              <div
                key={m.id}
                className="flex h-[36px] items-center gap-[8px] rounded-[var(--radius-sm)] bg-[var(--white)] px-[8px]"
              >
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--primary-light)] text-[9px] font-semibold text-[var(--primary)]">
                  {m.name[0]}
                </div>
                <span className="text-[13px] font-medium text-[var(--black)]">
                  {m.name}
                </span>
              </div>
            ))}
            <button className="flex h-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--primary)] text-[12px] font-medium text-[var(--primary)]">
              + Add
            </button>
          </div>

          {/* Team B */}
          <div className="flex flex-1 flex-col gap-[6px] rounded-[var(--radius-md)] bg-[var(--red-light)] p-[14px]">
            <span className="text-[14px] font-bold text-[var(--red)]">
              Team B
            </span>
            {teamB.map((m) => (
              <div
                key={m.id}
                className="flex h-[36px] items-center gap-[8px] rounded-[var(--radius-sm)] bg-[var(--white)] px-[8px]"
              >
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--red-light)] text-[9px] font-semibold text-[var(--red)]">
                  {m.name[0]}
                </div>
                <span className="text-[13px] font-medium text-[var(--black)]">
                  {m.name}
                </span>
              </div>
            ))}
            <button className="flex h-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--red)] text-[12px] font-medium text-[var(--red)]">
              + Add
            </button>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Step 3: Lane Assignment */}
      <div className="flex flex-col gap-[12px] px-[24px] py-[20px]">
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--primary)]">
            <span className="text-[12px] font-bold text-[var(--white)]">3</span>
          </div>
          <span className="text-[18px] font-bold text-[var(--black)]">
            Lane Assignment
          </span>
          <span className="rounded-[var(--radius-full)] bg-[var(--primary-light)] px-[8px] py-[2px] text-[10px] font-semibold text-[var(--primary)]">
            LoL only
          </span>
        </div>

        <div className="flex flex-col gap-[6px]">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-[10px] bg-[var(--gray-100)] px-[14px] py-[10px]"
            >
              <div className="flex items-center gap-[8px]">
                <span
                  className={`rounded-[4px] px-[6px] py-[2px] text-[10px] font-bold ${
                    m.team === "A"
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "bg-[var(--red-light)] text-[var(--red)]"
                  }`}
                >
                  {m.team}
                </span>
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {m.name}
                </span>
              </div>
              <div className="flex h-[32px] w-[90px] items-center justify-between rounded-[var(--radius-sm)] border border-[var(--gray-300)] bg-[var(--white)] px-[10px]">
                <span className="text-[13px] font-semibold text-[var(--black)]">
                  {m.lane ?? "—"}
                </span>
                <ChevronDown size={14} className="text-[var(--gray-500)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button Area */}
      <div className="px-[24px] pt-[24px] pb-[32px]">
        <button
          onClick={handleConfirm}
          className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[var(--radius-md)] bg-[var(--primary)] text-[16px] font-bold text-[var(--white)]"
        >
          <Check size={20} />
          Confirm Setup
        </button>
      </div>
    </div>
  );
}
