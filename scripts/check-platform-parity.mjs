import fs from 'node:fs';
import path from 'node:path';
import { existsSync, readTextFileSync } from '@rianell/shared';

const platform = (process.argv[2] || '').toLowerCase();
if (!platform || (platform !== 'android' && platform !== 'ios')) {
  console.error('Usage: node scripts/check-platform-parity.mjs <android|ios>');
  process.exit(2);
}

const repoRoot = process.cwd();
const checks = [];

function exists(relPath) {
  return existsSync(fs, path.join(repoRoot, relPath));
}

function read(relPath) {
  return readTextFileSync(fs, path.join(repoRoot, relPath));
}

function expectFile(relPath, why) {
  const ok = exists(relPath);
  checks.push({ ok, relPath, why });
  if (!ok) console.error(`Missing: ${relPath} (${why})`);
}

function expectContains(relPath, pattern, why) {
  if (!exists(relPath)) {
    checks.push({ ok: false, relPath, why: `${why} (file missing)` });
    console.error(`Missing: ${relPath} (${why})`);
    return;
  }
  const txt = read(relPath);
  const ok = typeof pattern === 'string' ? txt.includes(pattern) : pattern.test(txt);
  checks.push({ ok, relPath, why });
  if (!ok) console.error(`Check failed: ${relPath} (${why})`);
}

// Shared behavior parity hooks in web layer.
expectContains('web/app.js', /SpeechRecognition|webkitSpeechRecognition/, 'STT guard exists (feature parity messaging path)');
expectContains('web/notifications.js', 'LocalNotifications', 'native notifications plugin path exists');
expectContains('web/notification-helpers.js', 'isNativeNotificationCapable', 'native-first notification permission handling exists');

if (platform === 'android') {
  expectFile('react-app/android/app/src/main/AndroidManifest.xml', 'Android manifest generated/synced');
  expectContains('react-app/android/app/src/main/AndroidManifest.xml', 'POST_NOTIFICATIONS', 'Android notifications permission present');
  expectContains('react-app/android/app/src/main/AndroidManifest.xml', 'android:networkSecurityConfig="@xml/network_security_config"', 'Android network security config wired in manifest');
  expectContains('react-app/patch-android-sdk.js', 'network_security_config', 'Android network security patch enforced');
  expectContains('react-app/patch-android-sdk.js', 'BridgeActivity', 'Android orientation patch targets BridgeActivity');
}

if (platform === 'ios') {
  expectFile('react-app/ios/App/App/Info.plist', 'iOS Info.plist generated/synced');
  expectContains('react-app/ios/App/App/Info.plist', /UISupportedInterfaceOrientations|UISupportedInterfaceOrientations~ipad/, 'iOS orientation keys present');
  expectContains('react-app/patch-ios-orientation.js', 'UISupportedInterfaceOrientations', 'iOS orientation patch present');
  expectContains('react-app/capacitor.config.ts', 'LocalNotifications', 'Capacitor LocalNotifications plugin configured');
}

const failed = checks.filter((c) => !c.ok);
if (failed.length > 0) {
  console.error(`\nPlatform parity checks failed: ${failed.length}`);
  process.exit(1);
}

console.log(`Platform parity checks passed for ${platform} (${checks.length} checks).`);
