import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// Locks in the PWA-only migration: no React Native / Expo / Capacitor / Android / iOS
// native app surface remains, while PWA mobile-browser features stay intact.

test('react-native app workspace is removed', () => {
  assert.equal(existsSync('apps/rn-app'), false, 'apps/rn-app should not exist');
});

test('root package.json has no mobile workspace or native deps', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(Array.isArray(pkg.workspaces));
  assert.ok(!pkg.workspaces.includes('apps/rn-app'), 'workspaces must not include apps/rn-app');
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.overrides };
  const native = Object.keys(deps).filter((k) => /^expo|expo$|react-native/.test(k));
  assert.deepEqual(native, [], `no expo/react-native deps allowed, found: ${native.join(', ')}`);
});

test('turbo build outputs target .web-dist (not .android-dist)', () => {
  const turbo = readFileSync('turbo.json', 'utf8');
  assert.doesNotMatch(turbo, /\.android-dist/);
  assert.doesNotMatch(turbo, /build:apk/);
});

test('mobile-only CI workflows are gone', () => {
  assert.equal(existsSync('.github/workflows/llm-rn-gpu-manual.yml'), false);
  assert.equal(existsSync('.github/workflows/archive/expo-native-build.yml'), false);
  assert.equal(existsSync('.github/actions/cache-expo'), false);
  assert.equal(existsSync('.github/actions/cache-android-sdk'), false);
});

test('PWA runtime has no Capacitor detection branches', () => {
  const perf = readFileSync('apps/pwa-webapp/performance-utils.js', 'utf8');
  const notif = readFileSync('apps/pwa-webapp/notifications.js', 'utf8');
  const devmod = readFileSync('apps/pwa-webapp/device-module.js', 'utf8');
  assert.doesNotMatch(perf, /Capacitor/);
  assert.doesNotMatch(notif, /Capacitor/);
  assert.doesNotMatch(devmod, /Capacitor/);
});

test('native app-store download links are removed but PWA install stays', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.doesNotMatch(html, /id="icon-android"/);
  assert.doesNotMatch(html, /id="icon-apple"/);
  assert.doesNotMatch(html, /android-update-check\.js/);
  assert.equal(existsSync('apps/pwa-webapp/android-update-check.js'), false);
  assert.equal(existsSync('apps/pwa-webapp/src/buildDownloads.js'), false);
  // PWA mobile-browser features are retained.
  assert.match(html, /rel="apple-touch-icon"/);
});
