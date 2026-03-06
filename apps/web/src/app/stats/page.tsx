"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { fetchStatsOverview, type FriendStat } from "@/lib/playnote";

const laneColors: Record<string, string> = {
  MID: "bg-[var(--primary)]",
  JG: "bg-[var(--gray-500)]",
  ADC: "bg-[var(--gray-500)]",
  TOP: "bg-[var(--gray-500)]",
  SUP: "bg-[var(--gray-500)]",
};

export default function StatsOverviewPage() {
  const [friendStats, setFriendStats] = useState<FriendStat[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      const nextStats = await fetchStatsOverview();
      if (!cancelled) {
        setFriendStats(nextStats);
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-[var(--white)]">
      {/* Header */}
      <div className="flex items-center gap-[8px] px-[24px] pt-[16px] pb-[20px]">
        <h1 className="text-[22px] font-bold text-[var(--black)]">
          Statistics
        </h1>
      </div>

      {/* Column Header */}
      <div className="flex items-center justify-between px-[24px] pb-[10px]">
        <span className="text-[11px] font-medium text-[var(--gray-500)]">
          Friend
        </span>
        <div className="flex gap-[20px]">
          <span className="w-[40px] text-center text-[11px] font-medium text-[var(--gray-500)]">
            WR
          </span>
          <span className="w-[40px] text-center text-[11px] font-medium text-[var(--gray-500)]">
            W-L
          </span>
          <span className="w-[40px] text-center text-[11px] font-medium text-[var(--gray-500)]">
            Lane
          </span>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[var(--gray-100)]" />

      {/* Friend Stats List */}
      <div className="flex flex-1 flex-col overflow-auto">
        {friendStats.map((stat, idx) => (
          <Link
            key={stat.friendId}
            href={`/stats/${stat.friendId}`}
            className="flex items-center justify-between border-b border-[var(--gray-100)] px-[24px] py-[14px]"
          >
            <div className="flex items-center gap-[8px]">
              <span className="w-[16px] text-[14px] font-bold text-[var(--primary)]">
                {idx + 1}
              </span>
              <span className="text-[15px] font-semibold text-[var(--black)]">
                {stat.name}
              </span>
            </div>
            <div className="flex items-center gap-[20px]">
              <span className="w-[40px] text-center text-[14px] font-bold text-[var(--primary)]">
                {stat.winRate}%
              </span>
              <span className="w-[40px] text-center text-[13px] text-[var(--gray-700)]">
                {stat.wins}-{stat.losses}
              </span>
              <span
                className={`flex w-[40px] items-center justify-center rounded-[var(--radius-full)] px-[8px] py-[3px] text-[10px] font-semibold text-[var(--white)] ${
                  laneColors[stat.mainLane] ?? "bg-[var(--gray-500)]"
                }`}
              >
                {stat.mainLane}
              </span>
            </div>
          </Link>
        ))}

        <div className="flex items-center justify-center px-[24px] py-[16px]">
          <span className="text-[13px] text-[var(--gray-500)]">
            Tap a friend to see detailed stats
          </span>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}
