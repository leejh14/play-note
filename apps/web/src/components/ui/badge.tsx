import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  readonly children: ReactNode;
  readonly tone?: "neutral" | "primary" | "blueSoft" | "pinkSoft";
}) {
  const cls =
    tone === "primary"
      ? "bg-[var(--pn-primary)] text-[var(--pn-text-on-primary)]"
      : tone === "blueSoft"
        ? "bg-[var(--pn-primary-light)] text-[var(--pn-primary)]"
        : tone === "pinkSoft"
          ? "bg-[var(--pn-pink-soft)] text-[var(--pn-pink)]"
          : "bg-[var(--pn-bg-card)] text-[var(--pn-text-secondary)]";

  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-[999px] px-[10px] text-[11px] font-[600] ${cls}`}
    >
      {children}
    </span>
  );
}
