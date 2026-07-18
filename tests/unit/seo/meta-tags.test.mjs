import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const webRoot = path.join(root, 'apps', 'pwa-webapp');

const CONTENT_PAGES = [
  { file: 'index.html', url: 'https://rianell.com/' },
  { file: 'about.html', url: 'https://rianell.com/about.html' },
  { file: 'privacy.html', url: 'https://rianell.com/privacy.html' },
  { file: 'tos.html', url: 'https://rianell.com/tos.html' },
  { file: 'features/index.html', url: 'https://rianell.com/features/' },
  { file: 'symptom-tracking/index.html', url: 'https://rianell.com/symptom-tracking/' },
  { file: 'mental-health-check/index.html', url: 'https://rianell.com/mental-health-check/' },
  { file: 'ai-insights/index.html', url: 'https://rianell.com/ai-insights/' },
  { file: 'community/index.html', url: 'https://rianell.com/community/' },
  { file: 'conditions/index.html', url: 'https://rianell.com/conditions/' },
];

function read(file) {
  return fs.readFileSync(path.join(webRoot, file), 'utf8');
}

for (const { file, url } of CONTENT_PAGES) {
  test(`${file}: has exactly one <title>`, () => {
    const html = read(file);
    const count = (html.match(/<title>/g) || []).length;
    assert.equal(count, 1, `expected 1 <title> in ${file}, found ${count}`);
  });

  test(`${file}: has a self-referencing canonical`, () => {
    const html = read(file);
    assert.ok(
      html.includes(`<link rel="canonical" href="${url}"`),
      `missing/incorrect canonical in ${file} (expected ${url})`,
    );
  });

  test(`${file}: has a meta description`, () => {
    const html = read(file);
    assert.match(html, /<meta name="description" content="[^"]{20,}"/, `missing meta description in ${file}`);
  });

  test(`${file}: uses the dedicated og-card social image`, () => {
    const html = read(file);
    assert.ok(
      html.includes('https://rianell.com/Icons/og-card.png'),
      `${file} should reference the og-card social image`,
    );
    assert.ok(!html.includes('screenshot-wide.png'), `${file} should not reference the removed screenshot-wide.png`);
  });

  test(`${file}: declares hreflang alternates`, () => {
    const html = read(file);
    assert.match(html, /hreflang="en"/, `missing hreflang="en" in ${file}`);
    assert.match(html, /hreflang="x-default"/, `missing hreflang="x-default" in ${file}`);
  });

  test(`${file}: JSON-LD blocks parse as valid JSON`, () => {
    const html = read(file);
    const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m;
    let blocks = 0;
    while ((m = re.exec(html)) !== null) {
      blocks++;
      assert.doesNotThrow(() => JSON.parse(m[1]), `invalid JSON-LD in ${file}`);
    }
    assert.ok(blocks >= 1, `${file} should have at least one JSON-LD block`);
  });
}

test('index.html declares SoftwareApplication structured data', () => {
  const html = read('index.html');
  assert.match(html, /"SoftwareApplication"/, 'index.html JSON-LD should include SoftwareApplication');
  assert.match(html, /"applicationCategory":\s*"HealthApplication"/);
  assert.match(html, /"price":\s*"0"/, 'app should be marked free (price 0)');
});

test('mental-health-check declares a FAQPage', () => {
  const html = read('mental-health-check/index.html');
  assert.match(html, /"FAQPage"/, 'mental-health-check should include FAQPage structured data');
});

test('theme-color matches between index.html and manifest.json', () => {
  const html = read('index.html');
  const manifest = JSON.parse(read('manifest.json'));
  const m = html.match(/<meta name="theme-color" content="(#[0-9a-fA-F]{3,8})">/);
  assert.ok(m, 'index.html should declare a theme-color meta');
  assert.equal(m[1].toLowerCase(), String(manifest.theme_color).toLowerCase(), 'theme-color must match manifest theme_color');
});

test('manifest shortcut URLs are all relative (./)', () => {
  const manifest = JSON.parse(read('manifest.json'));
  for (const s of manifest.shortcuts || []) {
    assert.ok(s.url.startsWith('./'), `shortcut url should be relative: ${s.url}`);
  }
});

test('index.html exposes crawlable links to content pages via <noscript>', () => {
  const html = read('index.html');
  const noscript = html.match(/<noscript>[\s\S]*?<\/noscript>/);
  assert.ok(noscript, 'index.html should contain a <noscript> nav');
  for (const href of ['/features/', '/symptom-tracking/', '/mental-health-check/', '/ai-insights/', '/community/', '/conditions/']) {
    assert.ok(noscript[0].includes(`href="${href}"`), `noscript nav missing link to ${href}`);
  }
});
