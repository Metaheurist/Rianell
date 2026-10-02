import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const SRC = readFileSync('scripts/audit/audit-boot-full.mjs', 'utf8');

test('boot probe warms up in a throwaway context before the timer starts', () => {
  const probe = SRC.slice(SRC.indexOf('async function bootProbe('));
  const warm = probe.indexOf('await warmUpBrowser(browser);');
  const launch = probe.indexOf('chromium.launch(');
  const t0 = probe.indexOf('const t0 = Date.now();');
  assert.ok(launch > -1 && warm > launch, 'warm-up runs after launch in the same browser');
  assert.ok(t0 > warm, 'warm-up is excluded from the timed elapsedMs');
});

test('warm-up is untimed best effort and can be disabled', () => {
  const fn = SRC.slice(SRC.indexOf('async function warmUpBrowser('), SRC.indexOf('async function bootProbe('));
  assert.match(fn, /process\.env\.PROBE_WARMUP === '0'/);
  assert.match(fn, /browser\.newContext\(\)/);
  assert.match(fn, /waitUntil: 'load'/);
  assert.match(fn, /ctx\.close\(\)/);
  assert.match(fn, /catch \(_\)/, 'warm-up errors never fail the audit');
});
