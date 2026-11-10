import { defineConfig } from "@playwright/test";

const port = 3100;
const baseURL = process.env.SETSAFE_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
  },
  webServer: {
    command: `SETSAFE_E2E_TEST_MODE=1 npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});