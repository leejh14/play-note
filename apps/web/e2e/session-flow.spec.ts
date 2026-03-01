import { expect, test } from "@playwright/test";
import {
  createSessionViaApi,
  getSessionSnapshotViaApi,
} from "./helpers/graphql-client";

function encodeGlobalSessionId(globalSessionId: string): string {
  return encodeURIComponent(globalSessionId);
}

test("setup에서 confirm 후 detail로 이동하고 세션 상태가 CONFIRMED로 반영된다", async ({
  page,
}) => {
  const session = await createSessionViaApi();
  const encodedSessionId = encodeGlobalSessionId(session.globalId);

  await page.goto(`/s/${encodedSessionId}?t=${session.editorToken}`);
  await expect(page).toHaveURL(new RegExp(`/s/${encodedSessionId}/setup$`));

  await page.getByRole("button", { name: /Confirm Setup/i }).click();
  await expect(page).toHaveURL(new RegExp(`/s/${encodedSessionId}/detail$`));
  await expect(page.getByText("Matches")).toBeVisible();

  const snapshot = await getSessionSnapshotViaApi({
    globalSessionId: session.globalId,
    localSessionId: session.localId,
    token: session.editorToken,
  });
  expect(snapshot.status).toBe("CONFIRMED");
});
