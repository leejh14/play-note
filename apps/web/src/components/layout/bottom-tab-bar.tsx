"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBarChart, IconNotebook, IconUser } from "@/components/icons";

type NavKey = "sessions" | "stats" | "friends";

function isActive(pathname: string, key: NavKey) {
  if (key === "sessions") return pathname === "/sessions" || pathname.startsWith("/s/");
  if (key === "stats") return pathname.startsWith("/stats");
  return pathname.startsWith("/friends");
}

export function BottomTabBar() {
  const pathname = usePathname();

  const items: Array<{
    key: NavKey;
    label: string;
    href: string;
    Icon: typeof IconNotebook;
  }> = [
    { key: "sessions", label: "Sessions", href: "/sessions", Icon: IconNotebook },
    { key: "stats", label: "Statistics", href: "/stats", Icon: IconBarChart },
    { key: "friends", label: "Friends", href: "/friends", Icon: IconUser },
  ];

  return (
    <nav className="h-[78px] w-full border-t border-[var(--pn-border)] bg-[var(--pn-bg-page)]">
      <div className="grid h-full grid-cols-3 items-center">
        {items.map(({ key, href, label, Icon }) => {
          const active = isActive(pathname, key);
          const color = active
            ? "text-[var(--pn-primary)]"
            : "text-[var(--pn-text-secondary)]";
          return (
            <Link
              key={key}
              href={href}
              className="flex h-full flex-col items-center justify-center gap-[6px]"
            >
              <Icon className={`h-[22px] w-[22px] ${color}`} />
              <span className={`text-[11px] font-[600] ${color}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
