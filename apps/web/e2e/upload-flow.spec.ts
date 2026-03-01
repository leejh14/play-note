import { expect, test } from "@playwright/test";
import {
  createSessionViaApi,
  getSessionSnapshotViaApi,
} from "./helpers/graphql-client";

function encodeGlobalSessionId(globalSessionId: string): string {
  return encodeURIComponent(globalSessionId);
}

test("detail에서 presigned upload 플로우가 완료되고 첨부가 반영된다", async ({ page }) => {
  const session = await createSessionViaApi({ contentType: "FUTSAL" });
  const encodedSessionId = encodeGlobalSessionId(session.globalId);

  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() === "PUT") {
      await route.fulfill({
        status: 200,
        body: "",
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`/s/${encodedSessionId}?t=${session.editorToken}`);
  await expect(page).toHaveURL(new RegExp(`/s/${encodedSessionId}/setup$`));
  await page.goto(`/s/${encodedSessionId}/detail`);
  await expect(page.getByText("Photos", { exact: true }).first()).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "match-result.png",
    mimeType: "image/png",
    buffer: Buffer.from("playnote-e2e-upload"),
  });

  await expect(page.getByText("1개 파일 선택됨")).toBeVisible();
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText("업로드가 완료되었습니다.")).toBeVisible({ timeout: 15_000 });

  const snapshot = await getSessionSnapshotViaApi({
    globalSessionId: session.globalId,
    localSessionId: session.localId,
    token: session.editorToken,
  });
  expect(snapshot.attachmentCount).toBeGreaterThanOrEqual(1);
});
