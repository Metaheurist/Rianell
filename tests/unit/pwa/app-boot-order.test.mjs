import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');

// A stored log without food/exercise makes migrateLogs() invalidate caches declared
// later in app.js. Run any earlier and returning users hit a TDZ / undefined error
// that aborts the IIFE bundle and leaves the app stuck on "Loading Rianell...".
test('load-time migrateLogs() is the last top-level statement in app.js', () => {
  const calls = [...appJs.matchAll(/^migrateLogs\(\);/gm)];
  assert.equal(calls.length, 1, 'expected exactly one top-level migrateLogs() call');
  const tail = appJs.slice(calls[0].index + 'migrateLogs();'.length).trim();
  assert.equal(tail, '', 'nothing may follow the load-time migrateLogs() call');
});

test('caches touched by migrateLogs() are declared before the load-time call', () => {
  const call = appJs.search(/^migrateLogs\(\);/m);
  for (const decl of [/^let _filteredLogsCache\b/m, /^const _chartResultsCache\b/m, /^const STRESSOR_GROUPS\b/m]) {
    const at = appJs.search(decl);
    assert.ok(at > 0 && at < call, `${decl} must be declared before migrateLogs() runs`);
  }
});

test('inline handlers are attached before the load-time migration', () => {
  const attach = appJs.search(/^attachInlineHandlersToWindow\(\);/m);
  const call = appJs.search(/^migrateLogs\(\);/m);
  assert.ok(attach > 0 && attach < call);
});
