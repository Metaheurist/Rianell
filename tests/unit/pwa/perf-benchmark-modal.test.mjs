import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('boot flow does not auto-open first-run benchmark modal', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /function revealBootShellAfterBenchmark/);
  assert.doesNotMatch(appJs, /openPerfBenchmarkModal\(\{\s*mode:\s*'firstRun'/);
  assert.match(appJs, /startAppAfterPrivacyGate\(\)/);
});

test('benchmark modal is exposed via god mode developer section', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /godMode\.viewBenchmarkDetails/);
  assert.match(appJs, /action: run\(openBenchmarkDetails\)/);
  assert.doesNotMatch(
    appJs,
    /godMode\.viewBenchmarkDetails[\s\S]*desktopOnly:\s*true/,
  );
});

test('boot benchmark progress uses measuring fallback before i18n is ready', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /Measuring performance…/);
  assert.match(appJs, /translated !== 'common\.measuring\.performance'/);
});

test('rAF latency benchmark cannot hang forever', () => {
  const src = readFileSync('apps/pwa-webapp/device-benchmark.js', 'utf8');
  assert.match(src, /function rafLatency/);
  assert.match(src, /rAF latency timed out/);
  assert.match(src, /RAF_LATENCY_TIMEOUT_MS/);
  assert.match(src, /_rafLatencyCancel/);
  // Boot must not depend on requestAnimationFrame — overlay paint can stall it forever.
  assert.doesNotMatch(src, /requestAnimationFrame\(step\)/);
  assert.match(src, /setTimeout\(step,\s*0\)/);
});

test('CPU suite yields during boot and cannot stall at array step', () => {
  const src = readFileSync('apps/pwa-webapp/device-benchmark.js', 'utf8');
  assert.match(src, /function cpuArithAsync/);
  assert.match(src, /function arrayThroughputAsync/);
  assert.match(src, /function stringOpsAsync/);
  assert.match(src, /function domFragmentBuildAsync/);
  assert.match(src, /scheduleBenchmarkStep/);
  assert.doesNotMatch(src, /requestAnimationFrame\(function \(\) \{ setTimeout\(fn, 0\)/);
  // One tick per macrotask — never while-pack batches (cold JIT freezes Chrome).
  assert.match(src, /Cooperative yield: one tickFn per macrotask/);
  assert.doesNotMatch(src, /while\s*\(\s*!isDone\(\)/);
  assert.match(src, /CPU_BATCH_START/);
  assert.match(src, /adaptBatch/);
  assert.match(src, /bootLite:\s*true/);
  assert.match(src, /test timed out/);
  assert.match(src, /abortActiveSuite/);
  assert.match(src, /suite stalled at step/);
  assert.match(src, /parts\.join\(''\)/);
  assert.match(src, /phase = 'join'/);
});

test('boot CPU batches stay small under cold JIT', () => {
  const src = readFileSync('apps/pwa-webapp/device-benchmark.js', 'utf8');
  assert.match(src, /var CPU_BATCH_START = 1200/);
  assert.match(src, /var CPU_BATCH_MAX = 10000/);
  assert.match(src, /bootLite \? 60000 : 120000/);
  assert.match(src, /cpuCap = bootLite \? 280000/);
});

test('boot watchdog aborts an in-flight benchmark before force reveal', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /abortActiveSuite/);
  assert.match(appJs, /bootWatchdog:forceReveal/);
});

test('GPU probe never blocks first paint (revealed before probe, off critical path)', () => {
  const src = readFileSync('apps/pwa-webapp/device-benchmark.js', 'utf8');
  // A dedicated deferral helper must exist and guarantee a macrotask yield + idle wait.
  assert.match(src, /function scheduleGpuProbeOffCriticalPath/);
  assert.match(src, /scheduleGpuProbeOffCriticalPath[\s\S]*setTimeout\(run,/);
  assert.match(src, /scheduleGpuProbeOffCriticalPath[\s\S]*requestIdleCallback/);
  // The probe must wait until the loading overlay is hidden + body.loaded so a cold
  // GPU getContext() can never delay first paint / the overlay hide.
  assert.match(src, /function shellRevealed[\s\S]*loadingOverlay[\s\S]*classList\.contains\('hidden'\)/);
  assert.match(src, /classList\.contains\('loaded'\)/);
  // The no-cache suite finish must reveal the shell (onDone) BEFORE probing the GPU,
  // and the probe must run inside the off-critical-path scheduler.
  assert.match(
    src,
    /onDone\(result\);\s*scheduleGpuProbeOffCriticalPath\(function \(\) \{\s*runGpuBenchmarkAsync/,
  );
  // The GPU probe must not be awaited before onDone on the boot path anymore.
  assert.doesNotMatch(src, /runGpuBenchmarkAsync\(function \(gpu\) \{[\s\S]*?onDone\(result\);\s*\}\);/);
  // The heuristic boot path also probes the GPU off the critical path.
  assert.match(
    src,
    /onComplete\(tier, platformType, result, \{ cached: true, heuristic: true \}\);\s*scheduleGpuProbeOffCriticalPath/,
  );
});

test('3D/WebGL capability probes are gated on shell reveal (never block boot)', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  // Shared gate that waits for body.loaded before any GPU/WebGL work.
  assert.match(appJs, /function __rianellRunAfterShellRevealed/);
  assert.match(appJs, /__rianellRunAfterShellRevealed[\s\S]*classList\.contains\('loaded'\)/);
  // Both schedulers that lead to synchronous getContext('webgl') must be gated.
  assert.match(appJs, /function scheduleHome3DEnhancement\(run\) \{\s*__rianellRunAfterShellRevealed/);
  assert.match(appJs, /function initWebGLSurfacesForTab[\s\S]*__rianellRunAfterShellRevealed\(startWhenSafe\)/);
});

test('in-app daily reminder respects first-run suppression', () => {
  const js = readFileSync('apps/pwa-webapp/notifications.js', 'utf8');
  assert.match(js, /checkTodayReminder\(\)[\s\S]*shouldSuppressFirstRunLoggingPrompt/);
  assert.match(js, /settings\.reminder === true/);
});

test('home today header keeps stacked greeting and date beside avatar', () => {
  const css = readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8');
  assert.match(css, /\.home-today-header[\s\S]*display:\s*grid/);
  assert.match(css, /\.home-today-header[\s\S]*grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto/);
  assert.match(css, /\.home-dashboard-header__aside/);
  assert.match(css, /\.profile-avatar-header__glyph[\s\S]*2\.85rem/);
});
