import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

function escapeImportPreviewHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

test('import preview escape neutralizes script tags', () => {
  const malicious = '<script>alert(1)</script>';
  const escaped = escapeImportPreviewHtml(malicious);
  assert.ok(!escaped.includes('<script'));
  assert.ok(escaped.includes('&lt;script'));
});

test('import-utils.js uses escapeImportPreviewHtml in showImportPreview', () => {
  const src = readFileSync('apps/pwa-webapp/import-utils.js', 'utf8');
  assert.match(src, /escapeImportPreviewHtml/);
  assert.match(src, /escapeImportPreviewHtml\(log\.date\)/);
});
