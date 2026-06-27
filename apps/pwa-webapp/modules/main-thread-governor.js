/**
 * Keeps ONNX / chart / AI analysis off the main thread while the user is typing
 * in the log wizard or otherwise interacting. Animations keep running on the
 * compositor; this prevents multi-minute main-thread blocks (RESULT_CODE_HUNG).
 */
(function (global) {
  'use strict';

  var interactionUntil = 0;
  var bound = false;
  var deferLog = [];

  function now() {
    return Date.now();
  }

  function markInteraction(ms) {
    interactionUntil = now() + (ms || 1800);
  }

  function isLogWizardActive() {
    if (typeof document === 'undefined' || !document.body) return false;
    if (document.body.classList.contains('log-wizard-active')) return true;
    var logTab = document.getElementById('logTab');
    return !!(logTab && logTab.classList.contains('active'));
  }

  function isHeavyWorkDeferred() {
    if (typeof document === 'undefined') return false;
    if (document.visibilityState === 'hidden') return true;
    if (isLogWizardActive()) return true;
    if (now() < interactionUntil) return true;
    return false;
  }

  function waitForHeavyWorkSlot(options) {
    var opts = options || {};
    var maxWaitMs = opts.maxWaitMs != null ? opts.maxWaitMs : 45000;
    var pollMs = opts.pollMs != null ? opts.pollMs : 280;
    var start = now();
    return new Promise(function (resolve) {
      function tick() {
        if (!isHeavyWorkDeferred()) {
          resolve(true);
          return;
        }
        if (now() - start >= maxWaitMs) {
          resolve(false);
          return;
        }
        setTimeout(tick, pollMs);
      }
      tick();
    });
  }

  function bindInteractionListeners() {
    if (bound || typeof document === 'undefined') return;
    bound = true;
    var mark = function () { markInteraction(1800); };
    ['pointerdown', 'keydown', 'touchstart', 'input', 'focusin'].forEach(function (ev) {
      document.addEventListener(ev, mark, { capture: true, passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') markInteraction(800);
    });
  }

  function logDefer(reason) {
    if (!global.rianellDebug || deferLog.length > 12) return;
    deferLog.push({ t: now(), reason: reason });
  }

  bindInteractionListeners();

  global.RianellMainThreadGovernor = {
    markInteraction: markInteraction,
    isLogWizardActive: isLogWizardActive,
    isHeavyWorkDeferred: isHeavyWorkDeferred,
    waitForHeavyWorkSlot: waitForHeavyWorkSlot,
    logDefer: logDefer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
