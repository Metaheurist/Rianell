/**
 * Boot guard: crash-loop protection for on-device AI and a lightweight boot breadcrumb.
 *
 * Mobile browsers (notably iOS Safari) kill the tab without any JS event when memory runs
 * out, then show "A problem repeatedly occurred". If the next launch repeats the same heavy
 * work the user is stuck in a crash loop. This module records small markers in localStorage
 * (phase names + timestamps only, never health data) so the next launch can detect that the
 * previous session died mid-way and skip automatic AI work.
 *
 * Namespace: window.RianellBootGuard
 */
(function (global) {
  'use strict';

  var LLM_LOAD_KEY = 'rianell.llm.loadInFlight';
  var LLM_SAFE_MODE_KEY = 'rianell.llm.safeMode';
  var BOOT_PHASE_KEY = 'rianell.boot.phase';
  var CRASH_NOTICE_KEY = 'rianell.boot.crashNoticeShown';
  var STALE_MS = 24 * 60 * 60 * 1000;

  function storage() {
    try {
      return global.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  function readJson(key) {
    var ls = storage();
    if (!ls) return null;
    try {
      var raw = ls.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    var ls = storage();
    if (!ls) return;
    try {
      ls.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function remove(key) {
    var ls = storage();
    if (!ls) return;
    try {
      ls.removeItem(key);
    } catch (e) {}
  }

  function now() {
    return Date.now();
  }

  function isFresh(entry) {
    return !!(entry && typeof entry.ts === 'number' && now() - entry.ts < STALE_MS);
  }

  /**
   * True for phones/tablets, low device class or <= 4 GB RAM. Heavy optional work
   * (LLM auto-download, WebGL/three.js scenes, GPU warm-up) is skipped on these devices.
   * @param {{ userAgent?: string, deviceMemory?: number, maxTouchPoints?: number, platform?: string, deviceClass?: string }} [env]
   */
  function isConstrainedDevice(env) {
    var nav = global.navigator || {};
    env = env || {};
    var ua = env.userAgent != null ? env.userAgent : (nav.userAgent || '');
    var mem = env.deviceMemory != null ? env.deviceMemory : nav.deviceMemory;
    var touch = env.maxTouchPoints != null ? env.maxTouchPoints : (nav.maxTouchPoints || 0);
    var platform = env.platform != null ? env.platform : (nav.platform || '');
    var deviceClass = env.deviceClass;
    if (deviceClass == null) {
      try {
        var pu = global.PerformanceUtils;
        deviceClass = pu && pu.platform ? pu.platform.deviceClass : null;
      } catch (e) {
        deviceClass = null;
      }
    }
    if (deviceClass === 'low') return true;
    if (typeof mem === 'number' && mem > 0 && mem <= 4) return true;
    if (/iPhone|iPad|iPod|Android|Mobile/i.test(ua)) return true;
    if (platform === 'MacIntel' && touch > 1) return true;
    return false;
  }

  function markLlmLoadStart(modelId) {
    writeJson(LLM_LOAD_KEY, { ts: now(), model: modelId ? String(modelId).slice(0, 120) : '' });
  }

  function markLlmLoadEnd() {
    remove(LLM_LOAD_KEY);
  }

  /** A previous model load started but never finished or failed cleanly (tab was killed). */
  function wasLlmLoadInterrupted() {
    return isFresh(readJson(LLM_LOAD_KEY));
  }

  /**
   * Called once at boot. If the previous load was interrupted, switch to safe mode
   * (small model, no auto-load) and clear the marker so the user can retry manually.
   * @returns {boolean} true when an interrupted load was detected this boot.
   */
  function consumeInterruptedLlmLoad() {
    if (!wasLlmLoadInterrupted()) {
      remove(LLM_LOAD_KEY);
      return false;
    }
    remove(LLM_LOAD_KEY);
    writeJson(LLM_SAFE_MODE_KEY, { ts: now() });
    return true;
  }

  function isLlmSafeMode() {
    return isFresh(readJson(LLM_SAFE_MODE_KEY));
  }

  function clearLlmSafeMode() {
    remove(LLM_SAFE_MODE_KEY);
  }

  var previousBoot = readJson(BOOT_PHASE_KEY);

  function recordBootPhase(phase) {
    writeJson(BOOT_PHASE_KEY, { phase: String(phase || '').slice(0, 40), ts: now() });
  }

  /** Previous launch stopped during boot (before 'ready') without a normal page close. */
  function didLastBootCrash() {
    if (!isFresh(previousBoot)) return false;
    return previousBoot.phase === 'start' || previousBoot.phase === 'shell';
  }

  function getPreviousBoot() {
    return previousBoot ? { phase: previousBoot.phase, ts: previousBoot.ts } : null;
  }

  function shouldShowCrashNotice() {
    if (!didLastBootCrash()) return false;
    var shown = readJson(CRASH_NOTICE_KEY);
    return !(shown && previousBoot && shown.bootTs === previousBoot.ts);
  }

  function markCrashNoticeShown() {
    if (previousBoot) writeJson(CRASH_NOTICE_KEY, { bootTs: previousBoot.ts });
  }

  function getCrashReport() {
    var nav = global.navigator || {};
    var prev = getPreviousBoot();
    return [
      'Rianell unexpected close report',
      'Previous boot phase: ' + (prev ? prev.phase : 'unknown'),
      'Previous boot time: ' + (prev ? new Date(prev.ts).toISOString() : 'unknown'),
      'AI safe mode: ' + isLlmSafeMode(),
      'Constrained device: ' + isConstrainedDevice(),
      'UA: ' + (nav.userAgent || ''),
    ].join('\n');
  }

  recordBootPhase('start');

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('pagehide', function () {
      recordBootPhase('closed');
      markLlmLoadEnd();
    });
  }

  global.RianellBootGuard = {
    isConstrainedDevice: isConstrainedDevice,
    markLlmLoadStart: markLlmLoadStart,
    markLlmLoadEnd: markLlmLoadEnd,
    wasLlmLoadInterrupted: wasLlmLoadInterrupted,
    consumeInterruptedLlmLoad: consumeInterruptedLlmLoad,
    isLlmSafeMode: isLlmSafeMode,
    clearLlmSafeMode: clearLlmSafeMode,
    recordBootPhase: recordBootPhase,
    didLastBootCrash: didLastBootCrash,
    getPreviousBoot: getPreviousBoot,
    shouldShowCrashNotice: shouldShowCrashNotice,
    markCrashNoticeShown: markCrashNoticeShown,
    getCrashReport: getCrashReport,
  };
})(typeof window !== 'undefined' ? window : globalThis);
