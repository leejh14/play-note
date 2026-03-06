import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildShareUrl, copyShareLink, initKakao, shareSession } from "./kakao";

type KakaoMock = {
  readonly init: ReturnType<typeof vi.fn>;
  readonly isInitialized: ReturnType<typeof vi.fn>;
  readonly sendDefault: ReturnType<typeof vi.fn>;
};

function installKakaoMock(isInitialized: boolean): KakaoMock {
  const init = vi.fn();
  const isInitializedMock = vi.fn(() => isInitialized);
  const sendDefault = vi.fn();

  Object.defineProperty(window, "Kakao", {
    configurable: true,
    value: {
      init,
      isInitialized: isInitializedMock,
      Share: {
        sendDefault,
      },
    },
  });

  return {
    init,
    isInitialized: isInitializedMock,
    sendDefault,
  };
}

describe("kakao share helpers", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/sessions");
  });

  it("initializes Kakao SDK when key exists and SDK is not initialized", () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", "kakao-js-key");
    const kakao = installKakaoMock(false);

    initKakao();

    expect(kakao.isInitialized).toHaveBeenCalledTimes(1);
    expect(kakao.init).toHaveBeenCalledWith("kakao-js-key");
  });

  it("builds Kakao share payload with session URL", () => {
    const kakao = installKakaoMock(true);
    const sessionId = "U2Vzc2lvbjoxMjM0";
    const token = "editor-token";
    const expectedShareUrl = buildShareUrl(sessionId, token);

    shareSession({
      sessionId,
      token,
      contentType: "LOL",
      startsAt: "2026-03-05T10:00:00.000Z",
      attendingCount: 6,
      totalCount: 10,
      title: "테스트 내전",
    });

    expect(kakao.sendDefault).toHaveBeenCalledWith(
      expect.objectContaining({
        objectType: "feed",
        content: expect.objectContaining({
          title: "테스트 내전",
          imageUrl: `${window.location.origin}/images/og-lol.png`,
          link: {
            mobileWebUrl: expectedShareUrl,
            webUrl: expectedShareUrl,
          },
        }),
        buttons: [
          {
            title: "참가하기",
            link: {
              mobileWebUrl: expectedShareUrl,
              webUrl: expectedShareUrl,
            },
          },
        ],
      }),
    );
  });

  it("throws when Kakao SDK is unavailable", () => {
    Object.defineProperty(window, "Kakao", {
      configurable: true,
      value: undefined,
    });

    expect(() =>
      shareSession({
        sessionId: "session-id",
        token: "editor-token",
        contentType: "FUTSAL",
        startsAt: "2026-03-05T10:00:00.000Z",
        attendingCount: 8,
        totalCount: 10,
      }),
    ).toThrow("Kakao SDK is not initialized");
  });

  it("copies generated share URL to clipboard", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });

    await copyShareLink("session-id", "editor-token");

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/s/session-id?t=editor-token`,
    );
  });
});
