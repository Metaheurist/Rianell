/**
 * Function trace: local console only (no Logger, no fetch).
 * Loaded before any instrumented app scripts. Toggle + demo mode gate in God mode.
 */
(function () {
  function refreshFnTraceGate() {
    try {
      var dm = false;
      if (typeof window !== 'undefined' && window.appSettings && window.appSettings.demoMode) {
        dm = true;
      }
      if (!dm) {
        var raw = localStorage.getItem('rianellSettings');
        if (raw) {
          var p = JSON.parse(raw);
          dm = p.demoMode === true;
        }
      }
      var tr = localStorage.getItem('rianellFunctionTrace') === 'true';
      window.__rianellFnTraceOn = !!(dm && tr);
    } catch (e) {
      window.__rianellFnTraceOn = false;
    }
  }

  window.__rianellRefreshFnTraceGate = refreshFnTraceGate;
  refreshFnTraceGate();

  window.__rianellTraceEnter = function (moduleId, fnName, args) {
    if (!window.__rianellFnTraceOn) return undefined;
    var t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    try {
      var preview = args;
      if (args && typeof args.length === 'number' && args.length > 4) {
        preview = '[arguments:' + args.length + ']';
      }
      console.debug('[fn-trace] \u2192', moduleId, fnName, preview);
    } catch (e) {}
    return { t0: t0, moduleId: moduleId, fnName: fnName };
  };

  window.__rianellTraceExit = function (handle) {
    if (!handle) return;
    if (!window.__rianellFnTraceOn) return;
    var t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    var ms = t1 - handle.t0;
    try {
      var msStr = typeof ms === 'number' && ms.toFixed ? ms.toFixed(2) : String(ms);
      console.debug('[fn-trace] \u2190', handle.moduleId, handle.fnName, msStr + 'ms');
    } catch (e) {}
  };
})();
