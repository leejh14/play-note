import { expect, test } from "@playwright/test";
import { createSessionViaApi } from "./helpers/graphql-client";

test("friends 화면은 role probe 결과에 따라 admin 액션 노출이 분기된다", async ({ page }) => {
  const session = await createSessionViaApi();

  await page.goto("/");
  await page.evaluate(({ localSessionId, token }) => {
    localStorage.setItem(`playnote:session:${localSessionId}:token`, token);
    localStorage.setItem("playnote:active-session-id", localSessionId);
  }, { localSessionId: session.localId, token: session.editorToken });

  await page.goto("/friends");
  await expect(page.getByText("친구 수정은 관리자 토큰에서만 가능합니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toHaveCount(0);

  await page.evaluate(({ localSessionId, token }) => {
    localStorage.setItem(`playnote:session:${localSessionId}:token`, token);
    localStorage.setItem("playnote:active-session-id", localSessionId);
  }, { localSessionId: session.localId, token: session.adminToken });

  await page.reload();
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
});
