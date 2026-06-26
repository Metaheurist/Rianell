#!/usr/bin/env node
/** Plan 16 pre-rollout verify — run from repo root */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..', '..');

const steps = [
  { cmd: 'npm', args: ['run', 'test:unit'] },
];

for (const s of steps) {
  console.log('>', s.cmd, ...s.args);
  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: root });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const schema = readFileSync(join(root, 'packages/shared/src/logging/logSchema.mjs'), 'utf8');
if (!schema.includes('normalizeVitalMetrics')) {
  console.error('FAIL: logSchema missing normalizeVitalMetrics');
  process.exit(1);
}

const migration = readFileSync(join(root, 'supabase/migrations/20260626150000_health_photos_bucket.sql'), 'utf8');
if (!migration.includes('health-photos')) {
  console.error('FAIL: health-photos migration missing');
  process.exit(1);
}

console.log('PLAN_VERIFY_OK');
