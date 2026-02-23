// ============================================
// BACKGROUND LOADER
// Device-aware scheduling for chart and AI preload; optional Web Worker for AI.
// Depends on PerformanceUtils (platform, getOptimizationProfile). Load after performance-utils.js.
// ============================================

(function () {
  'use strict';

  var Perf = typeof window !== 'undefined' ? window.PerformanceUtils : null;
  if (!Perf || !Perf.getOptimizationProfile) {
    if (typeof window !== 'undefined') {
      window.BackgroundLoader = { scheduleChartPreload: noop, scheduleAIPreload: noop };
    }
    return;
  }

  function noop() {}

  function getChartPreloadTiming() {
    var profile = Perf.getOptimizationProfile();
    var deviceClass = (profile && profile.deviceClass) || 'medium';
    var delayMs = (profile && profile.chartPreloadDelayMs != null) ? profile.chartPreloadDelayMs : 1500;
    var staggerMs;
    var gapAfterCombinedMs;
    if (deviceClass === 'low') {
      staggerMs = 280;
      gapAfterCombinedMs = 350;
    } else if (deviceClass === 'high') {
      staggerMs = 120;
      gapAfterCombinedMs = 180;
    } else {
      staggerMs = 200;
      gapAfterCombinedMs = 260;
    }
    return { delayMs: delayMs, staggerMs: staggerMs, gapAfterCombinedMs: gapAfterCombinedMs };
  }

  /**
   * Schedule chart preload at a device-based slower rate.
   * @param {Object} options
   * @param {function} options.runCombined - Callback to create the combined chart (no args).
   * @param {function} options.runLazyChart - Callback(container, chartType) to run one lazy chart.
   * @param {function} options.getLazyCharts - Returns NodeList or array of .lazy-chart elements.
   * @param {Set} options.loadedCharts - Set of already-loaded chart types (mutated by callback).
   */
  function scheduleChartPreload(options) {
    if (!options || typeof options.runCombined !== 'function' || typeof options.runLazyChart !== 'function') return;
    var profile = Perf.getOptimizationProfile();
    if (profile && profile.enableChartPreload === false) return;

    var timing = getChartPreloadTiming();
    var runCombined = options.runCombined;
    var runLazyChart = options.runLazyChart;
    var getLazyCharts = typeof options.getLazyCharts === 'function' ? options.getLazyCharts : function () { return []; };
    var loadedCharts = options.loadedCharts || new Set();

    function runCombinedThenLazy() {
      runCombined();
      var list = getLazyCharts();
      var arr = list && (list.length != null ? list : Array.prototype.slice.call(list)) || [];
      var index = 0;
      function next() {
        if (index >= arr.length) return;
        var el = arr[index];
        index += 1;
        var chartType = el && el.dataset && el.dataset.chartType;
        if (chartType && !loadedCharts.has(chartType)) {
          loadedCharts.add(chartType);
          runLazyChart(el, chartType);
        }
        if (index < arr.length) {
          setTimeout(next, timing.staggerMs);
        }
      }
      setTimeout(next, timing.gapAfterCombinedMs);
    }

    function start() {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(runCombinedThenLazy, { timeout: timing.delayMs + 1000 });
      } else {
        setTimeout(runCombinedThenLazy, Math.min(timing.delayMs, 500));
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(start, { timeout: timing.delayMs + 1000 });
    } else {
      setTimeout(start, timing.delayMs);
    }
  }

  var aiWorker = null;
  var aiWorkerRequestId = 0;

  /**
   * Schedule AI preload; use Web Worker when device has multiple cores (useWorkers), else main thread.
   * @param {Object} options
   * @param {function} options.runAIAnalysis - Callback that performs AI preload on main thread (full logic).
   * @param {function} [options.getAIPreloadData] - Optional. Returns { sortedLogs, allLogsForTraining, dateRangeText, cacheKey } or null.
   * @param {function} [options.setAICache] - Optional. setAICache(analysis, sortedLogs, dateRangeText, cacheKey). Required when using worker.
   */
  function scheduleAIPreload(options) {
    if (!options || typeof options.runAIAnalysis !== 'function') return;
    var profile = Perf.getOptimizationProfile();
    if (profile && profile.enableAIPreload === false) return;

    var delay = (profile && profile.aiPreloadDelayMs != null) ? profile.aiPreloadDelayMs : 2000;
    var useWorkers = !!(profile && profile.useWorkers);
    var runAIAnalysis = options.runAIAnalysis;
    var getAIPreloadData = options.getAIPreloadData;
    var setAICache = options.setAICache;

    function runWhenIdle() {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(doPreload, { timeout: 800 });
      } else {
        setTimeout(doPreload, 100);
      }
    }

    function doPreload() {
      if (useWorkers && typeof getAIPreloadData === 'function' && typeof setAICache === 'function') {
        tryWorkerPreload();
      } else {
        runAIAnalysis();
      }
    }

    function tryWorkerPreload() {
      var data = getAIPreloadData && getAIPreloadData();
      if (!data || !data.sortedLogs || !data.allLogsForTraining) {
        runAIAnalysis();
        return;
      }
      var requestId = ++aiWorkerRequestId;
      var timeoutId = setTimeout(function () {
        if (requestId !== aiWorkerRequestId) return;
        runAIAnalysis();
      }, 30000);

      function onMessage(e) {
        if (!e || !e.data || e.data.requestId !== requestId) return;
        clearTimeout(timeoutId);
        aiWorker.removeEventListener('message', onMessage);
        aiWorker.removeEventListener('error', onError);
        if (e.data.type === 'ANALYZE_RESULT' && e.data.data != null) {
          setAICache(e.data.data, data.sortedLogs, data.dateRangeText, data.cacheKey);
        } else {
          runAIAnalysis();
        }
      }

      function onError() {
        clearTimeout(timeoutId);
        aiWorker.removeEventListener('message', onMessage);
        aiWorker.removeEventListener('error', onError);
        runAIAnalysis();
      }

      try {
        if (!aiWorker) {
          aiWorker = new Worker('prediction-worker.js');
        }
        aiWorker.addEventListener('message', onMessage);
        aiWorker.addEventListener('error', onError);
        aiWorker.postMessage({
          type: 'ANALYZE',
          data: {
            logs: data.sortedLogs,
            allLogs: data.allLogsForTraining,
            requestId: requestId
          }
        });
      } catch (err) {
        clearTimeout(timeoutId);
        runAIAnalysis();
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(runWhenIdle, { timeout: delay + 1500 });
    } else {
      setTimeout(runWhenIdle, delay);
    }
  }

  if (typeof window !== 'undefined') {
    window.BackgroundLoader = {
      scheduleChartPreload: scheduleChartPreload,
      scheduleAIPreload: scheduleAIPreload
    };
  }
})();
