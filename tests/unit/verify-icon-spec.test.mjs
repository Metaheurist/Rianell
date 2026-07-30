import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('verify-icon-spec.mjs passes on current tree', () => {
  const r = spawnSync(process.execPath, ['scripts/verify/verify-icon-spec.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, (r.stderr || r.stdout || 'verify-icon-spec failed').trim());
});

test('icon design pack files exist under docs/style-and-design', () => {
  for (const rel of [
    'docs/style-and-design/icon-grid.md',
    'docs/style-and-design/icon-stroke-and-fill.md',
    'docs/style-and-design/motion-catalogue.md',
    'docs/style-and-design/subject-contracts.json',
  ]) {
    assert.ok(existsSync(rel), `missing ${rel}`);
  }
  const contracts = JSON.parse(readFileSync('docs/style-and-design/subject-contracts.json', 'utf8'));
  assert.ok(contracts.subjects?.stethoscope);
  assert.ok(contracts.subjects?.qr);
});

test('icon-a-audit.mjs --limit=3 exits 0', () => {
  const r = spawnSync(process.execPath, ['scripts/audit/icon-a-audit.mjs', '--limit=3'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 60_000,
  });
  assert.equal(r.status, 0, (r.stderr || r.stdout || 'icon-a-audit failed').trim());
});
