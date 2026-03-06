import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[24px] items-center rounded-[999px] px-[10px] text-[11px] font-[700] tracking-[-0.1px]",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--pn-bg-card)] text-[var(--pn-text-secondary)]",
        primary: "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)]",
        blueSoft: "bg-[var(--pn-primary-light)] text-[var(--pn-primary)]",
        pinkSoft: "bg-[var(--pn-pink-soft)] text-[var(--pn-pink)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export function Badge({
  children,
  tone,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
} & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
