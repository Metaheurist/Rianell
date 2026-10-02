/**
 * Main-thread task scheduling helpers: critical (user-blocking) tasks, deferred background work and the heavy-work slot gate.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

// Run a critical-path task with high scheduler priority when available (Chrome); else defer once. Returns a Promise that resolves with fn()'s return value (flattens if fn returns a Promise).
function runCriticalTask(fn) {
  var run = function () { return fn(); };
  var p;
  if (typeof globalThis !== 'undefined' && globalThis.scheduler && typeof globalThis.scheduler.postTask === 'function') {
    p = globalThis.scheduler.postTask(run, { priority: 'user-blocking' }).catch(function () { return run(); });
  } else {
    p = new Promise(function (resolve) { setTimeout(function () { resolve(run()); }, 0); });
  }
  return p.then(function (x) { return (x && typeof x.then === 'function') ? x : Promise.resolve(x); });
}

/** Defer heavy background work (AI preload, LLM) so log wizard input stays responsive. */
function runBackgroundTask(fn) {
  var run = function () { return fn(); };
  var p;
  if (typeof globalThis !== 'undefined' && globalThis.scheduler && typeof globalThis.scheduler.postTask === 'function') {
    p = globalThis.scheduler.postTask(run, { priority: 'background' }).catch(function () { return run(); });
  } else {
    p = new Promise(function (resolve) { setTimeout(function () { resolve(run()); }, 0); });
  }
  return p.then(function (x) { return (x && typeof x.then === 'function') ? x : Promise.resolve(x); });
}

function waitForMainThreadHeavyWorkSlot(maxWaitMs) {
  var gov = typeof window !== 'undefined' ? window.RianellMainThreadGovernor : null;
  if (gov && typeof gov.waitForHeavyWorkSlot === 'function') {
    return gov.waitForHeavyWorkSlot({ maxWaitMs: maxWaitMs != null ? maxWaitMs : 45000 });
  }
  return Promise.resolve(true);
}

export { runCriticalTask, runBackgroundTask, waitForMainThreadHeavyWorkSlot };
