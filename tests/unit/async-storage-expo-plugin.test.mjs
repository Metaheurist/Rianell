import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pluginPath = new URL('../../apps/rn-app/plugins/withAsyncStorageLocalRepo.js', import.meta.url);
const pluginSrc = fs.readFileSync(pluginPath, 'utf8');

test('withAsyncStorageLocalRepo injects local_repo maven path for Async Storage v3', () => {
  assert.match(pluginSrc, /withProjectBuildGradle/);
  assert.match(pluginSrc, /@react-native-async-storage\/async-storage\/android\/local_repo/);
  assert.match(pluginSrc, /jitpack/);
  assert.match(pluginSrc, /Async Storage v3 local_repo/);
});
