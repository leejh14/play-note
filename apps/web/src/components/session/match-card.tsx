import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function MatchCard({ children }: { readonly children: ReactNode }) {
  return (
    <Card className="px-[14px] py-[12px]">
      {children}
    </Card>
  );
}
