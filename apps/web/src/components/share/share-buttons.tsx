"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
  const { showToast } = useToast();

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
    } catch {
      showToast({
        message: "카카오 공유를 사용할 수 없어 링크 복사를 이용해주세요.",
        tone: "error",
      });
    }
  };

  const onCopy = async () => {
    try {
      await copyShareLink(sessionId, token);
      showToast({
        message: "링크가 복사되었습니다.",
        tone: "success",
      });
    } catch {
      showToast({
        message: "링크 복사에 실패했습니다. 다시 시도해주세요.",
        tone: "error",
      });
    }
  };

  return (
    <div className="flex items-center gap-[6px]">
      <Button variant="secondary" className="h-[28px] rounded-[8px] px-[8px] text-[10px]" onClick={onShareKakao}>
        카카오
      </Button>
      <Button variant="ghost" className="h-[28px] rounded-[8px] px-[8px] text-[10px]" onClick={onCopy}>
        링크
      </Button>
    </div>
  );
}
