import { expect, test } from "@playwright/test";

import { createSessionViaApi } from "./helpers/graphql-client";

const WEB_BASE_URL = process.env.E2E_WEB_BASE_URL ?? "http://localhost:3000";

type WindowWithCopiedText = Window & {
  __copiedText?: string;
};

test.describe("P0 mobile smoke", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  test("mobile token error state is shown for invalid token", async ({ page }) => {
    const session = await createSessionViaApi();
    const encodedSessionId = encodeURIComponent(session.globalId);

    await page.goto("/");
    await page.evaluate(({ localSessionId }) => {
      localStorage.setItem(`playnote:session:${localSessionId}:token`, "invalid-token");
      localStorage.setItem("playnote:active-session-id", localSessionId);
    }, { localSessionId: session.localId });

    await page.goto(`/s/${encodedSessionId}`);
    await expect(page.getByText("다시 초대 링크가 필요합니다")).toBeVisible();
  });

  test("mobile share buttons handle copy success and Kakao fallback", async ({ page }) => {
    const session = await createSessionViaApi();
    const encodedSessionId = encodeURIComponent(session.globalId);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as WindowWithCopiedText).__copiedText = value;
          },
        },
      });
    });

    await page.goto(`/s/${encodedSessionId}?t=${session.editorToken}`);
    await expect(page).toHaveURL(new RegExp(`/s/${encodedSessionId}/setup$`), {
      timeout: 20_000,
    });
    await page.goto(`/s/${encodedSessionId}/detail`);

    await page.getByRole("button", { name: "링크" }).click();
    await expect(page.getByText("링크가 복사되었습니다.")).toBeVisible();

    const copiedText = await page.evaluate(() => (window as WindowWithCopiedText).__copiedText ?? null);
    expect(copiedText).toBe(
      `${WEB_BASE_URL}/s/${encodedSessionId}?t=${encodeURIComponent(session.editorToken)}`,
    );

    await page.getByRole("button", { name: "카카오" }).click();
    await expect(
      page.getByText("카카오 공유를 사용할 수 없어 링크 복사를 이용해주세요."),
    ).toBeVisible();
  });

  test("session route renders OG metadata", async ({ request }) => {
    const session = await createSessionViaApi({
      contentType: "LOL",
      title: "P0 OG Session",
    });
    const encodedSessionId = encodeURIComponent(session.globalId);

    const response = await request.get(`/s/${encodedSessionId}`);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain("P0 OG Session");
    expect(html).toContain('property="og:image"');
    expect(html).toContain("/images/og-lol.png");
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain("summary_large_image");
  });
});
