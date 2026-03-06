"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BarChart3, Users } from "lucide-react";

const tabs = [
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/friends", label: "Friends", icon: Users },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full items-center justify-around border-t border-[var(--black)] bg-[var(--white)] px-0 pt-[10px] pb-[28px]">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1"
          >
            <Icon
              size={22}
              className={active ? "text-[var(--primary)]" : "text-[var(--black)]"}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span
              className={`text-[10px] ${
                active
                  ? "font-semibold text-[var(--primary)]"
                  : "font-medium text-[var(--black)]"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
