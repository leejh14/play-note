"use client";

import { useState } from "react";
import Link from "next/link";
import { NotebookPen, Settings, Plus } from "lucide-react";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SessionCard } from "@/components/session/session-card";
import { sessions } from "@/lib/mock-data";
import type { ContentType } from "@/lib/mock-data";

type FilterTab = "all" | ContentType;

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "lol", label: "LoL" },
  { key: "futsal", label: "Futsal" },
];

export default function SessionListPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all"
      ? sessions
      : sessions.filter((s) => s.contentType === activeTab);

  return (
    <div className="flex h-full flex-col bg-[var(--gray-100)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--white)] px-[24px] pt-[16px] pb-[20px]">
        <div className="flex items-center gap-[8px]">
          <NotebookPen size={24} className="text-[var(--primary)]" />
          <span className="text-[22px] font-extrabold text-[var(--black)]">
            PlayNote
          </span>
        </div>
        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[var(--gray-100)]">
          <Settings size={20} className="text-[var(--gray-700)]" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-[8px] bg-[var(--white)] px-[24px] pb-[12px]">
        {filterTabs.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-[var(--radius-full)] px-[16px] py-[8px] text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-[var(--primary)] text-[var(--white)]"
                  : "border border-[var(--gray-300)] bg-[var(--white)] text-[var(--gray-700)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Session list */}
      <div className="flex flex-1 flex-col gap-[12px] overflow-auto p-[16px]">
        {filtered.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {/* FAB */}
      <Link
        href="/sessions/new"
        className="fixed bottom-[100px] right-1/2 z-10 flex h-[60px] w-[60px] translate-x-[calc(215px-30px)] items-center justify-center rounded-[30px] bg-[var(--primary)] shadow-lg"
      >
        <Plus size={28} className="text-[var(--white)]" />
      </Link>

      <BottomTabBar />
    </div>
  );
}
