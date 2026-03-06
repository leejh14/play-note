"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBarChart, IconNotebook, IconUser } from "@/components/icons";

type NavKey = "sessions" | "stats" | "friends";
type NavigationMode = "bottom" | "side";

const navItems: Array<{
  key: NavKey;
  label: string;
  href: string;
  Icon: typeof IconNotebook;
}> = [
  { key: "sessions", label: "Sessions", href: "/sessions", Icon: IconNotebook },
  { key: "stats", label: "Statistics", href: "/stats", Icon: IconBarChart },
  { key: "friends", label: "Friends", href: "/friends", Icon: IconUser },
];

function isActive(pathname: string, key: NavKey) {
  if (key === "sessions") return pathname === "/sessions" || pathname.startsWith("/s/");
  if (key === "stats") return pathname.startsWith("/stats");
  return pathname.startsWith("/friends");
}

export function BottomTabBar({
  mode = "bottom",
}: {
  readonly mode?: NavigationMode;
}) {
  const pathname = usePathname();
  const isSide = mode === "side";

  if (isSide) {
    return (
      <aside className="hidden w-[220px] shrink-0 border-r border-[rgba(15,23,42,0.08)] bg-white lg:flex lg:flex-col">
        <div className="border-b border-[rgba(15,23,42,0.08)] px-[16px] py-[18px]">
          <div className="text-[19px] font-[900] tracking-[-0.2px] text-[var(--pn-text-primary)]">
            PlayNote
          </div>
          <div className="mt-[2px] text-[11px] font-[600] text-[var(--pn-text-muted)]">
            Web Dashboard
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-[6px] p-[12px]">
          {navItems.map(({ key, href, label, Icon }) => {
            const active = isActive(pathname, key);
            const color = active ? "text-[var(--pn-primary)]" : "text-[var(--pn-text-secondary)]";
            return (
              <Link
                key={key}
                href={href}
                className={`flex h-[42px] items-center gap-[10px] rounded-[10px] border px-[12px] text-[13px] font-[700] transition-colors ${
                  active
                    ? "border-[rgba(33,150,243,0.24)] bg-[rgba(33,150,243,0.12)]"
                    : "border-transparent bg-transparent hover:border-[rgba(15,23,42,0.08)] hover:bg-[rgba(15,23,42,0.03)]"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${color}`} />
                <span className={color}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <nav className="w-full border-t border-[rgba(15,23,42,0.08)] bg-white px-[12px] py-[8px] lg:hidden">
      <div className="mx-auto grid w-full max-w-[520px] grid-cols-3 gap-[8px]">
        {navItems.map(({ key, href, label, Icon }) => {
          const active = isActive(pathname, key);
          const color = active ? "text-[var(--pn-primary)]" : "text-[var(--pn-text-secondary)]";
          return (
            <Link
              key={key}
              href={href}
              className={`flex h-[42px] items-center justify-center gap-[8px] rounded-[10px] border text-[12px] font-[700] transition-colors ${
                active
                  ? "border-[rgba(33,150,243,0.24)] bg-[rgba(33,150,243,0.12)]"
                  : "border-transparent bg-transparent hover:border-[rgba(15,23,42,0.08)] hover:bg-[rgba(15,23,42,0.03)]"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${color}`} />
              <span className={color}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
