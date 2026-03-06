import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IconButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly children: ReactNode }) {
  return (
    <button
      className={cn(
        "inline-flex h-[36px] w-[36px] items-center justify-center rounded-[12px] border border-transparent bg-[rgba(15,23,42,0.03)] text-[var(--pn-text-secondary)] transition-colors hover:border-[rgba(15,23,42,0.08)] hover:bg-[rgba(15,23,42,0.06)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
