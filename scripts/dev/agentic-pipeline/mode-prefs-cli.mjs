#!/usr/bin/env node
import { readModePrefs, writeModePrefs } from './mode-prefs.mjs';

function arg(name) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : null;
}

if (process.argv.includes('--get')) {
  process.stdout.write(`${JSON.stringify({ ok: true, data: readModePrefs(), error: null })}\n`);
  process.exit(0);
}

if (process.argv.includes('--set')) {
  let patch = {};
  const raw = arg('json');
  if (raw) {
    try { patch = JSON.parse(raw); } catch {
      process.stdout.write(`${JSON.stringify({ ok: false, data: null, error: { code: 'bad_json', message: 'invalid json' } })}\n`);
      process.exit(1);
    }
  }
  const r = writeModePrefs(patch);
  process.stdout.write(`${JSON.stringify(r)}\n`);
  process.exit(r.ok ? 0 : 1);
}

process.stdout.write(`${JSON.stringify({ ok: false, error: { message: 'use --get or --set' } })}\n`);
process.exit(1);
