import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 3005;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      PORT: String(PORT),
      GEMINI_API_KEY: "",
      DB_PATH: "./src/data/db.test.json",
    },
  },
});
