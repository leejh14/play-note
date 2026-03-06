import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-white shadow-[var(--pn-shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}
