import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ciYml = fs.readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('CI includes RN CLI native artifact jobs (no EXPO_TOKEN)', () => {
  assert.match(ciYml, /rncli-android-apk:/);
  assert.match(ciYml, /rncli-ios-zip:/);
  assert.match(ciYml, /# React Native CLI native artifacts \(no EAS \/ no EXPO_TOKEN\)/);

  // The whole point of these jobs is to avoid token-gated EAS cloud builds.
  // (Mentions in comments are fine; hard dependencies / secret reads are not.)
  assert.doesNotMatch(ciYml, /secrets\.EXPO_TOKEN/);
  assert.doesNotMatch(ciYml, /EXPO_TOKEN secret/i);
  assert.doesNotMatch(ciYml, /Missing EXPO_TOKEN/i);
});

test('RN CLI jobs use rn-build-version sequential counter (not workflow run for RN rows)', () => {
  assert.match(ciYml, /rn-build-version:/);
  assert.match(ciYml, /outputs:\s*[\s\S]*rn_build:/m);
  assert.match(ciYml, /rncli-android-apk:\s*[\s\S]*?needs:\s*\[[^\]]*rn-build-version[^\]]*\]/m);
  assert.match(ciYml, /rncli-ios-zip:\s*[\s\S]*?needs:\s*\[[^\]]*rn-build-version[^\]]*\]/m);
  assert.match(ciYml, /RN_BUILD:\s*\$\{\{\s*needs\.rn-build-version\.outputs\.rn_build\s*\}\}/);
});

test('commit-app-build large-file fallback commits RN/Server latest.json metadata', () => {
  assert.match(ciYml, /App build\/RNCLI-Android\/latest\.json/);
  assert.match(ciYml, /App build\/iOS\/latest\.json/);
  assert.match(ciYml, /App build\/Server\/latest/);
});

test('RN CLI Android job must not use setup-java cache:gradle before prebuild', () => {
  // Gradle wrapper only exists under apps/rn-app/android after `expo prebuild`.
  // cache: gradle makes setup-java scan the repo at checkout and fails with no matching files.
  assert.doesNotMatch(ciYml, /cache:\s*gradle/);
});

test('RN CLI Android collect step globs APK from repo root (not android/ cwd)', () => {
  // Collect runs with default working-directory = workspace root; path must include apps/rn-app/android/.
  assert.match(
    ciYml,
    /apks=\(apps\/rn-app\/android\/app\/build\/outputs\/apk\/debug\/\*\.apk\)/
  );
});

test('publish-release depends on RN CLI artifacts', () => {
  // Guard against accidental removal from the release pipeline.
  assert.match(ciYml, /publish-release:\s*[\s\S]*needs:\s*\[[^\]]*rncli-android-apk[^\]]*rncli-ios-zip[^\]]*\]/m);
  assert.match(ciYml, /Download RN CLI Android APK artifact/);
  assert.match(ciYml, /Download RN CLI iOS emulator zip artifact/);
  assert.match(ciYml, /release-assets\/RNCLI\/Android/);
  assert.match(ciYml, /release-assets\/RNCLI\/iOS/);
});

test('RN jobs source Supabase from shared SUPABASE_* secrets', () => {
  assert.match(ciYml, /Expo export — production bundles[\s\S]*SUPABASE_URL:\s*\$\{\{\s*secrets\.SUPABASE_URL\s*\}\}/m);
  assert.match(ciYml, /Generate native project \(expo prebuild -> RN CLI\)[\s\S]*SUPABASE_URL:\s*\$\{\{\s*secrets\.SUPABASE_URL\s*\}\}/m);
  assert.match(ciYml, /SUPABASE_PUBLISHABLE_KEY:\s*\$\{\{\s*secrets\.SUPABASE_ANON_KEY\s*\}\}/);
});

test('Expo bundle job exports from apps/rn-app and verifies autolinking package', () => {
  assert.match(ciYml, /Expo export — production bundles[\s\S]*cd apps\/rn-app/m);
  assert.match(ciYml, /npx expo export --platform android --platform ios --output-dir dist-expo-prod/);
  assert.match(ciYml, /npm ls expo-modules-autolinking/);
});

test('CI includes benchmark jobs (web + expo) and merge commit on main', () => {
  assert.match(ciYml, /benchmarks-web:/);
  assert.match(ciYml, /benchmarks-expo:/);
  assert.match(ciYml, /commit-benchmarks:/);
  assert.match(ciYml, /prepare-minified-assets/);
  assert.match(ciYml, /node benchmarks\/scripts\/run-web-benchmarks\.mjs/);
  assert.match(ciYml, /node benchmarks\/scripts\/expo-bundle-stats\.mjs/);
  assert.match(ciYml, /node benchmarks\/scripts\/merge-benchmark-ci\.mjs/);
});

test('CI regenerates dependencies.md and verifies on PRs', () => {
  assert.match(ciYml, /commit-dependencies-doc:/);
  assert.match(ciYml, /generate-dependencies-doc\.mjs/);
  assert.match(ciYml, /Verify docs\/dependencies\.md matches manifests \(pull requests only\)/);
});

