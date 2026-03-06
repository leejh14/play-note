import type { ReactNode } from "react";

export function PhoneFrame({ children }: { readonly children: ReactNode }) {
  return <div className="min-h-screen w-full bg-[var(--pn-gray-100)]">{children}</div>;
}
