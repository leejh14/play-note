"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyShareLink, initKakao, shareSession } from "@/lib/kakao";

export function ShareButtons({
  sessionId,
  token,
  contentType,
  startsAt,
  attendingCount,
  totalCount,
  title,
}: {
  readonly sessionId: string;
  readonly token: string;
  readonly contentType: "LOL" | "FUTSAL";
  readonly startsAt: string;
  readonly attendingCount: number;
  readonly totalCount: number;
  readonly title?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const onShareKakao = () => {
    try {
      initKakao();
      shareSession({
        sessionId,
        token,
        contentType,
        startsAt,
        attendingCount,
        totalCount,
        title,
      });
      setMessage(null);
    } catch {
      setMessage("카카오 공유를 사용할 수 없어 링크 복사를 이용해주세요.");
    }
  };

  const onCopy = async () => {
    await copyShareLink(sessionId, token);
    setMessage("링크가 복사되었습니다.");
  };

  return (
    <div className="flex items-center gap-[6px]">
      <Button variant="secondary" className="h-[28px] rounded-[8px] px-[8px] text-[10px]" onClick={onShareKakao}>
        카카오
      </Button>
      <Button variant="ghost" className="h-[28px] rounded-[8px] px-[8px] text-[10px]" onClick={onCopy}>
        링크
      </Button>
      {message ? (
        <span className="max-w-[120px] truncate text-[9px] font-[600] text-[var(--pn-text-muted)]">
          {message}
        </span>
      ) : null}
    </div>
  );
}
