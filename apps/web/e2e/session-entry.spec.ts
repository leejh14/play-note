import { expect, test } from "@playwright/test";
import { createSessionViaApi } from "./helpers/graphql-client";

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("무토큰 /sessions 접근 시 링크 유도 화면이 노출된다", async ({ page }) => {
  await page.goto("/sessions");

  await expect(page.getByText("접근 권한이 없습니다")).toBeVisible();
  await expect(page.getByRole("button", { name: "새 세션 생성하기" })).toBeVisible();
});

test("공유 토큰으로 /s/{id}?t= 진입 시 setup으로 리다이렉트되고 토큰이 저장된다", async ({
  page,
}) => {
  const session = await createSessionViaApi();
  const encodedSessionId = encodeURIComponent(session.globalId);

  await page.goto(`/s/${encodedSessionId}?t=${session.editorToken}`);
  await expect(page).toHaveURL(new RegExp(`/s/${escapeForRegExp(encodedSessionId)}/setup$`), {
    timeout: 15_000,
  });

  const storage = await page.evaluate((localSessionId) => ({
    token: localStorage.getItem(`playnote:session:${localSessionId}:token`),
    shareToken: localStorage.getItem(`playnote:session:${localSessionId}:share-token`),
    activeSessionId: localStorage.getItem("playnote:active-session-id"),
  }), session.localId);

  expect(storage.token).toBe(session.editorToken);
  expect(storage.shareToken).toBe(session.editorToken);
  expect(storage.activeSessionId).toBe(session.localId);
});

test("잘못된 토큰 진입 시 에러 상태 노출 후 로컬 토큰이 정리된다", async ({ page }) => {
  const session = await createSessionViaApi();
  const encodedSessionId = encodeURIComponent(session.globalId);

  await page.goto("/");
  await page.evaluate(({ localSessionId }) => {
    localStorage.setItem(`playnote:session:${localSessionId}:token`, "wrong-token");
    localStorage.setItem("playnote:active-session-id", localSessionId);
  }, { localSessionId: session.localId });

  await page.goto(`/s/${encodedSessionId}`);

  await expect(page.getByText("다시 초대 링크가 필요합니다")).toBeVisible();

  const storage = await page.evaluate((localSessionId) => ({
    token: localStorage.getItem(`playnote:session:${localSessionId}:token`),
    shareToken: localStorage.getItem(`playnote:session:${localSessionId}:share-token`),
    activeSessionId: localStorage.getItem("playnote:active-session-id"),
  }), session.localId);

  expect(storage.token).toBeNull();
  expect(storage.shareToken).toBeNull();
  expect(storage.activeSessionId).toBeNull();
});
