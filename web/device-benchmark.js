// ============================================
// DEVICE BENCHMARK
// Platform type (mobile/desktop), CPU benchmark → tier 1-4, expansive profile tables.
// Load after device-module.js, before performance-utils.js. Cache in localStorage.
// ============================================

(function () {
  'use strict';

  var CACHE_KEY = 'healthAppPerfBenchmark';
  var BENCHMARK_CAP_MS = 50;
  var BENCHMARK_TARGET_MS = 18;
  var ITERATIONS_PER_CHUNK = 50000;

  function getPlatformType() {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var ua = nav.userAgent || '';
    var cap = (typeof window !== 'undefined' && window.Capacitor) || (typeof window !== 'undefined' && window.parent && window.parent.Capacitor);
    var isNative = cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();
    if (isNative) return 'mobile';
    var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (nav.maxTouchPoints && nav.maxTouchPoints > 1);
    if (mobile) return 'mobile';
    if (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform && window.DeviceModule.platform.isTablet) {
      return 'mobile';
    }
    return 'desktop';
  }

  function runCpuBenchmark(onProgress) {
    var start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    var elapsed = 0;
    var total = 0;
    var chunk = 0;
    var targetIterations = 200000;
    while (elapsed < BENCHMARK_CAP_MS) {
      for (var i = 0; i < ITERATIONS_PER_CHUNK; i++) {
        total += (i * 31 + 17) % 97;
      }
      chunk++;
      elapsed = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - start;
      if (onProgress && typeof onProgress === 'function') {
        var pct = Math.min(99, Math.floor((elapsed / BENCHMARK_TARGET_MS) * 50));
        onProgress(pct);
      }
      if (elapsed >= BENCHMARK_TARGET_MS) break;
    }
    return { elapsed: elapsed, iterations: chunk * ITERATIONS_PER_CHUNK, total: total };
  }

  function resultToTier(result) {
    var ms = result && result.elapsed != null ? result.elapsed : 999;
    if (ms <= 12) return 4;
    if (ms <= 18) return 3;
    if (ms <= 28) return 2;
    return 1;
  }

  function getTierFromHeuristic() {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var deviceMemory = nav.deviceMemory;
    var cores = nav.hardwareConcurrency;
    var isSecure = typeof window !== 'undefined' && window.isSecureContext === true;
    if (isSecure && typeof deviceMemory === 'number' && deviceMemory > 0) {
      if (deviceMemory <= 2) return 1;
      if (deviceMemory >= 8) return 4;
      if (deviceMemory >= 4) return 3;
      return 2;
    }
    if (typeof cores === 'number' && cores > 0) {
      if (cores <= 2) return 1;
      if (cores >= 6) return 4;
      if (cores >= 4) return 3;
      return 2;
    }
    return 2;
  }

  function getLegacyDeviceClass(tier) {
    if (tier === 1) return 'low';
    if (tier === 2) return 'medium';
    return 'high';
  }

  var MOBILE_PROFILES = {
    1: {
      deviceClass: 'low',
      chartMaxPoints: 24,
      maxChartPoints: 30,
      chartAnimation: false,
      enableChartPreload: true,
      chartPreloadDelayMs: 3500,
      enableAIPreload: false,
      aiPreloadDelayMs: 4000,
      deferAI: true,
      batchDOM: true,
      reduceAnimations: true,
      reduceUIAnimations: true,
      domCacheTtlMs: 45000,
      storageBatchDelayMs: 200,
      lazyChartStaggerMs: 150,
      useWorkers: false,
      logRenderChunkSize: 15,
      logRenderChunkThreshold: 20,
      demoDataDays: 90,
      loadTimeoutMs: 5000,
      llmModelSize: 'small'
    },
    2: {
      deviceClass: 'medium',
      chartMaxPoints: 80,
      maxChartPoints: 100,
      chartAnimation: true,
      enableChartPreload: true,
      chartPreloadDelayMs: 2000,
      enableAIPreload: true,
      aiPreloadDelayMs: 2000,
      deferAI: false,
      batchDOM: false,
      reduceAnimations: false,
      reduceUIAnimations: false,
      domCacheTtlMs: 30000,
      storageBatchDelayMs: 100,
      lazyChartStaggerMs: 80,
      useWorkers: true,
      logRenderChunkSize: 20,
      logRenderChunkThreshold: 30,
      demoDataDays: 365,
      loadTimeoutMs: 8000,
      llmModelSize: 'small'
    },
    3: {
      deviceClass: 'high',
      chartMaxPoints: 150,
      maxChartPoints: 150,
      chartAnimation: true,
      enableChartPreload: true,
      chartPreloadDelayMs: 1000,
      enableAIPreload: true,
      aiPreloadDelayMs: 1200,
      deferAI: false,
      batchDOM: false,
      reduceAnimations: false,
      reduceUIAnimations: false,
      domCacheTtlMs: 25000,
      storageBatchDelayMs: 100,
      lazyChartStaggerMs: 50,
      useWorkers: true,
      logRenderChunkSize: 25,
      logRenderChunkThreshold: 30,
      demoDataDays: 365,
      loadTimeoutMs: 10000,
      llmModelSize: 'base'
    },
    4: {
      deviceClass: 'high',
      chartMaxPoints: 200,
      maxChartPoints: 200,
      chartAnimation: true,
      enableChartPreload: true,
      chartPreloadDelayMs: 600,
      enableAIPreload: true,
      aiPreloadDelayMs: 800,
      deferAI: false,
      batchDOM: false,
      reduceAnimations: false,
      reduceUIAnimations: false,
      domCacheTtlMs: 20000,
      storageBatchDelayMs: 100,
      lazyChartStaggerMs: 40,
      useWorkers: true,
      logRenderChunkSize: 30,
      logRenderChunkThreshold: 30,
      demoDataDays: 365,
      loadTimeoutMs: 12000,
      llmModelSize: 'base'
    }
  };

  var DESKTOP_PROFILES = {
    1: {
      deviceClass: 'low',
      chartMaxPoints: 24,
      maxChartPoints: 30,
      chartAnimation: false,
      enableChartPreload: true,
      chartPreloadDelayMs: 3000,
      enableAIPreload: false,
      aiPreloadDelayMs: 4000,
      deferAI: true,
      batchDOM: true,
      reduceAnimations: true,
      reduceUIAnimations: true,
      domCacheTtlMs: 45000,
      storageBatchDelayMs: 200,
      lazyChartStaggerMs: 120,
      useWorkers: false,
      logRenderChunkSize: 20,
      logRenderChunkThreshold: 25,
      demoDataDays: 365,
      loadTimeoutMs: 6000,
      llmModelSize: 'small'
    },
    2: {
      deviceClass: 'medium',
      chartMaxPoints: 80,
      maxChartPoints: 120,
      chartAnimation: true,
      enableChartPreload: true,
      chartPreloadDelayMs: 1200,
      enableAIPreload: true,
      aiPreloadDelayMs: 1500,
      deferAI: false,
      batchDOM: false,
      reduceAnimations: false,
      reduceUIAnimations: false,
      domCacheTtlMs: 30000,
      storageBatchDelayMs: 100,
      lazyChartStaggerMs: 80,
      useWorkers: true,
      logRenderChunkSize: 20,
      logRenderChunkThreshold: 30,
      demoDataDays: 3650,
      loadTimeoutMs: 10000,
      llmModelSize: 'base'
    },
    3: {
      deviceClass: 'high',
      chartMaxPoints: 200,
      maxChartPoints: 200,
      chartAnimation: true,
      enableChartPreload: true,
      chartPreloadDelayMs: 700,
      enableAIPreload: true,
      aiPreloadDelayMs: 1000,
      deferAI: false,
      batchDOM: false,
      reduceAnimations: false,
      reduceUIAnimations: false,
      domCacheTtlMs: 20000,
      storageBatchDelayMs: 100,
      lazyChartStaggerMs: 40,
      useWorkers: true,
      logRenderChunkSize: 25,
      logRenderChunkThreshold: 30,
      demoDataDays: 3650,
      loadTimeoutMs: 12000,
      llmModelSize: 'base'
    },
    4: {
      deviceClass: 'high',
      chartMaxPoints: 200,
      maxChartPoints: 200,
      chartAnimation: true,
      enableChartPreload: true,
      chartPreloadDelayMs: 500,
      enableAIPreload: true,
      aiPreloadDelayMs: 600,
      deferAI: false,
      batchDOM: false,
      reduceAnimations: false,
      reduceUIAnimations: false,
      domCacheTtlMs: 18000,
      storageBatchDelayMs: 80,
      lazyChartStaggerMs: 30,
      useWorkers: true,
      logRenderChunkSize: 30,
      logRenderChunkThreshold: 30,
      demoDataDays: 3650,
      loadTimeoutMs: 12000,
      llmModelSize: 'base'
    }
  };

  function getCachedResult() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage.getItem) return null;
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.tier !== 'number' || data.tier < 1 || data.tier > 4) return null;
      if (!data.platformType || (data.platformType !== 'mobile' && data.platformType !== 'desktop')) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function isBenchmarkReady() {
    return getCachedResult() !== null;
  }

  var _lastTier = null;
  var _lastPlatformType = null;

  function getPerformanceTier() {
    var cached = getCachedResult();
    if (cached) {
      _lastTier = cached.tier;
      _lastPlatformType = cached.platformType;
      return cached.tier;
    }
    if (_lastTier != null) return _lastTier;
    return getTierFromHeuristic();
  }

  function getPlatformTypeCached() {
    var cached = getCachedResult();
    if (cached) return cached.platformType;
    if (_lastPlatformType != null) return _lastPlatformType;
    return getPlatformType();
  }

  function saveBenchmarkResult(platformType, tier) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage.setItem) return;
      tier = Math.max(1, Math.min(4, Math.floor(tier)));
      var pt = platformType === 'mobile' || platformType === 'desktop' ? platformType : getPlatformType();
      _lastTier = tier;
      _lastPlatformType = pt;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        platformType: pt,
        tier: tier,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function runBenchmarkIfNeeded(onProgress, onComplete) {
    var cached = getCachedResult();
    if (cached) {
      _lastTier = cached.tier;
      _lastPlatformType = cached.platformType;
      if (typeof onComplete === 'function') onComplete(cached.tier, cached.platformType);
      return;
    }
    var platformType = getPlatformType();
    if (onProgress && typeof onProgress === 'function') onProgress(0);
    var result;
    try {
      result = runCpuBenchmark(onProgress);
    } catch (e) {
      result = { elapsed: 999 };
    }
    if (onProgress && typeof onProgress === 'function') onProgress(100);
    var tier = resultToTier(result);
    _lastTier = tier;
    _lastPlatformType = platformType;
    if (typeof onComplete === 'function') onComplete(tier, platformType);
  }

  function getFullProfile(platformType, tier, overrides) {
    var pt = platformType === 'mobile' || platformType === 'desktop' ? platformType : getPlatformType();
    var t = Math.max(1, Math.min(4, Math.floor(tier)));
    var table = pt === 'mobile' ? MOBILE_PROFILES : DESKTOP_PROFILES;
    var profile = table[t] || table[2];
    var out = {};
    for (var k in profile) {
      if (profile.hasOwnProperty(k)) out[k] = profile[k];
    }
    if (overrides && typeof overrides === 'object') {
      if (overrides.saveData === true) {
        out.enableChartPreload = false;
        out.enableAIPreload = false;
        out.saveData = true;
      }
      if (overrides.prefersReducedMotion === true) {
        out.chartAnimation = false;
        out.reduceAnimations = true;
        out.reduceUIAnimations = true;
      }
      if (overrides.saveData != null) out.saveData = !!overrides.saveData;
    }
    if (out.saveData == null) {
      var conn = typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform && window.DeviceModule.platform.connection;
      out.saveData = !!(conn && conn.saveData);
    }
    return out;
  }

  function clearBenchmarkCache() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
        localStorage.removeItem(CACHE_KEY);
        _lastTier = null;
        _lastPlatformType = null;
      }
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.DeviceBenchmark = {
      getPlatformType: getPlatformType,
      getPerformanceTier: getPerformanceTier,
      getFullProfile: getFullProfile,
      getLegacyDeviceClass: getLegacyDeviceClass,
      isBenchmarkReady: isBenchmarkReady,
      runBenchmarkIfNeeded: runBenchmarkIfNeeded,
      saveBenchmarkResult: saveBenchmarkResult,
      clearBenchmarkCache: clearBenchmarkCache,
      getCachedResult: getCachedResult
    };
  }
})();
