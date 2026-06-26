#!/usr/bin/env node
/** Plan 18 API3 — OpenAPI spec verification (Spectral when available). */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const specPath = join(root, 'docs/api/openapi.yaml');

if (!existsSync(specPath)) {
  console.error('verify-openapi: missing docs/api/openapi.yaml');
  process.exit(1);
}

const src = readFileSync(specPath, 'utf8');
if (!src.includes('openapi: 3.1.0') || !src.includes('/logs')) {
  console.error('verify-openapi: spec missing required paths');
  process.exit(1);
}

const spectral = spawnSync(
  'npx',
  ['--yes', '@stoplight/spectral-cli', 'lint', specPath, '--fail-severity', 'error'],
  { stdio: 'inherit', shell: true },
);

if (spectral.status === 0) {
  console.log('verify-openapi: OK');
  process.exit(0);
}

if (spectral.error?.code === 'ENOENT') {
  console.log('verify-openapi: spectral unavailable, basic checks passed');
  process.exit(0);
}

process.exit(spectral.status ?? 1);
