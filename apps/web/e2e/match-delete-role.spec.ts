import { expect, test } from "@playwright/test";
import {
  createSessionViaApi,
  getSessionSnapshotViaApi,
} from "./helpers/graphql-client";

function encodeGlobalSessionId(globalSessionId: string): string {
  return encodeURIComponent(globalSessionId);
}

async function waitForMatchCount(input: {
  readonly globalSessionId: string;
  readonly localSessionId: string;
  readonly token: string;
  readonly expectedCount: number;
  readonly timeoutMs?: number;
}): Promise<number> {
  const deadline = Date.now() + (input.timeoutMs ?? 6_000);
  let currentCount = -1;

  while (Date.now() < deadline) {
    const snapshot = await getSessionSnapshotViaApi({
      globalSessionId: input.globalSessionId,
      localSessionId: input.localSessionId,
      token: input.token,
    });
    currentCount = snapshot.matchCount;
    if (currentCount === input.expectedCount) {
      return currentCount;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return currentCount;
}

test("match delete는 editor에서 숨김, admin에서 가능하다", async ({ page }) => {
  const session = await createSessionViaApi({ contentType: "FUTSAL" });
  const encodedSessionId = encodeGlobalSessionId(session.globalId);

  await page.goto(`/s/${encodedSessionId}?t=${session.editorToken}`);
  await expect(page).toHaveURL(new RegExp(`/s/${encodedSessionId}/setup$`), {
    timeout: 15_000,
  });
  await page.goto(`/s/${encodedSessionId}/detail`);

  await page.getByRole("button", { name: "+ New Match" }).click();
  await expect(
    page.locator("div.text-\\[12px\\]").filter({ hasText: /^Match #1$/ }).first(),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  const editorSnapshot = await getSessionSnapshotViaApi({
    globalSessionId: session.globalId,
    localSessionId: session.localId,
    token: session.editorToken,
  });
  expect(editorSnapshot.matchCount).toBe(1);

  await page.goto(`/s/${encodedSessionId}?t=${session.adminToken}`);
  await expect(page).toHaveURL(new RegExp(`/s/${encodedSessionId}/setup$`), {
    timeout: 15_000,
  });
  await page.goto(`/s/${encodedSessionId}/detail`);

  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("매치 삭제")).toBeVisible();
  await page.getByRole("button", { name: "삭제" }).click();

  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  const adminMatchCount = await waitForMatchCount({
    globalSessionId: session.globalId,
    localSessionId: session.localId,
    token: session.adminToken,
    expectedCount: 0,
  });
  expect(adminMatchCount).toBe(0);
});
