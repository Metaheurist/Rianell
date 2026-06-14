/**
 * Export MOBILE_PROFILES / DESKTOP_PROFILES from device-benchmark.js to tier-profiles.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.BENCHMARK_REPO_ROOT || path.resolve(__dirname, '..', '..');
const SRC = path.join(REPO_ROOT, 'apps', 'pwa-webapp', 'device-benchmark.js');
const OUT = path.join(REPO_ROOT, 'benchmarks', 'toolkit', 'tier-profiles.json');

function extractTable(name, source) {
  const marker = `var ${name} = `;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${name} in device-benchmark.js`);
  let i = start + marker.length;
  let depth = 0;
  let inStr = false;
  let strCh = '';
  for (; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const literal = source.slice(start + marker.length, i + 1);
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${literal});`)();
      }
    }
  }
  throw new Error(`Unterminated ${name}`);
}

function main() {
  const source = fs.readFileSync(SRC, 'utf8');
  const mobile = extractTable('MOBILE_PROFILES', source);
  const desktop = extractTable('DESKTOP_PROFILES', source);
  const payload = {
    source: 'apps/pwa-webapp/device-benchmark.js',
    exported_at: new Date().toISOString(),
    benchmark_version: 4,
    mobile,
    desktop,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Wrote', OUT);
}

main();
