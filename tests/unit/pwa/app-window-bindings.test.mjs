import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { readAppSource } from '../../../scripts/lib/app-source.mjs';

// Inline handlers, classic modules/*.js and summary-llm.js reach app code only through
// window.*. Extracting code from app.js must keep this set identical; update the fixture
// only when a binding is added or removed on purpose.
const FIXTURE = 'tests/fixtures/pwa-app-window-bindings.json';

function collectWindowBindings(src) {
  const names = new Set();
  for (const m of src.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) names.add(m[1]);
  return [...names].sort();
}

test('app.js and its extracted modules publish the same window.* bindings', () => {
  const expected = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const actual = collectWindowBindings(readAppSource());
  const missing = expected.filter((n) => !actual.includes(n));
  const added = actual.filter((n) => !expected.includes(n));
  assert.deepEqual({ missing, added }, { missing: [], added: [] });
});
