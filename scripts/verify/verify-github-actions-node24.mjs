#!/usr/bin/env node
/** Fail on Node-20-era GitHub Action majors under .github/ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const githubDir = path.join(root, '.github');

const BANNED = [
  [/actions\/cache@v4\b/, 'actions/cache@v4'],
  [/actions\/checkout@v4\b/, 'actions/checkout@v4'],
  [/actions\/setup-node@v4\b/, 'actions/setup-node@v4'],
  [/actions\/setup-java@v4\b/, 'actions/setup-java@v4'],
  [/actions\/github-script@v7\b/, 'actions/github-script@v7'],
  [/actions\/upload-pages-artifact@v4\b/, 'actions/upload-pages-artifact@v4'],
  [/actions\/deploy-pages@v4\b/, 'actions/deploy-pages@v4'],
  [/softprops\/action-gh-release@v2\b/, 'softprops/action-gh-release@v2'],
  [/node-version:\s*['"]?20['"]?/, 'node-version 20'],
  [/FORCE_JAVASCRIPT_ACTIONS_TO_NODE24/, 'FORCE_JAVASCRIPT_ACTIONS_TO_NODE24'],
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.ya?ml$/i.test(ent.name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(githubDir)) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  for (const [re, label] of BANNED) {
    if (re.test(text)) hits.push(`${rel}: ${label}`);
  }
}

if (hits.length) {
  console.error('verify-github-actions-node24: FAIL');
  hits.forEach((h) => console.error('  -', h));
  process.exit(1);
}

// Supply-chain: third-party actions must use SHA pin OR approved major tag
const ALLOW_TAG = /^@[vV]?\d+(\.\d+)?(\.\d+)?$/;
const ALLOW_LOCAL = /^\.\//;
const ALLOW_SHA = /@sha256:[0-9a-f]{64}$/i;
const pinHits = [];
const usesRe = /uses:\s*([^\s#]+)/g;

for (const file of walk(githubDir)) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  let m;
  while ((m = usesRe.exec(text)) !== null) {
    const ref = m[1].trim();
    if (ALLOW_LOCAL.test(ref)) continue;
    if (ALLOW_SHA.test(ref)) continue;
    if (ALLOW_TAG.test(ref.split('@').pop() ? '@' + ref.split('@').pop() : '')) {
      const tag = '@' + ref.split('@').pop();
      if (ALLOW_TAG.test(tag)) continue;
    }
    const at = ref.lastIndexOf('@');
    if (at === -1) {
      pinHits.push(`${rel}: missing @ref on ${ref}`);
      continue;
    }
    const tag = ref.slice(at);
    if (!ALLOW_TAG.test(tag) && !ALLOW_SHA.test(tag)) {
      pinHits.push(`${rel}: unapproved action ref ${ref}`);
    }
  }
}

if (pinHits.length) {
  console.error('verify-github-actions-node24: action pin FAIL');
  pinHits.forEach((h) => console.error('  -', h));
  process.exit(1);
}

console.log('verify-github-actions-node24: OK');
