#!/usr/bin/env node
/**
 * Verify internal doc links and forbidden stale path strings.
 * Usage: node scripts/verify/doc-links.mjs [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const strict = process.argv.includes('--strict');
const errors = [];

const FORBIDDEN = [
  { pattern: /App build\//g, allow: ['docs/CHANGELOG.md', 'docs/architecture-standard.md', 'AGENTS.md', 'security/cloudflare-headers-recommended.md'] },
  { pattern: /(?:^|[\s('"'])scripts\/(?!build\/|i18n\/|verify\/|ci\/|audit\/|wiki\/|models\/|dev\/|lib\/)[a-z0-9-]+\.mjs/gi, allow: ['docs/CHANGELOG.md', 'docs/setup-and-usage.md'] },
];

function rel(p) {
  return path.relative(root, p).replace(/\\/g, '/');
}

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', '.git', 'ci-minified', '.server-dist', 'artifacts', '.trace-build', '.android-dist'].includes(ent.name)) continue;
      walk(p, cb);
    } else cb(p);
  }
}

function scanFile(filePath, exts) {
  const r = rel(filePath);
  if (!exts.some((e) => filePath.endsWith(e))) return;
  if (r.includes('node_modules')) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const { pattern, allow } of FORBIDDEN) {
    if (allow.some((a) => r.startsWith(a) || r.includes(a))) continue;
    if (pattern.test(text)) {
      pattern.lastIndex = 0;
      errors.push(`${r}: forbidden stale path pattern ${pattern}`);
    }
    pattern.lastIndex = 0;
  }
  // markdown relative links
  if (filePath.endsWith('.md')) {
    const linkRe = /\[[^\]]*\]\(([^)#]+)(#[^)]*)?\)/g;
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const target = m[1].trim();
      if (/^https?:\/\//.test(target) || target.startsWith('mailto:')) continue;
      if (!target.includes('/') && !target.includes('.')) continue;
      const resolved = path.normalize(path.join(path.dirname(filePath), target.split('#')[0]));
      if (!fs.existsSync(resolved)) {
        errors.push(`${r}: broken link → ${target}`);
      }
    }
  }
}

// Scan targets
for (const f of ['README.md', 'package.json', 'AGENTS.md']) {
  scanFile(path.join(root, f), ['']);
}
walk(path.join(root, 'docs'), (p) => scanFile(p, ['.md']));
walk(path.join(root, 'wiki'), (p) => scanFile(p, ['.md']));
walk(path.join(root, 'security'), (p) => scanFile(p, ['.md']));
walk(path.join(root, '.github'), (p) => scanFile(p, ['.yml', '.yaml']));
walk(path.join(root, 'scripts'), (p) => scanFile(p, ['.mjs']));
walk(path.join(root, 'apps'), (p) => scanFile(p, ['.js', '.ts', '.tsx', '.mjs']));
walk(path.join(root, 'server'), (p) => scanFile(p, ['.ps1', '.py']));

if (errors.length) {
  console.error('doc-links failures:');
  for (const e of errors) console.error(' -', e);
  process.exit(strict ? 1 : 0);
}
console.log('doc-links: OK');
process.exit(0);
