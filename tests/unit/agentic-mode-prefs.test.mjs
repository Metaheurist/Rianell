import { test } from 'node:test';
import assert from 'node:assert/strict';

test('mode prefs defaults and write round-trip via temp override', async () => {
  // Import after ensuring module uses AGENTIC_ROOT — write to real artifacts path is ok (gitignored)
  const { readModePrefs, writeModePrefs, DEFAULT_MODE_PREFS } = await import(
    '../../scripts/dev/agentic-pipeline/mode-prefs.mjs'
  );
  const before = readModePrefs();
  assert.equal(typeof before.mode, 'string');
  assert.equal('i18nFillScope' in DEFAULT_MODE_PREFS, true);
  const r = writeModePrefs({
    mode: 'serial',
    autoApprove: false,
    autoApproveMode: 'ack',
    i18nFillScope: 'tier-c',
  });
  assert.equal(r.ok, true);
  assert.equal(r.data.i18nFillScope, 'tier-c');
  // restore prior
  writeModePrefs(before);
});
