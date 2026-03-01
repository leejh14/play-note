import { defineConfig, devices } from "@playwright/test";

const webBaseUrl = process.env.E2E_WEB_BASE_URL ?? "http://localhost:3000";
const apiBaseUrl = process.env.E2E_API_URL ?? "http://localhost:4000/graphql";
const useExternalServer = process.env.E2E_EXTERNAL_SERVER === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: webBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: useExternalServer
    ? undefined
    : [
        {
          command: "cd ../.. && yarn workspace @playnote/api start",
          port: 4000,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            API_PORT: "4000",
            PUBLIC_BASE_URL: webBaseUrl,
          },
        },
        {
          command: "cd ../.. && yarn workspace @playnote/web dev -p 3000",
          port: 3000,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            NEXT_PUBLIC_GRAPHQL_URL: apiBaseUrl,
          },
        },
      ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
