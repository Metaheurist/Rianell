import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  bumpAsset,
  collectVersionedAssets,
  checkLock,
  readLock,
} from '../../scripts/verify/cache-buster-lock.mjs';

test('every hand-versioned PWA asset matches its locked ?v= and content hash', () => {
  const problems = checkLock(collectVersionedAssets(), readLock());
  assert.deepEqual(
    problems,
    [],
    'Run: node scripts/verify/cache-buster-lock.mjs --bump <asset>',
  );
});

test('the lock covers the vendored shared bundle and lazily loaded scripts', () => {
  const { assets } = collectVersionedAssets();
  assert.ok(assets['vendor/rianell-shared.js']);
  assert.ok(assets['summary-llm.js'], 'lazyLoadScript references in app.js are scanned');
  assert.ok(assets['modules/ai-chat.js']);
  assert.equal(assets['app.js'], undefined, 'app.js is content-hashed by the build');
  assert.equal(assets['styles.css'], undefined, 'styles.css is content-hashed by the build');
});

test('content change without a bump is reported, a bump asks for a lock refresh', () => {
  const lock = { 'a.js': { v: 1, sha256: 'old' }, 'b.js': { v: 2, sha256: 'same' } };
  const unbumped = { assets: { 'a.js': { v: 1, sha256: 'new' }, 'b.js': { v: 2, sha256: 'same' } }, conflicts: [] };
  assert.deepEqual(checkLock(unbumped, lock), ['a.js: content changed but ?v=1 was not bumped']);

  const bumped = { assets: { 'a.js': { v: 2, sha256: 'new' }, 'b.js': { v: 2, sha256: 'same' } }, conflicts: [] };
  assert.match(checkLock(bumped, lock)[0], /a\.js: \?v= bumped to 2 - refresh the lock/);

  const added = { assets: { ...bumped.assets, 'c.js': { v: 1, sha256: 'x' } }, conflicts: [] };
  assert.ok(checkLock(added, lock).some((p) => p.startsWith('c.js: not in the lock')));

  const removed = { assets: { 'a.js': { v: 1, sha256: 'old' } }, conflicts: [] };
  assert.ok(checkLock(removed, lock).some((p) => p.startsWith('b.js: no longer referenced')));
});

test('references to one file with different ?v= values are flagged', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-buster-'));
  try {
    fs.mkdirSync(path.join(dir, 'modules'));
    fs.writeFileSync(path.join(dir, 'lazy.js'), 'export {};\r\n');
    fs.writeFileSync(path.join(dir, 'index.html'), '<script src="lazy.js?v=3"></script>');
    fs.writeFileSync(path.join(dir, 'loader.js'), "lazyLoadScript('lazy.js?v=2');\n");
    const { assets, conflicts } = collectVersionedAssets(dir);
    assert.equal(assets['lazy.js'].v, 3);
    assert.equal(conflicts.length, 1);
    assert.match(conflicts[0], /lazy\.js: \?v=3 in index\.html but \?v=2 in loader\.js/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('bumpAsset increments every reference without touching look-alike paths', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-buster-'));
  try {
    fs.mkdirSync(path.join(dir, 'modules'));
    fs.writeFileSync(path.join(dir, 'lazy.js'), '');
    fs.writeFileSync(path.join(dir, 'modules', 'lazy.js'), '');
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      '<script src="lazy.js?v=9"></script><script src="modules/lazy.js?v=9"></script>',
    );
    fs.writeFileSync(path.join(dir, 'loader.js'), "lazyLoadScript('lazy.js?v=9');\n");
    const result = bumpAsset('lazy.js', dir);
    assert.deepEqual(result, { from: 9, to: 10, files: ['index.html', 'loader.js'] });
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    assert.match(html, /src="lazy\.js\?v=10"/);
    assert.match(html, /src="modules\/lazy\.js\?v=9"/, 'a different file with the same basename is untouched');
    assert.match(fs.readFileSync(path.join(dir, 'loader.js'), 'utf8'), /lazy\.js\?v=10/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('line endings do not change the content hash', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-buster-'));
  try {
    fs.writeFileSync(path.join(dir, 'crlf.js'), 'a\r\nb\r\n');
    fs.writeFileSync(path.join(dir, 'lf.js'), 'a\nb\n');
    fs.writeFileSync(path.join(dir, 'index.html'), '<script src="crlf.js?v=1"></script><script src="lf.js?v=1"></script>');
    const { assets } = collectVersionedAssets(dir);
    assert.equal(assets['crlf.js'].sha256, assets['lf.js'].sha256);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
