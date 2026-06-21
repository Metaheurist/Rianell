import fs from 'node:fs';
import path from 'node:path';
import { existsSync, readTextFileSync } from '@rianell/shared';

const platform = (process.argv[2] || '').toLowerCase();
if (!platform || !['web', 'android', 'ios'].includes(platform)) {
  console.error('Usage: node scripts/verify/check-platform-parity.mjs <web|android|ios>');
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

function expectAbsent(relPath, pattern, why) {
  if (!exists(relPath)) {
    checks.push({ ok: true, relPath, why });
    return;
  }
  const txt = read(relPath);
  const ok = typeof pattern === 'string' ? !txt.includes(pattern) : !pattern.test(txt);
  checks.push({ ok, relPath, why });
  if (!ok) console.error(`Check failed (should be absent): ${relPath} (${why})`);
}

// Shared PWA + RN hooks
expectContains('apps/pwa-webapp/app.js', /SpeechRecognition|webkitSpeechRecognition/, 'STT guard exists');
expectContains('apps/pwa-webapp/ui-feedback.js', 'function showToast', 'unified toast API');
expectContains('apps/pwa-webapp/app.js', 'function notifySuccess', 'PWA toast wrapper');
expectContains('apps/rn-app/src/components/ui/Toast.tsx', 'ToastProvider', 'RN toast provider');
expectContains('apps/pwa-webapp/notifications.js', 'LocalNotifications', 'notifications plugin path');
expectContains('apps/pwa-webapp/notification-helpers.js', 'isNativeNotificationCapable', 'native notification permission handling');
expectContains('apps/pwa-webapp/summary-llm.js', 'onnx-community/Llama-3.2-1B-Instruct', 'PWA on-device LLM model');
expectContains('apps/pwa-webapp/summary-llm.js', 'progress_callback', 'LLM download progress');
expectContains('apps/pwa-webapp/app.js', 'promptAiModelDownloadConsent', 'AI model download consent');
expectContains('apps/rn-app/src/ai/llm.ts', 'Llama-3.2-1B-Instruct', 'RN LLM model naming tier3+');
expectContains('apps/rn-app/src/ai/llm.ts', /SmolLM2-360M-Instruct/, 'RN LLM model naming tier1-2');

// Capacitor must be gone
expectAbsent('apps/capacitor-app/package.json', '.', 'Capacitor app removed');

if (platform === 'web') {
  expectContains('apps/pwa-webapp/vendor/rianell-shared.js', 'mergeHealthLogs', 'PWA shared vendor bundle');
  expectContains('apps/pwa-webapp/vendor/rianell-shared.js', 'computeAchievementSnapshots', 'PWA vendor exports achievements');
  expectContains('apps/pwa-webapp/achievements-sync.js', 'syncAchievementsToCloud', 'PWA achievements cloud sync');
  expectContains('apps/pwa-webapp/modules/goals-carousel.js', 'goalsCarouselGo', 'PWA goals carousel module');
  expectContains('apps/pwa-webapp/vendor/rianell-ai-engine.js', 'analyzeHealthMetrics', 'PWA AI engine vendor bundle');
  expectAbsent('apps/pwa-webapp/summary-llm.js', /flan-t5|Xenova\/flan/i, 'no legacy flan-t5 in LLM module');
  expectAbsent('apps/pwa-webapp/app.js', 'function legacyEmojiIcon', 'legacy emoji shim removed');
}

if (platform === 'android' || platform === 'ios') {
  expectFile('apps/rn-app/app.config.js', 'RN Expo app config');
  expectContains('apps/rn-app/app.config.js', 'supabaseUrl', 'RN Supabase config in app.config.js');
  expectContains('apps/rn-app/src/permissions/permissions.ts', 'expo-notifications', 'RN notifications module path');
  expectContains('apps/rn-app/src/settings/SettingsAppInstallSection.tsx', 'App installation', 'RN app install section');
  expectContains('apps/rn-app/src/screens/SettingsScreen.tsx', 'Personal', 'RN settings 8-pane parity');
  expectContains('apps/rn-app/src/cloud/sync.ts', 'export async function syncToCloud', 'RN cloud syncToCloud');
  expectContains('apps/rn-app/src/cloud/sync.ts', 'export async function loadFromCloud', 'RN cloud loadFromCloud');
  expectContains('apps/rn-app/src/cloud/sync.ts', 'export async function syncAnonymizedData', 'RN anonymized sync');
  expectContains('apps/rn-app/src/cloud/sync.ts', 'export async function deleteCloudLogs', 'RN delete cloud logs');
  expectContains('apps/rn-app/src/cloud/achievementsSync.ts', 'export async function syncAchievementsToCloud', 'RN achievements cloud sync');
  expectContains('apps/rn-app/src/components/GoalsModal.tsx', 'GoalsModal', 'RN goals modal with carousel');
  expectContains('apps/rn-app/src/storage/preferences.ts', 'userName:', 'RN personal profile field');
  expectContains('apps/rn-app/src/storage/preferences.ts', 'contributeAnonData:', 'RN anon contribution field');
  expectContains('apps/rn-app/src/ai/engine.ts', '@rianell/ai-engine', 'RN AI engine uses shared package');
}

const failed = checks.filter((c) => !c.ok);
if (failed.length > 0) {
  console.error(`\nPlatform parity checks failed: ${failed.length}`);
  process.exit(1);
}

console.log(`Platform parity checks passed for ${platform} (${checks.length} checks).`);
