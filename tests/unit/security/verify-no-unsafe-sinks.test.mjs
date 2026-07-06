import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('verify-no-unsafe-sinks passes on clean PWA tree', () => {
  const result = spawnSync(process.execPath, ['scripts/verify/verify-no-unsafe-sinks.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /verify-no-unsafe-sinks: OK/);
});

test('verify-no-unsafe-sinks fails when eval is introduced', () => {
  const fixture = 'apps/pwa-webapp/modules/__unsafe-sink-fixture__.js';
  writeFileSync(fixture, 'eval("1");\n', 'utf8');
  try {
    const result = spawnSync(process.execPath, ['scripts/verify/verify-no-unsafe-sinks.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr + result.stdout, /eval/);
  } finally {
    if (existsSync(fixture)) unlinkSync(fixture);
  }
});
