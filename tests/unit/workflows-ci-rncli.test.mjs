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

test('RN CLI jobs use rn-build-version for sequential RN build numbers', () => {
  assert.match(ciYml, /rn-build-version:/);
  assert.match(ciYml, /outputs:\s*[\s\S]*rn_build:/m);
  assert.match(ciYml, /rncli-android-apk:\s*[\s\S]*?needs:\s*\[[^\]]*rn-build-version[^\]]*\]/m);
  assert.match(ciYml, /rncli-ios-zip:\s*[\s\S]*?needs:\s*\[[^\]]*rn-build-version[^\]]*\]/m);
});

test('RN CLI Android job must not use setup-java cache:gradle before prebuild', () => {
  // Gradle wrapper only exists under apps/mobile/android after `expo prebuild`.
  // cache: gradle makes setup-java scan the repo at checkout and fails with no matching files.
  assert.doesNotMatch(ciYml, /cache:\s*gradle/);
});

test('publish-release depends on RN CLI artifacts', () => {
  // Guard against accidental removal from the release pipeline.
  assert.match(ciYml, /publish-release:\s*[\s\S]*needs:\s*\[[^\]]*rncli-android-apk[^\]]*rncli-ios-zip[^\]]*\]/m);
  assert.match(ciYml, /Download RN CLI Android APK artifact/);
  assert.match(ciYml, /Download RN CLI iOS emulator zip artifact/);
  assert.match(ciYml, /release-assets\/RNCLI\/Android/);
  assert.match(ciYml, /release-assets\/RNCLI\/iOS/);
});

