import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  decideBuildFreshnessAction,
  checkBuildFreshness,
  RELOAD_GUARD_KEY,
} from '../../../apps/pwa-webapp/modules/app/build-freshness.js';
import { computeBuildId, injectBuildMeta } from '../../../apps/pwa-webapp/fingerprint-assets.mjs';

function fakeEnv({ pageBuild = 'aaa', latestBuild = 'bbb', guard = '', interacted = false, online = true, ok = true, modalShown = false } = {}) {
  const store = new Map(guard ? [[RELOAD_GUARD_KEY, guard]] : []);
  const calls = { reload: 0, confirm: [], fetch: [] };
  const win = {
    navigator: { onLine: online, userActivation: { hasBeenActive: interacted } },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    __rianellPwaUpdateModalShown: modalShown,
  };
  const doc = {
    querySelector: (sel) => (pageBuild && sel === 'meta[name="rianell-build"]' ? { getAttribute: () => pageBuild } : null),
  };
  const deps = {
    window: win,
    document: doc,
    fetch: (url, init) => {
      calls.fetch.push({ url, init });
      return Promise.resolve({ ok, json: () => Promise.resolve({ mainJs: 'app.x.min.js', buildId: latestBuild }) });
    },
    confirm: (...args) => calls.confirm.push(args),
    reload: () => { calls.reload++; },
  };
  return { deps, calls, store, win };
}

test('decision: matching, missing or already-retried builds do nothing', () => {
  assert.equal(decideBuildFreshnessAction({ pageBuild: 'a', latestBuild: 'a' }), 'none');
  assert.equal(decideBuildFreshnessAction({ pageBuild: '', latestBuild: 'b' }), 'none');
  assert.equal(decideBuildFreshnessAction({ pageBuild: 'a', latestBuild: '' }), 'none');
  assert.equal(decideBuildFreshnessAction({ pageBuild: 'a', latestBuild: 'b', lastReloadFor: 'b' }), 'none');
});

test('decision: stale shell reloads before interaction, prompts after', () => {
  assert.equal(decideBuildFreshnessAction({ pageBuild: 'a', latestBuild: 'b', interacted: false }), 'reload');
  assert.equal(decideBuildFreshnessAction({ pageBuild: 'a', latestBuild: 'b', interacted: true }), 'prompt');
});

test('stale shell before interaction reloads once and records the guard', async () => {
  const { deps, calls, store } = fakeEnv();
  assert.equal(await checkBuildFreshness(deps), 'reload');
  assert.equal(calls.reload, 1);
  assert.equal(store.get(RELOAD_GUARD_KEY), 'bbb');
  assert.equal(calls.fetch[0].url, 'asset-manifest.json');
  assert.equal(calls.fetch[0].init.cache, 'no-store');
  assert.equal(await checkBuildFreshness(deps), 'none', 'no reload loop when the edge is still stale');
  assert.equal(calls.reload, 1);
});

test('stale shell after interaction reuses the Update modal instead of reloading', async () => {
  const { deps, calls, win } = fakeEnv({ interacted: true });
  assert.equal(await checkBuildFreshness(deps), 'prompt');
  assert.equal(calls.reload, 0);
  assert.equal(calls.confirm.length, 1);
  assert.equal(calls.confirm[0][1], 'Update available');
  assert.equal(win.__rianellPwaUpdateModalShown, true);
  calls.confirm[0][2]();
  assert.equal(calls.reload, 1, 'confirm reloads');
});

test('an open SW update modal is not stacked', async () => {
  const { deps, calls } = fakeEnv({ interacted: true, modalShown: true });
  assert.equal(await checkBuildFreshness(deps), 'none');
  assert.equal(calls.confirm.length, 0);
});

test('skips without a page meta, offline, or on a failed manifest fetch', async () => {
  const noMeta = fakeEnv({ pageBuild: '' });
  assert.equal(await checkBuildFreshness(noMeta.deps), 'skipped');
  assert.equal(noMeta.calls.fetch.length, 0);
  const offline = fakeEnv({ online: false });
  assert.equal(await checkBuildFreshness(offline.deps), 'skipped');
  const failed = fakeEnv({ ok: false });
  assert.equal(await checkBuildFreshness(failed.deps), 'none');
  assert.equal(failed.calls.reload, 0);
  const thrown = fakeEnv();
  thrown.deps.fetch = () => Promise.reject(new Error('net'));
  assert.equal(await checkBuildFreshness(thrown.deps), 'skipped');
});

test('build id ignores its own meta and is injected after the charset', () => {
  const html = '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <title>x</title>\n</head>\n</html>\n';
  const id = computeBuildId(html);
  assert.match(id, /^[0-9a-f]{12}$/);
  const patched = injectBuildMeta(html, id);
  assert.match(patched, /<meta charset="UTF-8" \/>\n  <meta name="rianell-build" content="[0-9a-f]{12}">\n  <title>/);
  assert.equal(computeBuildId(patched), id, 'stable across re-patching');
  assert.equal(injectBuildMeta(patched, 'ffffffffffff').match(/rianell-build/g).length, 1);
  assert.notEqual(computeBuildId(html.replace('x', 'y')), id);
});

test('site build writes buildId into asset-manifest and the freshness check runs from SW init', () => {
  const site = readFileSync('apps/pwa-webapp/build-site.mjs', 'utf8');
  assert.match(site, /const buildId = patchIndexHtml\(/);
  assert.match(site, /writeAssetManifest\(siteDir, \{ \.\.\.manifest, buildId \}\)/);
  const sw = readFileSync('apps/pwa-webapp/modules/app/service-worker.js', 'utf8');
  assert.match(sw, /import \{ scheduleBuildFreshnessCheck \} from '\.\/build-freshness\.js'/);
  assert.match(sw, /scheduleBuildFreshnessCheck\(\{/);
});
