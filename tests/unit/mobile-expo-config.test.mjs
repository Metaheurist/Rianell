import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const appJsonPath = path.join(repoRoot, 'apps/rn-app/app.json');
const pluginPath = path.join(repoRoot, 'apps/rn-app/plugins/withAsyncStorageLocalRepo.js');

test('mobile app.json registers Async Storage local Maven plugin (CI Android)', () => {
  const raw = fs.readFileSync(appJsonPath, 'utf8');
  const app = JSON.parse(raw);
  const plugins = app.expo?.plugins;
  assert.ok(Array.isArray(plugins), 'expo.plugins must be an array');
  assert.ok(
    plugins.some((p) => p === './plugins/withAsyncStorageLocalRepo.js'),
    'withAsyncStorageLocalRepo must be listed for Gradle to resolve storage-android'
  );
});

test('withAsyncStorageLocalRepo plugin injects shared_storage marker into Gradle', () => {
  const src = fs.readFileSync(pluginPath, 'utf8');
  assert.match(src, /Async Storage v3 local_repo \(shared_storage\)/);
  assert.match(src, /withProjectBuildGradle/);
  assert.match(src, /local_repo/);
});

test('app.config.js merges app.json and Supabase extra for native builds', () => {
  const appConfigPath = path.join(repoRoot, 'apps/rn-app/app.config.js');
  assert.ok(fs.existsSync(appConfigPath), 'app.config.js must exist for Expo extra and shared Supabase envs');
  const mod = fs.readFileSync(appConfigPath, 'utf8');
  assert.match(mod, /EXPO_PUBLIC_SUPABASE_URL/);
  assert.match(mod, /SUPABASE_URL/);
  assert.match(mod, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(mod, /app\.json/);
});
