#!/usr/bin/env node
/**
 * Merge scripts/.audit/i18n-strings.json into i18n-packs/locale-packs/v1/en-GB.json.
 * Dedupes by exact text against existing catalog values; otherwise adds suggestedKey.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const auditPath = path.join(root, 'scripts', '.audit', 'i18n-strings.json');
const enGbPath = path.join(canonicalLocalePacksDir(root), 'en-GB.json');

if (!fs.existsSync(auditPath)) {
  console.error('merge-audit-into-catalog: run node scripts/audit-hardcoded-strings.mjs first');
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const pack = JSON.parse(fs.readFileSync(enGbPath, 'utf8'));
pack.strings = pack.strings || {};

const valueToKey = new Map();
for (const [key, value] of Object.entries(pack.strings)) {
  if (typeof value === 'string' && value.trim()) {
    valueToKey.set(value.trim(), key);
  }
}

let added = 0;
let skipped = 0;
const seenKeys = new Set(Object.keys(pack.strings));

for (const row of audit) {
  const text = String(row.text || '').trim();
  if (!text || text.length < 2) continue;
  if (/^[\d\s.]+$/.test(text)) continue;
  if (/[<>]/.test(text)) continue;

  const existingKey = valueToKey.get(text);
  if (existingKey) {
    skipped++;
    continue;
  }

  let key = row.suggestedKey || `common.${text.toLowerCase().replace(/[^a-z0-9]+/g, '.').slice(0, 48)}`;
  if (seenKeys.has(key)) {
    let n = 2;
    while (seenKeys.has(`${key}.${n}`)) n++;
    key = `${key}.${n}`;
  }

  pack.strings[key] = text;
  valueToKey.set(text, key);
  seenKeys.add(key);
  added++;
}

fs.writeFileSync(enGbPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
console.log(`merge-audit-into-catalog: added ${added} keys, skipped ${skipped} (already in catalog by value)`);
console.log(`merge-audit-into-catalog: en-GB now has ${Object.keys(pack.strings).length} keys`);
