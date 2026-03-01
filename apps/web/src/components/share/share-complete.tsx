"use client";

import Link from "next/link";
import { ShareButtons } from "@/components/share/share-buttons";
import { Button } from "@/components/ui/button";

function contentLabel(contentType: "LOL" | "FUTSAL"): string {
  return contentType === "LOL" ? "LoL" : "Futsal";
}

export function ShareComplete({
  sessionId,
  token,
  title,
  contentType,
  startsAt,
  attendingCount,
  totalCount,
  continueHref,
}: {
  readonly sessionId: string;
  readonly token: string;
  readonly title: string | null;
  readonly contentType: "LOL" | "FUTSAL";
  readonly startsAt: string;
  readonly attendingCount: number;
  readonly totalCount: number;
  readonly continueHref: string;
}) {
  return (
    <div className="flex flex-col gap-[12px] rounded-[16px] border border-[var(--pn-border)] bg-white px-[14px] py-[16px]">
      <div className="text-[17px] font-[900] text-[var(--pn-text-primary)]">
        세션이 생성되었습니다
      </div>
      <div className="text-[12px] font-[600] text-[var(--pn-text-secondary)]">
        아래 버튼으로 카카오 공유 또는 링크 복사를 진행하세요.
      </div>
      <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[10px] py-[10px]">
        <div className="text-[12px] font-[800] text-[var(--pn-text-primary)]">
          {title || "Untitled Session"}
        </div>
        <div className="mt-[4px] text-[10px] font-[700] text-[var(--pn-text-muted)]">
          {contentLabel(contentType)} · {new Date(startsAt).toLocaleString("ko-KR")}
        </div>
      </div>
      <div className="flex justify-center py-[4px]">
        <ShareButtons
          sessionId={sessionId}
          token={token}
          contentType={contentType}
          startsAt={startsAt}
          attendingCount={attendingCount}
          totalCount={totalCount}
          title={title}
        />
      </div>
      <div className="mt-[4px] flex flex-col gap-[8px]">
        <Link href={continueHref} className="w-full">
          <Button className="h-[42px] w-full rounded-[10px] text-[13px]">셋업 계속하기</Button>
        </Link>
        <Link href="/sessions" className="w-full">
          <Button variant="ghost" className="h-[38px] w-full rounded-[10px] text-[12px]">
            나중에 하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
