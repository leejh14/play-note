declare global {
  interface Window {
    Kakao: {
      init(key: string): void;
      isInitialized(): boolean;
      Share: {
        sendDefault(config: Record<string, unknown>): void;
      };
    };
  }
}

export function initKakao() {
  if (
    typeof window !== "undefined" &&
    window.Kakao &&
    !window.Kakao.isInitialized()
  ) {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (key) window.Kakao.init(key);
  }
}

export type ShareSessionInput = {
  readonly sessionId: string;
  readonly token: string;
  readonly contentType: "LOL" | "FUTSAL";
  readonly startsAt: string;
  readonly attendingCount: number;
  readonly totalCount: number;
  readonly title?: string | null;
};

function contentLabel(contentType: "LOL" | "FUTSAL"): string {
  return contentType === "LOL" ? "롤 내전" : "풋살";
}

function thumbnailPath(contentType: "LOL" | "FUTSAL"): string {
  return contentType === "LOL" ? "/images/og-lol.png" : "/images/og-futsal.png";
}

export function buildShareUrl(sessionId: string, token: string): string {
  return `${window.location.origin}/s/${encodeURIComponent(sessionId)}?t=${encodeURIComponent(token)}`;
}

export function shareSession(input: ShareSessionInput) {
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    throw new Error("Kakao SDK is not initialized");
  }

  const shareUrl = buildShareUrl(input.sessionId, input.token);
  const date = new Date(input.startsAt);
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: input.title || `${contentLabel(input.contentType)} — ${dateLabel}`,
      description: `${timeLabel} · 참가 ${input.attendingCount}/${input.totalCount}`,
      imageUrl: `${window.location.origin}${thumbnailPath(input.contentType)}`,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: "참가하기",
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  });
}

export async function copyShareLink(sessionId: string, token: string) {
  const url = buildShareUrl(sessionId, token);
  await navigator.clipboard.writeText(url);
}
