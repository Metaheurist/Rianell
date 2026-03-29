import { defineConfig } from '@playwright/test';

/** Reserved for future spec-based tests; current perf flows run from Node scripts (`navigation-timing.mjs`). */
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 180_000,
});
