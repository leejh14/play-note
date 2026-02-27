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
    <div className="relative flex h-[44px] items-center justify-center px-[12px]">
      <div className="absolute left-[8px] top-1/2 -translate-y-1/2">
        {backHref ? (
          <Link href={backHref} aria-label="Back">
            <IconButton>
              <IconChevronLeft className="h-[22px] w-[22px]" />
            </IconButton>
          </Link>
        ) : null}
      </div>
      <div className="text-[15px] font-[600] text-[var(--pn-text-primary)]">
        {title}
      </div>
      <div className="absolute right-[8px] top-1/2 -translate-y-1/2">
        {right}
      </div>
    </div>
  );
}
