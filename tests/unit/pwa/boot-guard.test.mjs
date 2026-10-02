import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const SRC = readFileSync('apps/pwa-webapp/modules/boot-guard.js', 'utf8');

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

function bootWindow({ storage = memoryStorage(), navigator = {}, now = Date.now() } = {}) {
  const listeners = {};
  const window = {
    localStorage: storage,
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', deviceMemory: 16, maxTouchPoints: 0, platform: 'Win32', ...navigator },
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    fire: (type) => (listeners[type] || []).forEach((fn) => fn()),
  };
  const FakeDate = class extends Date {
    static now() { return now; }
  };
  vm.runInNewContext(SRC, { window, globalThis: window, Date: FakeDate, JSON });
  return { window, guard: window.RianellBootGuard, storage };
}

test('boot-guard loads before app.js and summary-llm.js', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const guardIdx = html.indexOf('modules/boot-guard.js');
  assert.ok(guardIdx > 0, 'boot-guard script present');
  assert.ok(guardIdx < html.indexOf('src="app.js'), 'boot-guard before app.js');
  const llmIdx = html.indexOf("'summary-llm.js");
  if (llmIdx > 0) assert.ok(guardIdx < llmIdx, 'boot-guard before summary-llm.js');
});

test('isConstrainedDevice flags phones, iPadOS, low memory and low device class', () => {
  const { guard } = bootWindow();
  assert.equal(guard.isConstrainedDevice(), false, 'desktop with 16 GB is not constrained');
  assert.equal(guard.isConstrainedDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }), true);
  assert.equal(guard.isConstrainedDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)' }), true);
  assert.equal(guard.isConstrainedDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }), true);
  assert.equal(guard.isConstrainedDevice({ deviceMemory: 4 }), true);
  assert.equal(guard.isConstrainedDevice({ deviceClass: 'low' }), true);
  assert.equal(guard.isConstrainedDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0, deviceMemory: 8 }), false);
});

test('an LLM load that never ended switches the next boot to safe mode once', () => {
  const storage = memoryStorage();
  const first = bootWindow({ storage });
  first.guard.markLlmLoadStart('onnx-community/test-model');
  assert.equal(first.guard.wasLlmLoadInterrupted(), true);

  const second = bootWindow({ storage });
  assert.equal(second.guard.consumeInterruptedLlmLoad(), true);
  assert.equal(second.guard.isLlmSafeMode(), true);
  assert.equal(second.guard.wasLlmLoadInterrupted(), false, 'marker cleared so a manual retry is possible');

  const third = bootWindow({ storage });
  assert.equal(third.guard.consumeInterruptedLlmLoad(), false, 'only reported once');
  assert.equal(third.guard.isLlmSafeMode(), true, 'safe mode persists until a load succeeds');
  third.guard.clearLlmSafeMode();
  assert.equal(third.guard.isLlmSafeMode(), false);
});

test('a load that finishes (or a normal page close) does not trigger safe mode', () => {
  const storage = memoryStorage();
  const first = bootWindow({ storage });
  first.guard.markLlmLoadStart('m');
  first.guard.markLlmLoadEnd();
  assert.equal(bootWindow({ storage }).guard.consumeInterruptedLlmLoad(), false);

  const again = bootWindow({ storage });
  again.guard.markLlmLoadStart('m');
  again.window.fire('pagehide');
  assert.equal(bootWindow({ storage }).guard.consumeInterruptedLlmLoad(), false);
});

test('stale markers older than 24h are ignored', () => {
  const t0 = Date.UTC(2026, 0, 1);
  const storage = memoryStorage();
  bootWindow({ storage, now: t0 }).guard.markLlmLoadStart('m');
  const later = bootWindow({ storage, now: t0 + 25 * 60 * 60 * 1000 });
  assert.equal(later.guard.consumeInterruptedLlmLoad(), false);
  assert.equal(later.guard.didLastBootCrash(), false);
});

test('boot breadcrumb detects a launch that died before ready, and the notice shows once', () => {
  const storage = memoryStorage();
  const crashed = bootWindow({ storage });
  crashed.guard.recordBootPhase('shell');

  const next = bootWindow({ storage });
  assert.equal(next.guard.didLastBootCrash(), true);
  assert.equal(next.guard.shouldShowCrashNotice(), true);
  next.guard.markCrashNoticeShown();
  assert.equal(next.guard.shouldShowCrashNotice(), false);
  next.guard.recordBootPhase('ready');

  const healthy = bootWindow({ storage });
  assert.equal(healthy.guard.didLastBootCrash(), false);
});

test('pagehide records a clean close', () => {
  const storage = memoryStorage();
  const s = bootWindow({ storage });
  s.window.fire('pagehide');
  assert.equal(bootWindow({ storage }).guard.didLastBootCrash(), false);
});

test('crash report contains only phases, flags and UA (no health data or storage dump)', () => {
  const storage = memoryStorage({ 'healthLogs': JSON.stringify([{ symptom: 'secret' }]) });
  bootWindow({ storage }).guard.recordBootPhase('start');
  const report = bootWindow({ storage }).guard.getCrashReport();
  assert.match(report, /Previous boot phase: start/);
  assert.doesNotMatch(report, /secret|healthLogs/);
});

test('app.js no longer blocks the shell on AI download and gates boot auto-load', () => {
  const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.doesNotMatch(app, /shouldAwaitAiDownloadBeforeShell/);
  assert.doesNotMatch(app, /__rianellAiPreloadedDuringBoot/);
  assert.match(app, /function canAutoLoadLlmAtBoot\(\)/);
  assert.match(app, /consumeInterruptedLlmLoad\(\)/);
  assert.match(app, /function __rianellAllow3DScenes\(\)/);
});

test('summary-llm marks load start/end and forces the small tier in safe mode', () => {
  const src = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');
  assert.match(src, /markLlmLoadStart\(modelId\)/);
  assert.match(src, /markLlmLoadEnd\(\)/);
  assert.match(src, /isLlmSafeMode\(\) \|\| guard\.isConstrainedDevice\(\)/);
});
