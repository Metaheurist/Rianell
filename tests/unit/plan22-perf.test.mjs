import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readAppSource } from '../../scripts/lib/app-source.mjs';

const root = join(import.meta.dirname, '..', '..');

test('bundle split verify script passes markers', () => {
  const src = readFileSync(join(root, 'scripts/verify/verify-bundle-split.mjs'), 'utf8');
  assert.match(src, /lazyCharts|lazy/);
});

test('PWA app.js includes lazy chart loading', () => {
  const app = readAppSource();
  assert.ok(/lazyCharts|lazyLoadCharts|import\s*\(/.test(app));
});
