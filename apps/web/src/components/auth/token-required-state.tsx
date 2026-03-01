import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TokenRequiredState({
  title = "접근 권한이 없습니다",
  description = "공유받은 세션 링크로 입장하거나 새 세션을 만들어주세요.",
}: {
  readonly title?: string;
  readonly description?: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-[10px] rounded-[16px] border border-[var(--pn-border)] bg-white px-[20px] py-[28px] text-center">
      <div className="text-[16px] font-[800] text-[var(--pn-text-primary)]">{title}</div>
      <div className="text-[12px] font-[600] text-[var(--pn-text-muted)]">{description}</div>
      <Link href="/sessions/new" className="mt-[8px]">
        <Button className="h-[40px] rounded-[10px] px-[14px] text-[13px]">새 세션 생성하기</Button>
      </Link>
    </div>
  );
}
