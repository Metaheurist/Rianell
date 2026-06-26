#!/usr/bin/env node
/** Plan 24 DC1 — conventional commits → CHANGELOG section. */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const versionIdx = process.argv.indexOf('--version');
const version = versionIdx >= 0 ? process.argv[versionIdx + 1] : null;
if (!version) {
  console.error('Usage: node scripts/ci/auto-changelog.mjs --version 1.131.0');
  process.exit(1);
}

let since = '';
try {
  since = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
} catch {
  since = '';
}

const range = since ? `${since}..HEAD` : 'HEAD';
const log = execSync(`git log ${range} --pretty=format:%s`, { encoding: 'utf8' });
const groups = { feat: [], fix: [], perf: [], refactor: [], docs: [], chore: [], ci: [], test: [], security: [] };

for (const line of log.split('\n').filter(Boolean)) {
  const m = line.match(/^(\w+)(?:\([^)]+\))?!?:\s*(.+)/);
  if (!m) continue;
  const type = m[1];
  if (groups[type]) groups[type].push(m[2]);
}

const changelogPath = path.join(root, 'docs/CHANGELOG.md');
const heading = `### v${version} - ${new Date().toISOString().slice(0, 10)}`;
const lines = [heading, ''];
for (const [type, items] of Object.entries(groups)) {
  if (!items.length) continue;
  lines.push(`- **${type}:** ${items.slice(0, 8).join('; ')}${items.length > 8 ? '…' : ''}`);
}
lines.push('');

const existing = fs.readFileSync(changelogPath, 'utf8');
const insertAt = existing.indexOf('### v');
const updated =
  insertAt >= 0
    ? `${existing.slice(0, insertAt)}${lines.join('\n')}\n${existing.slice(insertAt)}`
    : `${lines.join('\n')}\n${existing}`;

if (process.argv.includes('--write')) {
  fs.writeFileSync(changelogPath, updated);
  console.log(`CHANGELOG updated for v${version}`);
} else {
  console.log(lines.join('\n'));
  console.log('(dry-run — pass --write to apply)');
}
