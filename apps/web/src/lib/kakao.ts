export const KAKAO_SDK_URL =
  "https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js";

type KakaoLink = {
  mobileWebUrl: string;
  webUrl: string;
};

export type KakaoShareFeedPayload = {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    link: KakaoLink;
  };
  buttons: Array<{
    title: string;
    link: KakaoLink;
  }>;
};

type KakaoSdk = {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share?: {
    sendDefault: (payload: KakaoShareFeedPayload) => Promise<unknown> | unknown;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

function getKakaoAppKey(): string | null {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
  return appKey ? appKey : null;
}

function getKakaoSdk(): KakaoSdk | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Kakao ?? null;
}

export function isKakaoShareAvailable(): boolean {
  const kakao = getKakaoSdk();
  const appKey = getKakaoAppKey();

  if (!kakao?.Share || !appKey) {
    return false;
  }

  try {
    if (!kakao.isInitialized()) {
      kakao.init(appKey);
    }

    return kakao.isInitialized();
  } catch {
    return false;
  }
}

export async function shareWithKakao(
  payload: KakaoShareFeedPayload,
): Promise<void> {
  const kakao = getKakaoSdk();

  if (!kakao?.Share || !isKakaoShareAvailable()) {
    throw new Error("Kakao Share API is unavailable");
  }

  await Promise.resolve(kakao.Share.sendDefault(payload));
}
