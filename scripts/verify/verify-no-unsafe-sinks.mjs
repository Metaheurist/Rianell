#!/usr/bin/env node
/**
 * Guard against new eval(), new Function(), or document.write() in PWA app source.
 * Vendor and minified bundles are excluded; known legacy document.write sites are allowlisted.
 */
import fs from 'fs';
import path from 'path';

const WEB_ROOT = path.join(process.cwd(), 'apps/pwa-webapp');

/** @type {Map<string, Set<string>>} */
const ALLOWLIST = new Map([
  ['document.write', new Set([
    'export-utils.js',
    'appointment-pdf.js',
    'print-utils.js',
  ])],
]);

const PATTERNS = [
  { id: 'eval', re: /\beval\s*\(/g },
  { id: 'new Function', re: /\bnew\s+Function\s*\(/g },
  { id: 'document.write', re: /\bdocument\.write\s*\(/g },
];

function shouldScan(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  if (norm.includes('/vendor/')) return false;
  if (norm.includes('/.web-dist/')) return false;
  if (/\.min\.js$/i.test(norm)) return false;
  return norm.endsWith('.js') || norm.endsWith('.mjs');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'vendor') continue;
      walk(abs, out);
      continue;
    }
    if (shouldScan(abs)) out.push(abs);
  }
  return out;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

const files = walk(WEB_ROOT);
const violations = [];

for (const file of files) {
  const base = path.basename(file);
  const text = fs.readFileSync(file, 'utf8');
  for (const { id, re } of PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const allowed = ALLOWLIST.get(id);
      if (allowed && allowed.has(base)) continue;
      violations.push({
        file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
        line: lineNumber(text, match.index),
        pattern: id,
      });
    }
  }
}

if (violations.length) {
  console.error('verify-no-unsafe-sinks: forbidden patterns found:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.pattern}`);
  }
  process.exit(1);
}

console.log('verify-no-unsafe-sinks: OK');
