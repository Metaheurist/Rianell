import { test, expect } from '@playwright/test';

const baseURL = process.env.PROBE_URL || 'http://127.0.0.1:9876/';

test.describe('PWA smoke', () => {
  test('shell renders after boot', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(() => document.body.classList.contains('loaded'), null, {
      timeout: 120_000,
    });
    await expect(page.locator('#appShell')).toBeVisible({ timeout: 30_000 });
  });
});
