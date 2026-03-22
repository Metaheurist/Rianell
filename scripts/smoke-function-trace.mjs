/**
 * Smoke test: transform a small fixture and verify output parses.
 * Run: node scripts/smoke-function-trace.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformSource } from '../web/build-plugins/instrument-functions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = `
function hello(a, b) {
  return a + b;
}
const f = () => 1;
`;
const out = transformSource(fixture, { moduleId: 'fixture.js' });
const tmp = path.join(__dirname, '..', 'web', '.trace-smoke-tmp.js');
fs.writeFileSync(tmp, out, 'utf8');
const { execSync } = await import('child_process');
execSync(`node --check "${tmp}"`, { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('smoke-function-trace: OK');
