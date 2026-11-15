import { defineConfig } from "@playwright/test";

// Run with: npm run verify   (loads .env.local; app must be running on :3000)
export default defineConfig({
  testDir: "./verify",
  timeout: 6 * 60_000, // the core task waits on Gemini twice
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.VERIFY_URL ?? "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  outputDir: "verify/.results",
});
