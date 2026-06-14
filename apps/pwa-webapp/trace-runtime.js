/**
 * Function trace: local console only (no Logger, no fetch).
 * Loaded before any instrumented app scripts. Toggle + demo mode gate in God mode.
 */
(function () {
  var TRACE_LOGS_PER_SEC = 80;
  var TRACE_SLOW_MS = 8;
  var __traceBudget = TRACE_LOGS_PER_SEC;
  var __traceWindowStart = 0;
  var __traceSuppressed = 0;

  function isDemoMode() {
    try {
      if (typeof window !== 'undefined' && window.appSettings && window.appSettings.demoMode) {
        return true;
      }
      var raw = localStorage.getItem('rianellSettings');
      if (raw) {
        var p = JSON.parse(raw);
        return p.demoMode === true;
      }
    } catch (e) {}
    return false;
  }

  function refreshFnTraceGate() {
    try {
      var dm = isDemoMode();
      var tr = localStorage.getItem('rianellFunctionTrace') === 'true';
      if (!dm && tr) {
        localStorage.setItem('rianellFunctionTrace', 'false');
        tr = false;
      }
      window.__rianellFnTraceOn = !!(dm && tr);
    } catch (e) {
      window.__rianellFnTraceOn = false;
    }
  }

  function takeTraceLogSlot() {
    var now =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    if (now - __traceWindowStart > 1000) {
      if (__traceSuppressed > 0) {
        try {
          console.debug('[fn-trace] rate-limited ' + __traceSuppressed + ' log(s) in last second');
        } catch (e) {}
      }
      __traceWindowStart = now;
      __traceBudget = TRACE_LOGS_PER_SEC;
      __traceSuppressed = 0;
    }
    if (__traceBudget <= 0) {
      __traceSuppressed++;
      return false;
    }
    __traceBudget--;
    return true;
  }

  window.__rianellRefreshFnTraceGate = refreshFnTraceGate;
  refreshFnTraceGate();

  window.__rianellTraceEnter = function (moduleId, fnName, args) {
    if (!window.__rianellFnTraceOn) return undefined;
    var t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    if (takeTraceLogSlot()) {
      try {
        var preview = args;
        if (args && typeof args.length === 'number' && args.length > 4) {
          preview = '[arguments:' + args.length + ']';
        }
        console.debug('[fn-trace] \u2192', moduleId, fnName, preview);
      } catch (e) {}
    }
    return { t0: t0, moduleId: moduleId, fnName: fnName };
  };

  window.__rianellTraceExit = function (handle) {
    if (!handle || !window.__rianellFnTraceOn) return;
    var t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    var ms = t1 - handle.t0;
    if (ms < TRACE_SLOW_MS && !takeTraceLogSlot()) return;
    try {
      var msStr = typeof ms === 'number' && ms.toFixed ? ms.toFixed(2) : String(ms);
      console.debug('[fn-trace] \u2190', handle.moduleId, handle.fnName, msStr + 'ms');
    } catch (e) {}
  };
})();
