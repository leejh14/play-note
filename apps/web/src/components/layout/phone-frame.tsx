import type { ReactNode } from "react";

export function PhoneFrame({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[var(--pn-gray-100)] py-[24px]">
      <div className="mx-auto w-full max-w-[402px] overflow-hidden bg-[var(--pn-bg-page)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        {children}
      </div>
    </div>
  );
}
