import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const webRoot = path.join(root, 'apps', 'pwa-webapp');

/** Read a PNG's IHDR width/height without any image library. */
function pngDimensions(buf) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buf.subarray(0, 8).equals(signature), 'not a valid PNG signature');
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR', 'first PNG chunk must be IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test('og-card social image exists and is 1200x630 PNG', () => {
  const p = path.join(webRoot, 'Icons', 'og-card.png');
  assert.ok(fs.existsSync(p), 'apps/pwa-webapp/Icons/og-card.png missing — run "npm run seo:og-card"');
  const { width, height } = pngDimensions(fs.readFileSync(p));
  assert.equal(width, 1200, 'og-card width must be 1200 (Open Graph recommended)');
  assert.equal(height, 630, 'og-card height must be 630 (Open Graph recommended)');
});

test('committed sitemap.xml exists and lists rianell.com URLs', () => {
  const p = path.join(webRoot, 'sitemap.xml');
  assert.ok(fs.existsSync(p), 'apps/pwa-webapp/sitemap.xml missing — run "npm run seo:sitemap"');
  const xml = fs.readFileSync(p, 'utf8');
  assert.match(xml, /<urlset\b/, 'sitemap must contain a <urlset>');
  assert.match(xml, /<loc>https:\/\/rianell\.com\//, 'sitemap must contain absolute rianell.com URLs');
});

test('robots.txt exists and blocks known AI-training crawlers', () => {
  const robots = fs.readFileSync(path.join(webRoot, 'robots.txt'), 'utf8');
  for (const bot of ['GPTBot', 'Google-Extended', 'CCBot', 'ClaudeBot']) {
    assert.match(robots, new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`), `robots.txt should block ${bot}`);
  }
});
