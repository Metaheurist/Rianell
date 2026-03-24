// ============================================
// DEVICE BENCHMARK
// Platform type (mobile/desktop), CPU benchmark → tier 1–5, expansive profile tables.
// Oriented around device performance and on-device AI runnability: each profile has
// llmModelSize ('tier1'..'tier5') - recommended for on-device AI (maps to flan-t5-small / base / large).
// Load after device-module.js, before performance-utils.js. Cache in localStorage.
// ============================================

(function () {
  'use strict';

  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
  try {
    var CACHE_KEY = 'rianellPerfBenchmark';
    var BENCHMARK_VERSION = 4;
    var MAX_TIER = 5;
    var DEFAULT_TOTAL_CAP_MS = 1200;
    function nowMs() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "nowMs", arguments) : undefined;
      try {
        return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getPlatformType() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getPlatformType", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var ua = nav.userAgent || '';
        var cap = typeof window !== 'undefined' && window.Capacitor || typeof window !== 'undefined' && window.parent && window.parent.Capacitor;
        var isNative = cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();
        if (isNative) return 'mobile';
        var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || nav.maxTouchPoints && nav.maxTouchPoints > 1;
        if (mobile) return 'mobile';
        if (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform && window.DeviceModule.platform.isTablet) {
          return 'mobile';
        }
        return 'desktop';
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function median(arr) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "median", arguments) : undefined;
      try {
        if (!arr || !arr.length) return 0;
        var a = arr.slice(0).sort(function (x, y) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            return x - y;
          } finally {
            __rianellTraceExit(__rt);
          }
        });
        var mid = Math.floor(a.length / 2);
        return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function mean(arr) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "mean", arguments) : undefined;
      try {
        if (!arr || !arr.length) return 0;
        var s = 0;
        for (var i = 0; i < arr.length; i++) s += arr[i];
        return s / arr.length;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function stddev(arr) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "stddev", arguments) : undefined;
      try {
        if (!arr || arr.length < 2) return 0;
        var m = mean(arr);
        var s = 0;
        for (var i = 0; i < arr.length; i++) {
          var d = arr[i] - m;
          s += d * d;
        }
        return Math.sqrt(s / (arr.length - 1));
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function clampInt(x, lo, hi) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "clampInt", arguments) : undefined;
      try {
        x = Math.floor(x);
        if (x < lo) return lo;
        if (x > hi) return hi;
        return x;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getEnvSnapshot(platformType) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getEnvSnapshot", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var deviceMemory = typeof window !== 'undefined' && window.isSecureContext === true && typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 ? nav.deviceMemory : null;
        var cores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 ? nav.hardwareConcurrency : null;
        var cap = typeof window !== 'undefined' && window.Capacitor || typeof window !== 'undefined' && window.parent && window.parent.Capacitor;
        var isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
        var dm = typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform ? window.DeviceModule.platform : null;
        var platformName = dm && dm.platform ? String(dm.platform) : null;
        var isTablet = !!(dm && dm.isTablet);
        var prefersReducedMotion = !!(dm && dm.prefersReducedMotion);
        var saveData = !!(dm && dm.connection && dm.connection.saveData);
        var env = {
          platformType: platformType,
          platform: platformName,
          isNative: isNative,
          isTablet: isTablet,
          cores: cores,
          deviceMemory: deviceMemory,
          prefersReducedMotion: prefersReducedMotion,
          saveData: saveData
        };
        if (dm) {
          if (dm.osName != null && dm.osName !== '') env.osName = dm.osName;
          if (dm.osVersion != null && dm.osVersion !== '') env.osVersion = dm.osVersion;
          if (dm.deviceType != null && dm.deviceType !== '') env.deviceType = dm.deviceType;
          if (dm.deviceVendor != null && dm.deviceVendor !== '') env.deviceVendor = dm.deviceVendor;
          if (dm.deviceModel != null && dm.deviceModel !== '') env.deviceModel = dm.deviceModel;
          if (dm.cpuArchitecture != null && dm.cpuArchitecture !== '') env.cpuArchitecture = dm.cpuArchitecture;
          if (dm.estimatedMemoryBucket != null && dm.estimatedMemoryBucket !== '') env.estimatedMemoryBucket = dm.estimatedMemoryBucket;
        }
        return env;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /** Detect GPU backend: 'webgpu' | 'webgl' | 'none'. Sync check only (no adapter request). */
    function detectGpuBackendSync() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "detectGpuBackendSync", arguments) : undefined;
      try {
        if (typeof navigator !== 'undefined' && navigator.gpu && typeof navigator.gpu.requestAdapter === 'function') {
          return 'webgpu';
        }
        try {
          if (typeof document !== 'undefined') {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) return 'webgl';
          }
        } catch (e) {}
        return 'none';
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    var GPU_STABILITY_SAMPLES = 5;
    function runOneGpuSampleWebGPU(cb) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runOneGpuSampleWebGPU", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : null;
        if (!nav || !nav.gpu || typeof nav.gpu.requestAdapter !== 'function') {
          cb(null);
          return;
        }
        var t0 = nowMs();
        nav.gpu.requestAdapter({
          powerPreference: 'high-performance'
        }).then(function (adapter) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            cb(adapter ? nowMs() - t0 : null);
          } finally {
            __rianellTraceExit(__rt);
          }
        }).catch(function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            cb(null);
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function runOneGpuSampleWebGL(cb) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runOneGpuSampleWebGL", arguments) : undefined;
      try {
        try {
          var c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
          if (!c) {
            cb(null);
            return;
          }
          c.width = 256;
          c.height = 256;
          var opts = {
            alpha: false,
            powerPreference: 'high-performance'
          };
          var gl = c.getContext('webgl2', opts) || c.getContext('webgl', opts);
          if (!gl) {
            cb(null);
            return;
          }
          var t0 = nowMs();
          for (var i = 0; i < 20; i++) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.clearColor(0.1, 0.2, 0.3, 1);
          }
          if (gl.finish) gl.finish();
          cb(nowMs() - t0);
        } catch (e) {
          cb(null);
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Run a quick GPU benchmark with stability samples (WebGL draw or WebGPU adapter).
     * Calls done({ available, backend, scoreMs, good, scoreSamples }).
     * scoreSamples: array of ms per run for stability graph (when available).
     */
    function runGpuBenchmarkAsync(done) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runGpuBenchmarkAsync", arguments) : undefined;
      try {
        var finished = false;
        function safeDone(gpu) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "safeDone", arguments) : undefined;
          try {
            if (finished) return;
            finished = true;
            if (gpuTimer) clearTimeout(gpuTimer);
            if (typeof done === 'function') done(gpu);
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        /* Some WebGL/WebGPU stacks never invoke the sample callback; without this the load screen never finishes */
        var gpuTimer = setTimeout(function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            if (typeof console !== 'undefined' && console.warn) {
              console.warn('[Benchmark] GPU stage timed out; continuing without GPU score');
            }
            safeDone({
              available: false,
              backend: 'none',
              scoreMs: null,
              good: false,
              scoreSamples: [],
              timedOut: true
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        }, 10000);
        var backend = detectGpuBackendSync();
        if (backend === 'none') {
          safeDone({
            available: false,
            backend: 'none',
            scoreMs: null,
            good: false,
            scoreSamples: []
          });
          return;
        }
        var runOne = backend === 'webgpu' ? runOneGpuSampleWebGPU : runOneGpuSampleWebGL;
        var samples = [];
        var runCount = 0;
        function runNext() {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runNext", arguments) : undefined;
          try {
            runOne(function (ms) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
              try {
                if (ms != null) samples.push(ms);
                runCount++;
                if (runCount < GPU_STABILITY_SAMPLES) {
                  setTimeout(runNext, 20);
                } else {
                  var available = samples.length > 0;
                  var scoreMs = available ? samples.reduce(function (a, b) {
                    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                    try {
                      return a + b;
                    } finally {
                      __rianellTraceExit(__rt);
                    }
                  }, 0) / samples.length : null;
                  var good = available && (backend === 'webgpu' ? scoreMs < 500 : scoreMs < 50);
                  safeDone({
                    available: available,
                    backend: available ? backend : 'none',
                    scoreMs: scoreMs,
                    good: good,
                    scoreSamples: samples
                  });
                }
              } finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        runNext();
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function cpuArith(iterations) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "cpuArith", arguments) : undefined;
      try {
        var total = 0;
        for (var i = 0; i < iterations; i++) {
          total = total + (i * 31 + 17) % 97 | 0;
        }
        return total;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function arrayThroughput(size) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "arrayThroughput", arguments) : undefined;
      try {
        var arr = new Array(size);
        for (var i = 0; i < size; i++) arr[i] = i * 13 & 255;
        var s = 0;
        for (var j = 0; j < size; j++) {
          var v = arr[j];
          if ((v & 3) === 0) s += v;
        }
        return s;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function makeJsonPayload(size) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "makeJsonPayload", arguments) : undefined;
      try {
        var out = [];
        for (var i = 0; i < size; i++) {
          out.push({
            d: i,
            x: i * 17 % 97,
            s: 'v' + i % 10
          });
        }
        return JSON.stringify({
          items: out
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function jsonParseStringify(jsonStr) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "jsonParseStringify", arguments) : undefined;
      try {
        var obj = JSON.parse(jsonStr);
        obj.t = obj.items && obj.items.length ? obj.items[0].x : 0;
        return JSON.stringify(obj).length;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function stringOps(size) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "stringOps", arguments) : undefined;
      try {
        var s = '';
        for (var i = 0; i < size; i++) s += String.fromCharCode(97 + i % 26);
        var m = s.match(/abc/g);
        return m && m.length ? m.length : 0;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function domFragmentBuild(nodeCount) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "domFragmentBuild", arguments) : undefined;
      try {
        if (typeof document === 'undefined') return 0;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < nodeCount; i++) {
          var div = document.createElement('div');
          div.className = 'perf-bench-node';
          div.textContent = 'x' + i;
          frag.appendChild(div);
        }
        var host = document.getElementById('perfBenchHost');
        if (!host) {
          host = document.createElement('div');
          host.id = 'perfBenchHost';
          host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
          document.body.appendChild(host);
        }
        host.appendChild(frag);
        host.textContent = '';
        return nodeCount;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function rafLatency(frames, done) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "rafLatency", arguments) : undefined;
      try {
        if (typeof requestAnimationFrame !== 'function') {
          done({
            avgMs: 0,
            samples: []
          });
          return;
        }
        var samples = [];
        var last = nowMs();
        var remaining = Math.max(2, frames || 6);
        function step() {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "step", arguments) : undefined;
          try {
            var t = nowMs();
            samples.push(t - last);
            last = t;
            remaining--;
            if (remaining <= 0) {
              done({
                avgMs: mean(samples),
                samples: samples
              });
              return;
            }
            requestAnimationFrame(step);
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        requestAnimationFrame(step);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function msPer200kFromRun(iterations, ms) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "msPer200kFromRun", arguments) : undefined;
      try {
        if (!ms || ms <= 0) return 999;
        return ms * 200000 / iterations;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function msPer200kToTier(msPer200k) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "msPer200kToTier", arguments) : undefined;
      try {
        if (msPer200k <= 8.0) return 5;
        if (msPer200k <= 12.0) return 4;
        if (msPer200k <= 18.0) return 3;
        if (msPer200k <= 26.0) return 2;
        return 1;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getTierFromHeuristic() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getTierFromHeuristic", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var deviceMemory = nav.deviceMemory;
        var cores = nav.hardwareConcurrency;
        var isSecure = typeof window !== 'undefined' && window.isSecureContext === true;
        if (isSecure && typeof deviceMemory === 'number' && deviceMemory > 0) {
          if (deviceMemory <= 2) return 1;
          if (deviceMemory <= 3) return 2;
          if (deviceMemory <= 4) return 3;
          if (deviceMemory <= 6) return 4;
          return 5;
        }
        var dm = typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform ? window.DeviceModule.platform : null;
        var estimatedBucket = dm && dm.estimatedMemoryBucket ? dm.estimatedMemoryBucket : null;
        if (estimatedBucket === 'low') {
          if (typeof cores === 'number' && cores > 0) return cores <= 2 ? 1 : 2;
          return 1;
        }
        if (estimatedBucket === 'high') {
          if (typeof cores === 'number' && cores > 0) {
            if (cores <= 4) return 4;
            return 5;
          }
          return 4;
        }
        if (estimatedBucket === 'medium' || !estimatedBucket) {
          if (typeof cores === 'number' && cores > 0) {
            if (cores <= 2) return 1;
            if (cores <= 3) return 2;
            if (cores <= 4) return 3;
            if (cores <= 6) return 4;
            return 5;
          }
          return 3;
        }
        return 3;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getLegacyDeviceClass(tier) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getLegacyDeviceClass", arguments) : undefined;
      try {
        tier = Math.max(1, Math.min(MAX_TIER, Math.floor(tier || 0)));
        if (tier <= 2) return 'low';
        if (tier <= 3) return 'medium';
        return 'high';
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    var MOBILE_PROFILES = {
      1: {
        deviceClass: 'low',
        chartMaxPoints: 18,
        maxChartPoints: 24,
        chartAnimation: false,
        enableChartPreload: true,
        chartPreloadDelayMs: 4200,
        enableAIPreload: false,
        aiPreloadDelayMs: 4000,
        deferAI: true,
        batchDOM: true,
        reduceAnimations: true,
        reduceUIAnimations: true,
        domCacheTtlMs: 52000,
        storageBatchDelayMs: 260,
        lazyChartStaggerMs: 190,
        useWorkers: false,
        logRenderChunkSize: 12,
        logRenderChunkThreshold: 18,
        demoDataDays: 60,
        loadTimeoutMs: 5500,
        llmModelSize: 'tier1'
      },
      2: {
        deviceClass: 'low',
        chartMaxPoints: 50,
        maxChartPoints: 70,
        chartAnimation: false,
        enableChartPreload: true,
        chartPreloadDelayMs: 2800,
        enableAIPreload: false,
        aiPreloadDelayMs: 3200,
        deferAI: true,
        batchDOM: true,
        reduceAnimations: true,
        reduceUIAnimations: true,
        domCacheTtlMs: 40000,
        storageBatchDelayMs: 200,
        lazyChartStaggerMs: 140,
        useWorkers: false,
        logRenderChunkSize: 16,
        logRenderChunkThreshold: 22,
        demoDataDays: 180,
        loadTimeoutMs: 8000,
        llmModelSize: 'tier2'
      },
      3: {
        deviceClass: 'medium',
        chartMaxPoints: 90,
        maxChartPoints: 120,
        chartAnimation: true,
        enableChartPreload: true,
        chartPreloadDelayMs: 1800,
        enableAIPreload: true,
        aiPreloadDelayMs: 2000,
        deferAI: false,
        batchDOM: false,
        reduceAnimations: false,
        reduceUIAnimations: false,
        domCacheTtlMs: 30000,
        storageBatchDelayMs: 110,
        lazyChartStaggerMs: 70,
        useWorkers: true,
        logRenderChunkSize: 20,
        logRenderChunkThreshold: 28,
        demoDataDays: 365,
        loadTimeoutMs: 10000,
        llmModelSize: 'tier3'
      },
      4: {
        deviceClass: 'high',
        chartMaxPoints: 150,
        maxChartPoints: 170,
        chartAnimation: true,
        enableChartPreload: true,
        chartPreloadDelayMs: 1000,
        enableAIPreload: true,
        aiPreloadDelayMs: 1200,
        deferAI: false,
        batchDOM: false,
        reduceAnimations: false,
        reduceUIAnimations: false,
        domCacheTtlMs: 24000,
        storageBatchDelayMs: 90,
        lazyChartStaggerMs: 50,
        useWorkers: true,
        logRenderChunkSize: 26,
        logRenderChunkThreshold: 34,
        demoDataDays: 365,
        loadTimeoutMs: 12000,
        llmModelSize: 'tier4'
      },
      5: {
        deviceClass: 'high',
        chartMaxPoints: 280,
        maxChartPoints: 300,
        chartAnimation: true,
        enableChartPreload: true,
        chartPreloadDelayMs: 300,
        enableAIPreload: true,
        aiPreloadDelayMs: 400,
        deferAI: false,
        batchDOM: false,
        reduceAnimations: false,
        reduceUIAnimations: false,
        domCacheTtlMs: 12000,
        storageBatchDelayMs: 50,
        lazyChartStaggerMs: 18,
        useWorkers: true,
        logRenderChunkSize: 36,
        logRenderChunkThreshold: 44,
        demoDataDays: 365,
        loadTimeoutMs: 15000,
        llmModelSize: 'tier5'
      }
    };
    var DESKTOP_PROFILES = {
      1: {
        deviceClass: 'low',
        chartMaxPoints: 22,
        maxChartPoints: 30,
        chartAnimation: false,
        enableChartPreload: true,
        chartPreloadDelayMs: 3000,
        enableAIPreload: false,
        aiPreloadDelayMs: 3800,
        deferAI: true,
        batchDOM: true,
        reduceAnimations: true,
        reduceUIAnimations: true,
        domCacheTtlMs: 45000,
        storageBatchDelayMs: 200,
        lazyChartStaggerMs: 130,
        useWorkers: false,
        logRenderChunkSize: 16,
        logRenderChunkThreshold: 22,
        demoDataDays: 365,
        loadTimeoutMs: 7000,
        llmModelSize: 'tier1'
      },
      2: {
        deviceClass: 'low',
        chartMaxPoints: 55,
        maxChartPoints: 80,
        chartAnimation: false,
        enableChartPreload: true,
        chartPreloadDelayMs: 2000,
        enableAIPreload: false,
        aiPreloadDelayMs: 2800,
        deferAI: true,
        batchDOM: true,
        reduceAnimations: true,
        reduceUIAnimations: true,
        domCacheTtlMs: 38000,
        storageBatchDelayMs: 150,
        lazyChartStaggerMs: 100,
        useWorkers: false,
        logRenderChunkSize: 18,
        logRenderChunkThreshold: 26,
        demoDataDays: 730,
        loadTimeoutMs: 9000,
        llmModelSize: 'tier2'
      },
      3: {
        deviceClass: 'medium',
        chartMaxPoints: 120,
        maxChartPoints: 160,
        chartAnimation: true,
        enableChartPreload: true,
        chartPreloadDelayMs: 1200,
        enableAIPreload: true,
        aiPreloadDelayMs: 1300,
        deferAI: false,
        batchDOM: false,
        reduceAnimations: false,
        reduceUIAnimations: false,
        domCacheTtlMs: 28000,
        storageBatchDelayMs: 95,
        lazyChartStaggerMs: 55,
        useWorkers: true,
        logRenderChunkSize: 22,
        logRenderChunkThreshold: 32,
        demoDataDays: 1825,
        loadTimeoutMs: 11500,
        llmModelSize: 'tier3'
      },
      4: {
        deviceClass: 'high',
        chartMaxPoints: 200,
        maxChartPoints: 220,
        chartAnimation: true,
        enableChartPreload: true,
        chartPreloadDelayMs: 700,
        enableAIPreload: true,
        aiPreloadDelayMs: 850,
        deferAI: false,
        batchDOM: false,
        reduceAnimations: false,
        reduceUIAnimations: false,
        domCacheTtlMs: 20000,
        storageBatchDelayMs: 80,
        lazyChartStaggerMs: 38,
        useWorkers: true,
        logRenderChunkSize: 28,
        logRenderChunkThreshold: 36,
        demoDataDays: 3650,
        loadTimeoutMs: 12500,
        llmModelSize: 'tier4'
      },
      5: {
        deviceClass: 'high',
        chartMaxPoints: 400,
        maxChartPoints: 450,
        chartAnimation: true,
        enableChartPreload: true,
        chartPreloadDelayMs: 300,
        enableAIPreload: true,
        aiPreloadDelayMs: 400,
        deferAI: false,
        batchDOM: false,
        reduceAnimations: false,
        reduceUIAnimations: false,
        domCacheTtlMs: 12000,
        storageBatchDelayMs: 50,
        lazyChartStaggerMs: 15,
        useWorkers: true,
        logRenderChunkSize: 40,
        logRenderChunkThreshold: 48,
        demoDataDays: 3650,
        loadTimeoutMs: 15000,
        llmModelSize: 'tier5'
      }
    };
    var PROFILE_OVERRIDES = {
      platform: {
        ios: {
          chartAnimation: false,
          lazyChartStaggerMs: 90
        },
        android: {
          chartAnimation: true,
          lazyChartStaggerMs: 70
        },
        desktop: {
          chartAnimation: true
        }
      },
      tablet: {
        chartMaxPoints: 140,
        maxChartPoints: 180,
        demoDataDays: 1825,
        loadTimeoutMs: 12000
      },
      native: {
        enableAIPreload: true,
        aiPreloadDelayMs: 900,
        chartPreloadDelayMs: 900
      },
      coresBucket: {
        low: {
          useWorkers: false,
          batchDOM: true,
          storageBatchDelayMs: 150
        },
        mid: {
          useWorkers: true,
          batchDOM: false
        },
        high: {
          useWorkers: true,
          batchDOM: false,
          storageBatchDelayMs: 80
        }
      },
      memoryBucket: {
        low: {
          demoDataDays: 120,
          enableAIPreload: false,
          deferAI: true
        },
        mid: {
          demoDataDays: 365
        },
        high: {
          demoDataDays: 3650
        }
      }
    };
    function getRuntimeFlags() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getRuntimeFlags", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var dm = typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform ? window.DeviceModule.platform : null;
        var platformName = dm && dm.platform ? String(dm.platform) : 'desktop';
        var isTablet = !!(dm && dm.isTablet);
        var cores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 ? nav.hardwareConcurrency : 0;
        var deviceMemory = typeof window !== 'undefined' && window.isSecureContext === true && typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 ? nav.deviceMemory : 0;
        var estimatedMemoryBucket = dm && dm.estimatedMemoryBucket ? dm.estimatedMemoryBucket : null;
        var cap = typeof window !== 'undefined' && window.Capacitor || typeof window !== 'undefined' && window.parent && window.parent.Capacitor;
        var isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
        var flags = {
          platform: platformName,
          isTablet: isTablet,
          cores: cores,
          deviceMemory: deviceMemory,
          estimatedMemoryBucket: estimatedMemoryBucket,
          isNative: isNative
        };
        if (dm) {
          if (dm.osName != null && dm.osName !== '') flags.osName = dm.osName;
          if (dm.osVersion != null && dm.osVersion !== '') flags.osVersion = dm.osVersion;
          if (dm.deviceType != null && dm.deviceType !== '') flags.deviceType = dm.deviceType;
          if (dm.deviceVendor != null && dm.deviceVendor !== '') flags.deviceVendor = dm.deviceVendor;
          if (dm.deviceModel != null && dm.deviceModel !== '') flags.deviceModel = dm.deviceModel;
          if (dm.cpuArchitecture != null && dm.cpuArchitecture !== '') flags.cpuArchitecture = dm.cpuArchitecture;
        }
        return flags;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function mergeInto(dst, src) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "mergeInto", arguments) : undefined;
      try {
        if (!src) return;
        for (var k in src) {
          if (src.hasOwnProperty(k)) dst[k] = src[k];
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getCachedResult() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getCachedResult", arguments) : undefined;
      try {
        try {
          if (typeof localStorage === 'undefined' || !localStorage.getItem) return null;
          var raw = localStorage.getItem(CACHE_KEY);
          if (!raw) return null;
          var data = JSON.parse(raw);
          if (!data || typeof data.tier !== 'number' || data.tier < 1 || data.tier > MAX_TIER) return null;
          if (!data.platformType || data.platformType !== 'mobile' && data.platformType !== 'desktop') return null;
          if (data.version != null && data.version < BENCHMARK_VERSION) return null;
          return data;
        } catch (e) {
          return null;
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function isBenchmarkReady() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "isBenchmarkReady", arguments) : undefined;
      try {
        return getCachedResult() !== null;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    var _lastTier = null;
    var _lastPlatformType = null;
    function getPerformanceTier() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getPerformanceTier", arguments) : undefined;
      try {
        var cached = getCachedResult();
        if (cached) {
          _lastTier = cached.tier;
          _lastPlatformType = cached.platformType;
          return cached.tier;
        }
        if (_lastTier != null) return _lastTier;
        return getTierFromHeuristic();
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getPlatformTypeCached() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getPlatformTypeCached", arguments) : undefined;
      try {
        var cached = getCachedResult();
        if (cached) return cached.platformType;
        if (_lastPlatformType != null) return _lastPlatformType;
        return getPlatformType();
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function saveBenchmarkResult(platformType, tier, details) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "saveBenchmarkResult", arguments) : undefined;
      try {
        try {
          if (typeof localStorage === 'undefined' || !localStorage.setItem) return;
          var obj = null;
          if (platformType && typeof platformType === 'object') {
            obj = platformType;
          } else {
            obj = {
              platformType: platformType,
              tier: tier
            };
            if (details && typeof details === 'object') {
              for (var k in details) {
                if (details.hasOwnProperty(k)) obj[k] = details[k];
              }
            }
          }
          var pt = obj.platformType === 'mobile' || obj.platformType === 'desktop' ? obj.platformType : getPlatformType();
          var t = Math.max(1, Math.min(MAX_TIER, Math.floor(obj.tier)));
          obj.platformType = pt;
          obj.tier = t;
          obj.ts = obj.ts != null ? obj.ts : Date.now();
          obj.version = obj.version != null ? obj.version : BENCHMARK_VERSION;
          _lastTier = t;
          _lastPlatformType = pt;
          localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
        } catch (e) {}
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function computeSuiteWorkloads(tier) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "computeSuiteWorkloads", arguments) : undefined;
      try {
        tier = Math.max(1, Math.min(MAX_TIER, Math.floor(tier || 3)));
        var scale = 1 + (tier - 1) * 0.45;
        return {
          cpuIterations: clampInt(200000 * scale, 120000, 1600000),
          arraySize: clampInt(45000 * scale, 20000, 220000),
          jsonSize: clampInt(180 * scale, 80, 900),
          stringSize: clampInt(20000 * scale, 12000, 140000),
          domNodes: clampInt(130 * scale, 80, 650),
          rafFrames: 7
        };
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function runTestSync(testId, label, runFn, unit, progressCb) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runTestSync", arguments) : undefined;
      try {
        var t0 = nowMs();
        var out = 0;
        try {
          out = runFn();
        } catch (e) {
          out = 0;
        }
        var ms = nowMs() - t0;
        if (progressCb) progressCb(testId, label);
        return {
          id: testId,
          label: label,
          ms: ms,
          unit: unit,
          out: out
        };
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function runSuiteAsync(opts, onProgress, onDone) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runSuiteAsync", arguments) : undefined;
      try {
        var totalCapMs = opts && opts.totalCapMs ? opts.totalCapMs : DEFAULT_TOTAL_CAP_MS;
        var startAll = nowMs();
        var platformType = getPlatformType();
        var env = getEnvSnapshot(platformType);

        // Quick CPU estimate to pick suite workloads.
        var estimateIters = 280000;
        var est0 = nowMs();
        cpuArith(estimateIters);
        var estMs = nowMs() - est0;
        if (estMs < 2) {
          estimateIters = 1400000;
          est0 = nowMs();
          cpuArith(estimateIters);
          estMs = nowMs() - est0;
        }
        var estMsPer200k = msPer200kFromRun(estimateIters, estMs);
        var provisionalTier = msPer200kToTier(estMsPer200k);
        var workloads = computeSuiteWorkloads(provisionalTier);
        var baseRepeats = provisionalTier <= 2 ? 3 : provisionalTier <= 5 ? 5 : 7;
        var repeats = baseRepeats;

        // Borderline tiers: add more repeats for stability.
        var thresholdNear = function (x, target, pct) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            return Math.abs(x - target) / target <= pct;
          } finally {
            __rianellTraceExit(__rt);
          }
        };
        var near = thresholdNear(estMsPer200k, 14.0, 0.08) || thresholdNear(estMsPer200k, 18.0, 0.08) || thresholdNear(estMsPer200k, 26.0, 0.08);
        if (near) repeats = Math.min(baseRepeats + 2, 9);
        var jsonPayload = makeJsonPayload(workloads.jsonSize);
        var subtests = [];
        var cpuMsPer200kSamples = [];
        var cpuMsSamples = [];
        var index = 0;
        var totalSteps = repeats * 5 + repeats; // 6 steps per repeat: cpu, array, json, string, dom, rAF

        function pct() {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "pct", arguments) : undefined;
          try {
            return Math.max(0, Math.min(100, Math.floor(index / Math.max(1, totalSteps) * 100)));
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        function progress(phase, currentLabel) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "progress", arguments) : undefined;
          try {
            var percent = pct();
            if (typeof console !== 'undefined' && console.log) {
              console.log('[Benchmark] progress', percent + '%', 'step', index + '/' + totalSteps, 'phase', phase, 'label', currentLabel || '');
            }
            if (typeof onProgress === 'function') {
              onProgress(percent, {
                phase: phase,
                label: currentLabel
              });
            }
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        if (typeof console !== 'undefined' && console.log) {
          console.log('[Benchmark] start', 'platformType', platformType, 'repeats', repeats, 'totalSteps', totalSteps, 'workloads', workloads);
        }
        function runRepeat(rep) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runRepeat", arguments) : undefined;
          try {
            if (nowMs() - startAll > totalCapMs) {
              finish();
              return;
            }
            progress('running', 'CPU arithmetic');
            var cpuRes = runTestSync('cpu', 'CPU arithmetic', function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
              try {
                return cpuArith(workloads.cpuIterations);
              } finally {
                __rianellTraceExit(__rt);
              }
            }, 'iters', function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
              try {} finally {
                __rianellTraceExit(__rt);
              }
            });
            cpuRes.iterations = workloads.cpuIterations;
            cpuRes.msPer200k = msPer200kFromRun(workloads.cpuIterations, cpuRes.ms);
            cpuMsPer200kSamples.push(cpuRes.msPer200k);
            cpuMsSamples.push(cpuRes.ms);
            subtests.push({
              repeat: rep,
              id: cpuRes.id,
              label: cpuRes.label,
              ms: cpuRes.ms,
              iterations: cpuRes.iterations,
              msPer200k: cpuRes.msPer200k
            });
            index++;
            if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] test', 'CPU arithmetic', 'repeat', rep + 1, 'ms', cpuRes.ms, 'msPer200k', cpuRes.msPer200k);
            setTimeout(function () {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
              try {
                progress('running', 'Array throughput');
                var arrRes = runTestSync('array', 'Array throughput', function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                  try {
                    return arrayThroughput(workloads.arraySize);
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                }, 'elems', function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                  try {} finally {
                    __rianellTraceExit(__rt);
                  }
                });
                arrRes.size = workloads.arraySize;
                subtests.push({
                  repeat: rep,
                  id: arrRes.id,
                  label: arrRes.label,
                  ms: arrRes.ms,
                  size: arrRes.size
                });
                index++;
                if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] test', 'Array throughput', 'repeat', rep + 1, 'ms', arrRes.ms);
                setTimeout(function () {
                  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                  try {
                    progress('running', 'JSON parse/stringify');
                    var jsonRes = runTestSync('json', 'JSON parse/stringify', function () {
                      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                      try {
                        return jsonParseStringify(jsonPayload);
                      } finally {
                        __rianellTraceExit(__rt);
                      }
                    }, 'bytes', function () {
                      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                      try {} finally {
                        __rianellTraceExit(__rt);
                      }
                    });
                    jsonRes.size = workloads.jsonSize;
                    subtests.push({
                      repeat: rep,
                      id: jsonRes.id,
                      label: jsonRes.label,
                      ms: jsonRes.ms,
                      size: jsonRes.size
                    });
                    index++;
                    if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] test', 'JSON parse/stringify', 'repeat', rep + 1, 'ms', jsonRes.ms);
                    setTimeout(function () {
                      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                      try {
                        progress('running', 'String ops');
                        var strRes = runTestSync('string', 'String ops', function () {
                          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                          try {
                            return stringOps(workloads.stringSize);
                          } finally {
                            __rianellTraceExit(__rt);
                          }
                        }, 'chars', function () {
                          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                          try {} finally {
                            __rianellTraceExit(__rt);
                          }
                        });
                        strRes.size = workloads.stringSize;
                        subtests.push({
                          repeat: rep,
                          id: strRes.id,
                          label: strRes.label,
                          ms: strRes.ms,
                          size: strRes.size
                        });
                        index++;
                        if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] test', 'String ops', 'repeat', rep + 1, 'ms', strRes.ms);
                        setTimeout(function () {
                          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                          try {
                            progress('running', 'DOM fragment build');
                            var domRes = runTestSync('dom', 'DOM fragment build', function () {
                              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                              try {
                                return domFragmentBuild(workloads.domNodes);
                              } finally {
                                __rianellTraceExit(__rt);
                              }
                            }, 'nodes', function () {
                              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                              try {} finally {
                                __rianellTraceExit(__rt);
                              }
                            });
                            domRes.count = workloads.domNodes;
                            subtests.push({
                              repeat: rep,
                              id: domRes.id,
                              label: domRes.label,
                              ms: domRes.ms,
                              count: domRes.count
                            });
                            index++;
                            if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] test', 'DOM fragment build', 'repeat', rep + 1, 'ms', domRes.ms);
                            progress('running', 'rAF latency');
                            rafLatency(workloads.rafFrames, function (rafRes) {
                              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
                              try {
                                if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] test', 'rAF latency', 'repeat', rep + 1, 'avgMs', rafRes.avgMs);
                                subtests.push({
                                  repeat: rep,
                                  id: 'raf',
                                  label: 'rAF latency',
                                  ms: rafRes.avgMs,
                                  samples: rafRes.samples
                                });
                                index++;
                                progress('done', '');
                                if (rep + 1 >= repeats) finish();else runRepeat(rep + 1);
                              } finally {
                                __rianellTraceExit(__rt);
                              }
                            });
                          } finally {
                            __rianellTraceExit(__rt);
                          }
                        }, 0);
                      } finally {
                        __rianellTraceExit(__rt);
                      }
                    }, 0);
                  } finally {
                    __rianellTraceExit(__rt);
                  }
                }, 0);
              } finally {
                __rianellTraceExit(__rt);
              }
            }, 0);
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        function finish() {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "finish", arguments) : undefined;
          try {
            if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] finish', 'steps', index + '/' + totalSteps);
            if (typeof onProgress === 'function') onProgress(100, {
              phase: 'done'
            });
            var msPer200kMed = median(cpuMsPer200kSamples);
            var tier = msPer200kToTier(msPer200kMed);
            var score = msPer200kMed > 0 ? 1000 / msPer200kMed : 0;
            if (typeof console !== 'undefined' && console.log) {
              console.log('[Benchmark] result', 'tier', tier, 'score', score, 'msPer200kMed', msPer200kMed, 'cpuSamples', cpuMsPer200kSamples.length);
            }

            // If the result moved across major class boundaries, ensure we have enough repeats (only if we still have budget).
            var classBefore = getLegacyDeviceClass(provisionalTier);
            var classAfter = getLegacyDeviceClass(tier);
            if (classBefore !== classAfter && repeats < 9 && nowMs() - startAll < totalCapMs * 0.85) {
              repeats = Math.min(9, repeats + 2);
              totalSteps = repeats * 5 + repeats;
              runRepeat(baseRepeats); // add extra repeats
              return;
            }

            // Summaries per test: median ms and coefficient of variation.
            var perTest = {};
            for (var i = 0; i < subtests.length; i++) {
              var st = subtests[i];
              if (!perTest[st.id]) perTest[st.id] = {
                id: st.id,
                label: st.label,
                ms: []
              };
              perTest[st.id].ms.push(st.ms);
            }
            var testSummary = [];
            for (var id in perTest) {
              if (!perTest.hasOwnProperty(id)) continue;
              var msArr = perTest[id].ms;
              var m = median(msArr);
              var sd = stddev(msArr);
              testSummary.push({
                id: id,
                label: perTest[id].label,
                medianMs: m,
                meanMs: mean(msArr),
                cv: m > 0 ? sd / mean(msArr) : 0,
                samples: msArr
              });
            }
            testSummary.sort(function (a, b) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
              try {
                return a.id < b.id ? -1 : 1;
              } finally {
                __rianellTraceExit(__rt);
              }
            });
            if (typeof console !== 'undefined' && console.log) {
              console.log('[Benchmark] onDone', 'platformType', platformType, 'tier', tier, 'totalMs', Math.round(nowMs() - startAll), 'tests', testSummary.length);
            }
            var result = {
              version: BENCHMARK_VERSION,
              platformType: platformType,
              tier: tier,
              score: score,
              cpu: {
                msPer200k: msPer200kMed,
                msPer200kSamples: cpuMsPer200kSamples,
                msSamples: cpuMsSamples,
                iterations: workloads.cpuIterations
              },
              repeats: repeats,
              totalMs: nowMs() - startAll,
              env: env,
              workloads: workloads,
              tests: testSummary,
              raw: subtests,
              ts: Date.now()
            };
            runGpuBenchmarkAsync(function (gpu) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
              try {
                result.gpu = gpu;
                if (typeof console !== 'undefined' && console.log) {
                  console.log('[Benchmark] GPU', gpu.backend, gpu.available, gpu.good, gpu.scoreMs);
                }
                onDone(result);
              } finally {
                __rianellTraceExit(__rt);
              }
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        progress('starting', 'Warmup');
        setTimeout(function () {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            runRepeat(0);
          } finally {
            __rianellTraceExit(__rt);
          }
        }, 0);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function runBenchmarkIfNeeded(onProgress, onComplete) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "runBenchmarkIfNeeded", arguments) : undefined;
      try {
        var cached = getCachedResult();
        if (cached) {
          if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] using cached result', 'tier', cached.tier, 'platformType', cached.platformType);
          _lastTier = cached.tier;
          _lastPlatformType = cached.platformType;
          // Drive the loading bar once (otherwise onProgress never runs and the bar stays empty)
          if (typeof onProgress === 'function') onProgress(100, {
            phase: 'cached',
            label: 'Using saved result'
          });
          if (typeof onComplete === 'function') onComplete(cached.tier, cached.platformType, cached);
          return;
        }
        if (typeof console !== 'undefined' && console.log) console.log('[Benchmark] running suite (no cache)');
        if (typeof onProgress === 'function') onProgress(0, {
          phase: 'starting'
        });
        runSuiteAsync({
          totalCapMs: DEFAULT_TOTAL_CAP_MS
        }, onProgress, function (resultObj) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "anonymous", arguments) : undefined;
          try {
            _lastTier = resultObj.tier;
            _lastPlatformType = resultObj.platformType;
            if (typeof onComplete === 'function') onComplete(resultObj.tier, resultObj.platformType, resultObj);
          } finally {
            __rianellTraceExit(__rt);
          }
        });
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getFullProfile(platformType, tier, overrides) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "getFullProfile", arguments) : undefined;
      try {
        var pt = platformType === 'mobile' || platformType === 'desktop' ? platformType : getPlatformType();
        var t = Math.max(1, Math.min(MAX_TIER, Math.floor(tier)));
        var cached = getCachedResult();
        var gpu = cached && cached.gpu ? cached.gpu : {
          backend: 'none',
          good: false
        };
        var effectiveTier = t === 5 || t === 4 && gpu.good ? 5 : t;
        var table = pt === 'mobile' ? MOBILE_PROFILES : DESKTOP_PROFILES;
        var profile = table[effectiveTier] || table[4] || table[3] || table[2] || table[1];
        var out = {};
        for (var k in profile) {
          if (profile.hasOwnProperty(k)) out[k] = profile[k];
        }
        out.gpuBackend = gpu.backend || 'none';
        out.gpuGood = !!gpu.good;

        // Layered overrides: platform/tablet/native/cores/memory. Keep user/network overrides last.
        var flags = getRuntimeFlags();
        if (flags && flags.platform && PROFILE_OVERRIDES.platform && PROFILE_OVERRIDES.platform[flags.platform]) {
          mergeInto(out, PROFILE_OVERRIDES.platform[flags.platform]);
        }
        if (flags && flags.isTablet && PROFILE_OVERRIDES.tablet) {
          mergeInto(out, PROFILE_OVERRIDES.tablet);
        }
        if (flags && flags.isNative && PROFILE_OVERRIDES.native) {
          mergeInto(out, PROFILE_OVERRIDES.native);
        }
        if (flags) {
          var coresBucket = flags.cores <= 2 ? 'low' : flags.cores <= 6 ? 'mid' : 'high';
          if (PROFILE_OVERRIDES.coresBucket && PROFILE_OVERRIDES.coresBucket[coresBucket]) mergeInto(out, PROFILE_OVERRIDES.coresBucket[coresBucket]);
          var memBucket;
          if (flags.deviceMemory && flags.deviceMemory > 0) {
            memBucket = flags.deviceMemory <= 2 ? 'low' : flags.deviceMemory <= 4 ? 'mid' : 'high';
          } else if (flags.estimatedMemoryBucket) {
            memBucket = flags.estimatedMemoryBucket === 'low' ? 'low' : flags.estimatedMemoryBucket === 'high' ? 'high' : 'mid';
          } else {
            memBucket = 'mid';
          }
          if (PROFILE_OVERRIDES.memoryBucket && PROFILE_OVERRIDES.memoryBucket[memBucket]) mergeInto(out, PROFILE_OVERRIDES.memoryBucket[memBucket]);
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
        // Tier 5 (or effective tier 5 when GPU good): do not let overrides reduce chart capacity below base
        if (effectiveTier === 5 && profile.chartMaxPoints != null && profile.maxChartPoints != null) {
          if (out.chartMaxPoints < profile.chartMaxPoints) out.chartMaxPoints = profile.chartMaxPoints;
          if (out.maxChartPoints < profile.maxChartPoints) out.maxChartPoints = profile.maxChartPoints;
        }
        if (out.saveData == null) {
          var conn = typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform && window.DeviceModule.platform.connection;
          out.saveData = !!(conn && conn.saveData);
        }
        return out;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function clearBenchmarkCache() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-benchmark.js", "clearBenchmarkCache", arguments) : undefined;
      try {
        try {
          if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
            localStorage.removeItem(CACHE_KEY);
            _lastTier = null;
            _lastPlatformType = null;
          }
        } catch (e) {}
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    if (typeof window !== 'undefined') {
      window.DeviceBenchmark = {
        getPlatformType: getPlatformType,
        getPlatformTypeCached: getPlatformTypeCached,
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
  } finally {
    __rianellTraceExit(__rt);
  }
})();