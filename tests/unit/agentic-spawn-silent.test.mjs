import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  findNpmCliJs,
  resolveNodeScriptLine,
  resolveNpmRunScript,
  resolveSilentInvocation,
  silentSpawnSync,
} from '../../scripts/dev/agentic-pipeline/spawn-silent.mjs';

test('findNpmCliJs locates npm-cli.js when available on this Node install', () => {
  const cli = findNpmCliJs();
  if (cli) {
    assert.match(cli.replace(/\\/g, '/'), /npm-cli\.js$/);
    assert.ok(fs.existsSync(cli));
    return;
  }
  // Some CI/corepack layouts omit npm-cli next to node; PATH `npm` must still work.
  const res = silentSpawnSync('npm', ['--version'], { cwd: process.cwd() });
  assert.equal(res.status, 0, 'npm on PATH required when npm-cli.js is absent');
});

test('resolveNodeScriptLine parses node package scripts', () => {
  const inv = resolveNodeScriptLine('node scripts/verify/i18n-all.mjs --check-only');
  assert.equal(inv.cmd, process.execPath);
  assert.equal(inv.shell, false);
  assert.deepEqual(inv.args, ['scripts/verify/i18n-all.mjs', '--check-only']);
});

test('resolveNpmRunScript maps verify:i18n:check to node script', () => {
  const inv = resolveNpmRunScript('verify:i18n:check');
  assert.ok(inv);
  assert.equal(inv.cmd, process.execPath);
  assert.equal(inv.shell, false);
  assert.ok(inv.args[0].includes('i18n-all.mjs'));
  assert.ok(inv.args.includes('--check-only'));
});

test('resolveSilentInvocation rewrites npm run to direct node (no npm-cli)', () => {
  const inv = resolveSilentInvocation('npm', ['run', 'verify:i18n:check']);
  assert.equal(inv.cmd, process.execPath);
  assert.equal(inv.shell, false);
  assert.ok(!String(inv.args[0]).includes('npm-cli.js'), 'must not go through npm');
  assert.ok(String(inv.args[0]).includes('i18n-all.mjs'));
});

test('resolveSilentInvocation never enables shell on Windows fallbacks', () => {
  const inv = resolveSilentInvocation('git', ['status', '--porcelain']);
  assert.equal(inv.shell, false);
});

test('silentSpawnSync runs npm --version without shell shim', () => {
  const res = silentSpawnSync('npm', ['--version'], { cwd: process.cwd() });
  assert.equal(res.error, undefined, String(res.error || ''));
  assert.equal(res.status, 0);
  assert.match(String(res.stdout || ''), /^\d+\.\d+/);
});

test('silentSpawnSync runs verify:i18n:check via direct node (headless)', () => {
  const inv = resolveSilentInvocation('npm', ['run', 'verify:i18n:check']);
  assert.equal(inv.cmd, process.execPath);
  const res = silentSpawnSync('npm', ['run', 'verify:design-tokens'], { cwd: process.cwd() });
  assert.equal(res.error, undefined, String(res.error || ''));
  assert.equal(res.status, 0, String(res.stderr || res.stdout || ''));
});

test('silentSpawnSync runs node -e headlessly', () => {
  const res = silentSpawnSync(process.execPath, ['-e', 'process.stdout.write("ok")'], {
    cwd: process.cwd(),
  });
  assert.equal(res.status, 0);
  assert.match(String(res.stdout || ''), /ok/);
});
