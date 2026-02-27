import type { ReactNode } from "react";

export function MatchCard({ children }: { readonly children: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-white px-[14px] py-[12px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      {children}
    </div>
  );
}
