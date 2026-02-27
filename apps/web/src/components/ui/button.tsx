import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly children: ReactNode;
  readonly variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-[8px] rounded-[12px] px-[16px] text-[15px] font-[600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)] hover:opacity-95"
      : variant === "secondary"
        ? "bg-[var(--pn-primary-light)] text-[var(--pn-primary)] hover:opacity-95"
        : "bg-transparent text-[var(--pn-text-secondary)] hover:bg-[rgba(0,0,0,0.04)]";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
