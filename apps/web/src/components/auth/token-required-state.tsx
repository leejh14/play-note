import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TokenRequiredState({
  title = "접근 권한이 없습니다",
  description = "공유받은 세션 링크로 입장하거나 새 세션을 만들어주세요.",
}: {
  readonly title?: string;
  readonly description?: string;
}) {
  return (
    <Card className="flex min-h-[280px] flex-col items-center justify-center gap-[12px] rounded-[18px] border-[rgba(15,23,42,0.08)] px-[22px] py-[30px] text-center">
      <div className="h-[38px] w-[38px] rounded-full bg-[var(--pn-primary-light)]" />
      <div className="text-[17px] font-[800] tracking-[-0.2px] text-[var(--pn-text-primary)]">{title}</div>
      <div className="text-[12px] font-[600] leading-[1.5] text-[var(--pn-text-muted)]">{description}</div>
      <Link href="/sessions/new" className="mt-[8px]">
        <Button className="h-[42px] rounded-[11px] px-[16px] text-[13px]">새 세션 생성하기</Button>
      </Link>
    </Card>
  );
}
