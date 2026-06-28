import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldSuppressFirstRunLoggingPrompt } from '@rianell/shared';

test('shouldSuppressFirstRunLoggingPrompt before first entry or onboarding complete', () => {
  const ctx = { platform: 'pwa' };
  assert.equal(
    shouldSuppressFirstRunLoggingPrompt({ firstRunWizardCompletedAt: null }, [], ctx),
    true,
  );
  assert.equal(
    shouldSuppressFirstRunLoggingPrompt(
      { firstRunWizardCompletedAt: '2026-01-01T00:00:00.000Z' },
      [],
      ctx,
    ),
    true,
  );
});

test('shouldSuppressFirstRunLoggingPrompt allows nudge after first log and wizard complete', () => {
  const ctx = { platform: 'pwa' };
  assert.equal(
    shouldSuppressFirstRunLoggingPrompt(
      { firstRunWizardCompletedAt: '2026-01-01T00:00:00.000Z' },
      [{ date: '2026-01-01' }],
      ctx,
    ),
    false,
  );
});
