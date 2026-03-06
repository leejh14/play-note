"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { fetchStatsDetail, type FriendDetailStat } from "@/lib/playnote";

export default function FriendStatsPage() {
  const params = useParams<{ friendId: string }>();
  const router = useRouter();
  const [stat, setStat] = useState<FriendDetailStat | null | undefined>(undefined);
  const friendId = params.friendId;

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      const nextStat = await fetchStatsDetail(friendId);
      if (!cancelled) {
        setStat(nextStat);
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [friendId]);

  if (stat === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--gray-100)]">
        <p className="text-[var(--gray-500)]">Loading...</p>
      </div>
    );
  }

  if (stat === null) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--gray-100)]">
        <p className="text-[var(--gray-500)]">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--gray-100)]">
      {/* Header */}
      <div className="flex items-center gap-[8px] bg-[var(--white)] px-[24px] pt-[16px] pb-[20px]">
        <button onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-[var(--black)]" />
        </button>
        <h1 className="text-[22px] font-bold text-[var(--black)]">
          Statistics
        </h1>
      </div>

      {/* Friend Selector */}
      <div className="flex flex-col gap-[8px] bg-[var(--white)] px-[16px] pb-[12px]">
        <div className="flex h-[48px] items-center justify-between rounded-[var(--radius-md)] bg-[var(--gray-100)] px-[16px]">
          <span className="text-[16px] font-semibold text-[var(--black)]">
            {stat.name}
          </span>
          <ChevronDown size={20} className="text-[var(--gray-500)]" />
        </div>
        <span className="text-[13px] text-[var(--gray-500)]">
          {stat.riotId} · {stat.matches} matches played
        </span>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-[10px] p-[16px]">
        <div className="flex flex-1 flex-col items-center gap-[4px] rounded-[var(--radius-lg)] bg-[var(--white)] px-[16px] py-[20px]">
          <span className="text-[11px] font-medium text-[var(--gray-500)]">
            Win Rate
          </span>
          <span className="text-[28px] font-bold text-[var(--primary)]">
            {stat.winRate}%
          </span>
          <span className="text-[11px] text-[var(--gray-500)]">
            {stat.wins}W {stat.losses}L
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-[4px] rounded-[var(--radius-lg)] bg-[var(--white)] px-[16px] py-[20px]">
          <span className="text-[11px] font-medium text-[var(--gray-500)]">
            Matches
          </span>
          <span className="text-[28px] font-bold text-[var(--black)]">
            {stat.matches}
          </span>
          <span className="text-[11px] text-[var(--gray-500)]">confirmed</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-[4px] rounded-[var(--radius-lg)] bg-[var(--white)] px-[16px] py-[20px]">
          <span className="text-[11px] font-medium text-[var(--gray-500)]">
            Top Lane
          </span>
          <span className="text-[28px] font-bold text-[var(--black)]">
            {stat.topLane}
          </span>
          <span className="text-[11px] text-[var(--gray-500)]">
            {stat.topLaneTimes} times
          </span>
        </div>
      </div>

      {/* Lane Distribution */}
      <div className="px-[16px] pb-[12px]">
        <div className="flex flex-col gap-[14px] rounded-[var(--radius-lg)] bg-[var(--white)] p-[20px]">
          <h2 className="text-[17px] font-bold text-[var(--black)]">
            Lane Distribution
          </h2>
          {stat.laneDistribution.map((lane) => (
            <div key={lane.lane} className="flex items-center gap-[12px]">
              <span className="w-[32px] text-[13px] font-medium text-[var(--gray-700)]">
                {lane.lane}
              </span>
              <div className="flex h-[12px] flex-1 overflow-hidden rounded-full bg-[var(--gray-100)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${lane.percentage}%` }}
                />
              </div>
              <span className="w-[36px] text-right text-[13px] font-semibold text-[var(--primary)]">
                {lane.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Champion Stats */}
      <div className="px-[16px] pb-[24px]">
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-lg)] bg-[var(--white)] p-[20px]">
          <h2 className="text-[17px] font-bold text-[var(--black)]">
            Most Winning Champions
          </h2>

          {/* Table Header */}
          <div className="flex items-center">
            <span className="flex-1 text-[11px] font-medium text-[var(--gray-500)]">
              Champion
            </span>
            <span className="w-[36px] text-center text-[11px] font-medium text-[var(--gray-500)]">
              Wins
            </span>
            <span className="w-[36px] text-center text-[11px] font-medium text-[var(--gray-500)]">
              Games
            </span>
            <span className="w-[40px] text-right text-[11px] font-medium text-[var(--gray-500)]">
              WR
            </span>
          </div>

          {stat.champions.map((champ) => (
            <div key={champ.name} className="flex items-center">
              <div className="flex flex-1 items-center gap-[10px]">
                <div className="h-[32px] w-[32px] rounded-full bg-[var(--gray-100)]" />
                <span className="text-[14px] font-medium text-[var(--black)]">
                  {champ.name}
                </span>
              </div>
              <span className="w-[36px] text-center text-[14px] font-bold text-[var(--primary)]">
                {champ.wins}
              </span>
              <span className="w-[36px] text-center text-[14px] text-[var(--gray-700)]">
                {champ.games}
              </span>
              <span className="w-[40px] text-right text-[14px] font-bold text-[var(--primary)]">
                {champ.winRate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
