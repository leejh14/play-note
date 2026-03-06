import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";

export function PageHeader({
  title,
  backHref,
  right,
}: {
  readonly title: string;
  readonly backHref?: string;
  readonly right?: ReactNode;
}) {
  return (
    <div className="relative flex h-[48px] items-center justify-center border-b border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.96)] px-[12px]">
      <div className="absolute left-[8px] top-1/2 -translate-y-1/2">
        {backHref ? (
          <Link href={backHref} aria-label="Back">
            <IconButton>
              <IconChevronLeft className="h-[22px] w-[22px]" />
            </IconButton>
          </Link>
        ) : null}
      </div>
      <div className="text-[15px] font-[800] tracking-[-0.2px] text-[var(--pn-text-primary)]">
        {title}
      </div>
      <div className="absolute right-[8px] top-1/2 -translate-y-1/2">
        {right}
      </div>
    </div>
  );
}
