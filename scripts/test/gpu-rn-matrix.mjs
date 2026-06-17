#!/usr/bin/env node
/**
 * RN GPU EP verification — manual / device runner stub.
 */
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const profiles = [
  { name: 'android_nnapi_tier5', platform: 'android', note: 'Run Maestro/adb on physical device; assert NNAPI EP in logs' },
  { name: 'ios_coreml_tier5', platform: 'ios', note: 'Run on physical iOS device; assert CoreML EP' },
  { name: 'expo_go_wasm_tier1', platform: 'expo', note: 'Expo Go WASM q4 only' },
];

console.log('gpu-rn-matrix profiles (manual device verification):');
for (const p of profiles) {
  console.log(' -', p.name, ':', p.note);
}

if (process.env.RN_DEVICE !== '1') {
  console.log('RN_DEVICE=1 not set — documenting profiles only (OK for CI static gate)');
  process.exit(0);
}

const r = spawnSync('npm', ['run', 'test:mobile', '--', '--testPathPattern=llmNative'], {
  cwd: join(root, 'apps', 'rn-app'),
  stdio: 'inherit',
  shell: true,
});

process.exit(r.status === 0 ? 0 : 1);
