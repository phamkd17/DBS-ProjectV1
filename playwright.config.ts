import { defineConfig } from "@playwright/test";

// Run with: npm run verify   (loads .env.local; app must be running on :3000)
export default defineConfig({
  testDir: "./verify",
  timeout: 6 * 60_000, // the core task waits on Gemini twice
  workers: 1,
  expect: { timeout: 15_000 }, // first loads compile on demand in dev
  reporter: [["list"]],
  use: {
    baseURL: process.env.VERIFY_URL ?? "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    actionTimeout: 15_000, // a blocked click fails fast instead of hanging
    navigationTimeout: 30_000, // AI steps pass their own longer timeout
  },
  outputDir: "verify/.results",
});
