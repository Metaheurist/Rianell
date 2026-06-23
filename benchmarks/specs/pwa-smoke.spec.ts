import { test, expect } from '@playwright/test';

const baseURL = process.env.PROBE_URL || 'http://127.0.0.1:9876/';

test.describe('PWA smoke', () => {
  test('shell renders and settings overlay opens', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('#appShell')).toBeVisible({ timeout: 60_000 });

    const settingsBtn = page.locator('#settingsBtn, [data-action="open-settings"], button[aria-label*="Settings" i]').first();
    if (await settingsBtn.count()) {
      await settingsBtn.click();
      const overlay = page.locator('#settingsOverlay, .settings-overlay, [data-settings-overlay]').first();
      await expect(overlay).toBeVisible({ timeout: 15_000 });
      const closeBtn = page.locator('#settingsCloseBtn, [data-action="close-settings"], .settings-close').first();
      if (await closeBtn.count()) {
        await closeBtn.click();
        await expect(overlay).toBeHidden({ timeout: 10_000 });
      }
    }
  });
});
