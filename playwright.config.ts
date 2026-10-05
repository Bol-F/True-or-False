import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const inheritedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] =>
    Boolean(entry[1]),
  ),
);
const testServiceEnvironment = {
  ...inheritedEnvironment,
  ML_API_JWT_SECRET: "playwright-only-service-secret-with-at-least-32-bytes",
  GEMINI_REVIEW_ENABLED:
    process.env.LIVE_GEMINI_E2E === "1"
      ? inheritedEnvironment.GEMINI_REVIEW_ENABLED ?? "true"
      : "false",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  outputDir: join(tmpdir(), "rufact-playwright-results"),
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev:ml -- --port 8010",
      url: "http://127.0.0.1:8010/health",
      env: testServiceEnvironment,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      env: {
        ...testServiceEnvironment,
        ML_API_URL: "http://127.0.0.1:8010/predict",
      },
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
