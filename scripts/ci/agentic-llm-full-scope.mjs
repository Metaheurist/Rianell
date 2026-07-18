#!/usr/bin/env node
/**
 * Master gate sequence for PWA LLM full-scope rollout.
 */
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const steps = [
  ['sync:llm-pwa', 'npm run sync:llm-pwa'],
  ['vendor:transformers', 'npm run vendor:transformers'],
  ['test:unit', 'npm run test:unit'],
  ['verify:csp', 'npm run verify:csp'],
  ['verify:llm-security', 'npm run verify:llm-security'],
  ['verify:push-contract', 'npm run verify:push-contract'],
  ['preflight-llm-chunk', 'node scripts/test/preflight-llm-chunk.mjs'],
];

for (const [name, cmd] of steps) {
  console.log('\n=== agentic:', name, '===');
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' });
  } catch (e) {
    console.error('agentic-llm-full-scope FAILED at', name);
    process.exit(1);
  }
}

if (process.env.PROBE_URL) {
  console.log('\n=== agentic: test:llm-hardware ===');
  execSync('npm run test:llm-hardware', { cwd: root, stdio: 'inherit', env: process.env });
}

console.log('\nagentic-llm-full-scope OK');
