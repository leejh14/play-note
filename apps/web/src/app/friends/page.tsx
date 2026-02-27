import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { Button } from "@/components/ui/button";
import { IconSearch } from "@/components/icons";
import { FriendRow } from "@/components/friend/friend-list";
import { friends } from "@/lib/mock-data";

export default function FriendsPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />

        <div className="flex h-[44px] items-center justify-between px-[16px]">
          <div className="text-[18px] font-[900] text-[var(--pn-text-primary)]">Friends</div>
          <Button className="h-[30px] w-[30px] rounded-[12px] p-0" aria-label="Add friend">
            +
          </Button>
        </div>

        <div className="px-[16px]">
          <div className="flex h-[40px] items-center gap-[10px] rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] text-[12px] font-[600] text-[var(--pn-text-muted)]">
            <IconSearch className="h-[16px] w-[16px]" />
            Search by name or Riot ID
          </div>
          <div className="mt-[10px] flex items-center justify-between text-[11px] font-[600] text-[var(--pn-text-muted)]">
            <div>12 friends</div>
            <div className="flex items-center gap-[8px]">
              <span>Show archived</span>
              <div className="h-[18px] w-[34px] rounded-[999px] bg-[var(--pn-border)] p-[2px]">
                <div className="h-[14px] w-[14px] rounded-[999px] bg-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-[16px] pb-[10px] pt-[10px]">
          <div className="border-t border-[var(--pn-border)]">
            {friends.map((f) => (
              <FriendRow key={f.id} name={f.name} riotId={f.riotId} archived={f.archived} />
            ))}
          </div>
        </div>

        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}
