#!/usr/bin/env node
/**
 * Scan PWA/RN sources for likely user-visible English strings.
 * Output: scripts/.audit/i18n-strings.json
 * --check: fail if audit finds strings without a matching en-GB catalog key
 * --require-wiring: fail when catalog covers text but source line is not wired to t()/data-i18n
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog, scanAll } from '../i18n/i18n-audit-shared.mjs';

const root = process.cwd();
const outDir = path.join(root, 'scripts', '.audit');
const outFile = path.join(outDir, 'i18n-strings.json');
const checkMode = process.argv.includes('--check');
const requireWiring = process.argv.includes('--require-wiring');

const results = scanAll(root);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');
console.log(`audit-hardcoded-strings: wrote ${results.length} candidates to ${path.relative(root, outFile)}`);

if (checkMode || requireWiring) {
  const { keys: catalogKeys, values: catalogValues } = loadCatalog(root);
  const missing = results.filter((r) => {
    const text = r.text.trim();
    if (catalogValues.has(text)) return false;
    if (catalogKeys.has(text)) return false;
    if (catalogKeys.has(r.suggestedKey)) return false;
    return true;
  });
  const uniqueMissing = [...new Map(missing.map((m) => [m.text, m])).values()];
  if (uniqueMissing.length > 0) {
    console.error(`audit-hardcoded-strings: ${uniqueMissing.length} strings lack catalog keys (--check)`);
    uniqueMissing.slice(0, 20).forEach((m) => {
      console.error(`  ${m.file}:${m.line} "${m.text}" → ${m.suggestedKey}`);
    });
    process.exit(1);
  }
  if (checkMode) {
    console.log('audit-hardcoded-strings: --check passed (all candidates covered in en-GB catalog)');
  }
}

if (requireWiring) {
  const unwired = results.filter((r) => !r.wired);
  if (unwired.length > 0) {
    console.error(`audit-hardcoded-strings: ${unwired.length} string(s) lack t()/data-i18n wiring (--require-wiring)`);
    unwired.slice(0, 30).forEach((m) => {
      console.error(`  ${m.file}:${m.line} "${m.text}"`);
    });
    if (unwired.length > 30) console.error(`  … and ${unwired.length - 30} more`);
    process.exit(1);
  }
  console.log('audit-hardcoded-strings: --require-wiring passed');
}
