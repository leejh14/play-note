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

export async function copyShareLink(sessionId: string, token: string) {
  const url = `${window.location.origin}/s/${sessionId}?t=${token}`;
  await navigator.clipboard.writeText(url);
}
