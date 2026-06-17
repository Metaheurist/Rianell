#!/usr/bin/env node
/**
 * Stage 8: fact-check Transformers.js v4 migration readiness.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'docs', 'research', 'transformers-js-v4-migration.md');

let audit = '';
try {
  audit = execSync('npm audit --omit=dev --json', { cwd: root, encoding: 'utf8' });
} catch (e) {
  audit = e.stdout || String(e.message || e);
}

const base = readFileSync(out, 'utf8');
const note = `\n\n## Automated audit (${new Date().toISOString()})\n\n\`\`\`json\n${audit.slice(0, 4000)}\n\`\`\`\n`;
writeFileSync(out, base + note);
console.log('Updated', out);
