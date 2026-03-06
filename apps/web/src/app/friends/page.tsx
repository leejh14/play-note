"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  EllipsisVertical,
  Undo2,
} from "lucide-react";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { fetchFriends, type Friend } from "@/lib/playnote";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadFriends = async () => {
      const nextFriends = await fetchFriends();
      if (!cancelled) {
        setFriends(nextFriends);
      }
    };

    void loadFriends();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeFriends = friends.filter((f) => !f.archived);
  const archivedFriends = friends.filter((f) => f.archived);
  const filteredActive = activeFriends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.riotId.toLowerCase().includes(search.toLowerCase()),
  );
  const displayedFriends = showArchived
    ? [...filteredActive, ...archivedFriends]
    : filteredActive;

  return (
    <div className="flex h-full flex-col bg-[var(--white)]">
      {/* Header */}
      <div className="flex items-center justify-between px-[24px] pt-[16px] pb-[12px]">
        <h1 className="text-[22px] font-bold text-[var(--black)]">Friends</h1>
        <button className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[var(--primary)]">
          <Plus size={20} className="text-[var(--white)]" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-[24px] pb-[16px]">
        <div className="flex h-[44px] items-center gap-[8px] rounded-[10px] bg-[var(--gray-100)] px-[14px]">
          <Search size={18} className="text-[var(--gray-500)]" />
          <input
            type="text"
            placeholder="Search by name or Riot ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-[var(--black)] placeholder:text-[var(--gray-500)] focus:outline-none"
          />
        </div>
      </div>

      {/* Count Bar */}
      <div className="flex items-center justify-between px-[24px] pb-[12px]">
        <span className="text-[13px] font-medium text-[var(--gray-500)]">
          {activeFriends.length} friends
        </span>
        <div className="flex items-center gap-[4px]">
          <span className="text-[13px] font-medium text-[var(--gray-500)]">
            Show archived
          </span>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex h-[20px] w-[36px] items-center rounded-[10px] px-[2px] transition-colors ${
              showArchived ? "bg-[var(--primary)]" : "bg-[var(--gray-300)]"
            }`}
          >
            <div
              className={`h-[16px] w-[16px] rounded-full bg-[var(--white)] transition-transform ${
                showArchived ? "translate-x-[16px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Friend List */}
      <div className="flex flex-1 flex-col overflow-auto">
        {displayedFriends.map((friend) => {
          const isArchived = friend.archived;
          return (
            <div
              key={friend.id}
              className={`flex items-center justify-between border-b px-[24px] py-[14px] ${
                isArchived
                  ? "border-[var(--gray-300)] bg-[var(--gray-100)] opacity-60"
                  : "border-[var(--gray-100)]"
              }`}
            >
              <div className="flex items-center gap-[8px]">
                {isArchived && (
                  <span className="rounded-[var(--radius-full)] bg-[var(--gray-300)] px-[8px] py-[2px] text-[10px] font-semibold text-[var(--gray-700)]">
                    Archived
                  </span>
                )}
                <div className="flex flex-col gap-[2px]">
                  <span
                    className={`text-[16px] font-semibold ${
                      isArchived
                        ? "text-[var(--gray-500)]"
                        : "text-[var(--black)]"
                    }`}
                  >
                    {friend.name}
                  </span>
                  <span className="text-[13px] text-[var(--gray-500)]">
                    {friend.riotId}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-[12px]">
                {isArchived ? (
                  <Undo2 size={18} className="text-[var(--gray-500)]" />
                ) : (
                  <>
                    <Pencil size={18} className="text-[var(--gray-500)]" />
                    <EllipsisVertical
                      size={18}
                      className="text-[var(--gray-500)]"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomTabBar />
    </div>
  );
}
