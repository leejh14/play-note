"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export function PageHeader({ title, showBack, rightSlot }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex w-full items-center justify-between px-[24px] py-[16px]">
      <div className="flex items-center gap-[8px]">
        {showBack && (
          <button onClick={() => router.back()} className="p-0">
            <ArrowLeft size={24} className="text-[var(--black)]" />
          </button>
        )}
        <h1 className="text-[22px] font-bold text-[var(--black)]">{title}</h1>
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );
}
