import fs from 'node:fs';
import path from 'node:path';
import { readTextFileSync, existsSync } from '@rianell/shared';

const repoRoot = process.cwd();
const checkMode = process.argv.includes('--check');

function read(rel) {
  return readTextFileSync(fs, path.join(repoRoot, rel));
}

function exists(rel) {
  return existsSync(fs, path.join(repoRoot, rel));
}

const PWA_SETTINGS_KEYS = [
  'userName',
  'medicalCondition',
  'weightUnit',
  'contributeAnonData',
  'useOpenData',
  'aiEnabled',
  'demoMode',
  'preferredLlmModelSize',
  'aiModelDownloadConsent',
  'backup',
  'compress',
  'animations',
  'lazy',
];

const RN_PREF_FIELDS = [
  'userName',
  'medicalCondition',
  'weightUnit',
  'contributeAnonData',
  'useOpenData',
  'aiEnabled',
  'demoMode',
  'backup',
  'compress',
  'animations',
  'lazyCharts',
];

const CLOUD_EXPORTS = [
  'syncToCloud',
  'loadFromCloud',
  'syncAnonymizedData',
  'mergeHealthLogs',
  'deleteCloudLogs',
  'deleteAllUserDataFromCloud',
];

const lines = ['# Platform parity inventory', '', `Generated: ${new Date().toISOString()}`, ''];

const appJs = exists('apps/pwa-webapp/app.js') ? read('apps/pwa-webapp/app.js') : '';
const prefsTs = exists('apps/rn-app/src/storage/preferences.ts') ? read('apps/rn-app/src/storage/preferences.ts') : '';
const cloudSyncJs = exists('apps/pwa-webapp/cloud-sync.js') ? read('apps/pwa-webapp/cloud-sync.js') : '';
const rnSyncTs = exists('apps/rn-app/src/cloud/sync.ts') ? read('apps/rn-app/src/cloud/sync.ts') : '';

lines.push('## Settings / preferences field parity', '');
lines.push('| Field | PWA appSettings | RN preferences |');
lines.push('|-------|-----------------|----------------|');

const gaps = [];

for (const key of PWA_SETTINGS_KEYS) {
  const pwa = appJs.includes(`${key}:`) || appJs.includes(`${key} `);
  const rn = prefsTs.includes(`${key}:`) || prefsTs.includes(`${key}?`) || (key === 'lazy' && prefsTs.includes('lazyCharts'));
  lines.push(`| ${key} | ${pwa ? 'yes' : 'no'} | ${rn ? 'yes' : 'no'} |`);
  if (pwa && !rn) gaps.push(`RN missing preference field: ${key}`);
  if (rn && !pwa) gaps.push(`PWA missing appSettings field: ${key}`);
}

lines.push('', '## Cloud sync exports', '');
lines.push('| Symbol | PWA cloud-sync.js | RN cloud/sync.ts |');
lines.push('|--------|-------------------|------------------|');

for (const sym of CLOUD_EXPORTS) {
  const pwa = cloudSyncJs.includes(`function ${sym}`) || cloudSyncJs.includes(`${sym}(`);
  const rn = rnSyncTs.includes(`export async function ${sym}`) || rnSyncTs.includes(`export function ${sym}`) || (sym === 'mergeHealthLogs' && rnSyncTs.includes(`export { mergeHealthLogs`));
  lines.push(`| ${sym} | ${pwa ? 'yes' : 'no'} | ${rn ? 'yes' : 'no'} |`);
  if (pwa && !rn && sym !== 'mergeHealthLogs') gaps.push(`RN missing cloud export: ${sym}`);
}

lines.push('', '## Legacy Capacitor (must be absent post-sunset)', '');
const capPresent = exists('apps/capacitor-app/package.json');
lines.push(`- apps/capacitor-app: ${capPresent ? 'PRESENT (fail)' : 'absent (ok)'}`);
if (capPresent) gaps.push('apps/capacitor-app still exists');

const flanInPwa = /flan-t5|Xenova\/flan/i.test(appJs + (exists('apps/pwa-webapp/summary-llm.js') ? read('apps/pwa-webapp/summary-llm.js') : ''));
lines.push(`- flan-t5 in PWA source: ${flanInPwa ? 'found (fail)' : 'absent (ok)'}`);
if (flanInPwa) gaps.push('flan-t5 reference in PWA source');

lines.push('', '## Gaps', '');
if (gaps.length === 0) {
  lines.push('_No inventory gaps detected._');
} else {
  gaps.forEach((g) => lines.push(`- ${g}`));
}

const outPath = path.join(repoRoot, 'docs', 'parity-inventory.md');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${outPath}`);

if (checkMode && gaps.length > 0) {
  console.error(`Parity inventory: ${gaps.length} gap(s)`);
  process.exit(1);
}

if (checkMode) {
  console.log('Parity inventory check passed.');
}
