// ============================================
// Performance Optimisation Utilities
// ============================================

/**
 * Performance optimisation utilities for Rianell
 */

// ============================================
// DOM Query Caching
// ============================================

const DOMCache = {
  _cache: new Map(),
  _cacheTime: new Map(),
  _cacheTimeout: 30000, // 30 seconds cache
  
  /**
   * Get element with caching
   */
  getElement(id) {
    const now = Date.now();
    const cached = this._cache.get(id);
    const cacheTime = this._cacheTime.get(id);
    
    // Return cached if still valid
    if (cached && cacheTime && (now - cacheTime) < this._cacheTimeout) {
      // Verify element still exists in DOM
      if (document.contains(cached)) {
        return cached;
      } else {
        // Element removed from DOM, clear cache
        this._cache.delete(id);
        this._cacheTime.delete(id);
      }
    }
    
    // Query and cache
    const element = document.getElementById(id);
    if (element) {
      this._cache.set(id, element);
      this._cacheTime.set(id, now);
    }
    return element;
  },
  
  /**
   * Clear cache for specific element or all
   */
  clear(id = null) {
    if (id) {
      this._cache.delete(id);
      this._cacheTime.delete(id);
    } else {
      this._cache.clear();
      this._cacheTime.clear();
    }
  },
  
  /**
   * Pre-warm cache for common elements
   */
  prewarm(ids) {
    ids.forEach(id => this.getElement(id));
  }
};

// ============================================
// Debounce and Throttle
// ============================================

/**
 * Debounce function calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================
// Data Processing Optimisation
// ============================================

/**
 * Memoized data processing
 */
var DATACACHE_MAX_KEYS = 80; // Cap to avoid unbounded memory growth
const DataCache = {
  _cache: new Map(),
  _cacheTime: new Map(),
  _cacheOrder: [],
  _defaultTTL: 60000,
  
  get(key, computeFn, ttl = this._defaultTTL) {
    const now = Date.now();
    const cached = this._cache.get(key);
    const cacheTime = this._cacheTime.get(key);
    if (cached && cacheTime && (now - cacheTime) < ttl) {
      return cached;
    }
    while (this._cache.size >= DATACACHE_MAX_KEYS && this._cacheOrder.length > 0) {
      const oldest = this._cacheOrder.pop();
      if (oldest != null) {
        this._cache.delete(oldest);
        this._cacheTime.delete(oldest);
      }
    }
    const result = computeFn();
    this._cache.set(key, result);
    this._cacheTime.set(key, now);
    var idx = this._cacheOrder.indexOf(key);
    if (idx >= 0) this._cacheOrder.splice(idx, 1);
    this._cacheOrder.unshift(key);
    return result;
  },
  
  invalidate(key = null) {
    if (key) {
      this._cache.delete(key);
      this._cacheTime.delete(key);
      var i = this._cacheOrder.indexOf(key);
      if (i >= 0) this._cacheOrder.splice(i, 1);
    } else {
      this._cache.clear();
      this._cacheTime.clear();
      this._cacheOrder.length = 0;
    }
  },
  
  cleanup() {
    const now = Date.now();
    for (const [key, time] of this._cacheTime.entries()) {
      if ((now - time) > this._defaultTTL) {
        this._cache.delete(key);
        this._cacheTime.delete(key);
        var i = this._cacheOrder.indexOf(key);
        if (i >= 0) this._cacheOrder.splice(i, 1);
      }
    }
  }
};

// ============================================
// Batch DOM Updates
// ============================================

/**
 * Batch DOM updates using requestAnimationFrame
 */
var DOMBATCHER_MAX_PENDING = 150; // Cap to avoid unbounded memory growth (e.g. when tab backgrounded and rAF is throttled)
class DOMBatcher {
  constructor() {
    this.pendingUpdates = [];
    this.scheduled = false;
  }
  
  schedule(updateFn) {
    this.pendingUpdates.push(updateFn);
    if (this.pendingUpdates.length >= DOMBATCHER_MAX_PENDING) {
      this.flush();
      return;
    }
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  flush() {
    const updates = this.pendingUpdates.splice(0);
    this.scheduled = false;
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('DOM update error:', error);
      }
    });
  }
}

const domBatcher = new DOMBatcher();

// ============================================
// Optimized Array Operations
// ============================================

/**
 * Optimized filter and map in one pass
 */
function filterMap(array, filterFn, mapFn) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (filterFn(item, i, array)) {
      result.push(mapFn(item, i, array));
    }
  }
  return result;
}

/**
 * Optimized sort with memoization
 */
function memoizedSort(array, sortFn, cacheKey = null) {
  if (cacheKey) {
    return DataCache.get(cacheKey, () => [...array].sort(sortFn), 30000);
  }
  return [...array].sort(sortFn);
}

// ============================================
// Lazy Loading
// ============================================

/**
 * Lazy load script
 */
function lazyLoadScript(src, onLoad = null) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(existing);
      if (onLoad) onLoad();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      resolve(script);
      if (onLoad) onLoad();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

var _apexChartsLoadPromise = null;
/**
 * Load apexcharts.min.js on first use (not in document head) to speed initial page load.
 */
function ensureApexChartsLoaded() {
  if (typeof ApexCharts !== 'undefined') {
    return Promise.resolve();
  }
  if (_apexChartsLoadPromise) {
    return _apexChartsLoadPromise;
  }
  var src = 'apexcharts.min.js?v=1';
  _apexChartsLoadPromise = lazyLoadScript(src).then(function () {
    if (typeof ApexCharts === 'undefined') {
      _apexChartsLoadPromise = null;
      throw new Error('ApexCharts failed to load');
    }
  }).catch(function (err) {
    _apexChartsLoadPromise = null;
    throw err;
  });
  return _apexChartsLoadPromise;
}

var _aiEngineLoadPromise = null;
/**
 * Load TensorFlow.js + WebGL backend + AIEngine.js on first AI use (not in document head).
 */
function ensureAIEngineLoaded() {
  if (typeof window !== 'undefined' && window.AIEngine && typeof window.AIEngine.analyzeHealthMetrics === 'function') {
    return Promise.resolve();
  }
  if (_aiEngineLoadPromise) {
    return _aiEngineLoadPromise;
  }
  var tfUrl = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  var webglUrl = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js';
  var engineUrl = 'AIEngine.js?v=1';
  _aiEngineLoadPromise = lazyLoadScript(tfUrl)
    .then(function () {
      if (typeof console !== 'undefined' && console.warn) {
        var _warn = console.warn;
        console.warn = function () {
          var msg = arguments[0] && String(arguments[0]);
          if (msg && (msg.indexOf('already registered') !== -1 && (msg.indexOf('webgl') !== -1 || msg.indexOf('kernel') !== -1))) return;
          _warn.apply(console, arguments);
        };
      }
      return lazyLoadScript(webglUrl);
    })
    .then(function () {
      return lazyLoadScript(engineUrl);
    })
    .then(function () {
      if (typeof window.AIEngine === 'undefined' || typeof window.AIEngine.analyzeHealthMetrics !== 'function') {
        _aiEngineLoadPromise = null;
        throw new Error('AIEngine failed to load');
      }
    })
    .catch(function (err) {
      _aiEngineLoadPromise = null;
      throw err;
    });
  return _aiEngineLoadPromise;
}

var _exportUtilsPromise = null;
function ensureExportUtilsLoaded() {
  if (typeof showExportModal === 'function') {
    return Promise.resolve();
  }
  if (_exportUtilsPromise) {
    return _exportUtilsPromise;
  }
  _exportUtilsPromise = lazyLoadScript('export-utils.js?v=1').catch(function (e) {
    _exportUtilsPromise = null;
    throw e;
  });
  return _exportUtilsPromise;
}

var _importUtilsPromise = null;
function ensureImportUtilsLoaded() {
  if (typeof showImportModal === 'function') {
    return Promise.resolve();
  }
  if (_importUtilsPromise) {
    return _importUtilsPromise;
  }
  _importUtilsPromise = lazyLoadScript('import-utils.js?v=1')
    .then(function () {
      if (typeof initializeImportHandlers === 'function') {
        initializeImportHandlers();
      }
    })
    .catch(function (e) {
      _importUtilsPromise = null;
      throw e;
    });
  return _importUtilsPromise;
}

var _printUtilsPromise = null;
function ensurePrintUtilsLoaded() {
  if (typeof printReport === 'function') {
    return Promise.resolve();
  }
  if (_printUtilsPromise) {
    return _printUtilsPromise;
  }
  _printUtilsPromise = lazyLoadScript('print-utils.js?v=1').catch(function (e) {
    _printUtilsPromise = null;
    throw e;
  });
  return _printUtilsPromise;
}

// ============================================
// Memory Management
// ============================================

/**
 * Cleanup utility for event listeners
 */
class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * Add event listener with automatic cleanup tracking
   */
  on(element, event, handler, options = false) {
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    
    element.addEventListener(event, handler, options);
    this.listeners.get(element).push({ event, handler, options });
  }
  
  /**
   * Remove all listeners for an element
   */
  off(element) {
    const listeners = this.listeners.get(element);
    if (listeners) {
      listeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this.listeners.delete(element);
    }
  }
  
  /**
   * Remove all listeners
   */
  cleanup() {
    for (const [element] of this.listeners) {
      this.off(element);
    }
  }
}

const eventManager = new EventManager();

// ============================================
// Performance Monitoring
// ============================================

/**
 * Performance monitoring utilities
 */
const PerformanceMonitor = {
  marks: new Map(),
  
  /**
   * Mark start of operation
   */
  mark(name) {
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
    this.marks.set(name, performance.now());
  },
  
  /**
   * Measure duration
   */
  measure(name) {
    const start = this.marks.get(name);
    if (start) {
      const duration = performance.now() - start;
      if (performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      this.marks.delete(name);
      return duration;
    }
    return null;
  },
  
  /**
   * Measure async function
   */
  async measureAsync(name, fn) {
    this.mark(name);
    try {
      const result = await fn();
      const duration = this.measure(name);
      if (duration && duration > 100) {
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }
      return result;
    } catch (error) {
      this.measure(name);
      throw error;
    }
  }
};

// ============================================
// Optimized localStorage Operations
// ============================================

/**
 * Batch localStorage operations
 */
const StorageBatcher = {
  _pending: new Map(),
  _timeout: null,
  _delay: 100, // Batch writes within 100ms
  
  /**
   * Batch setItem operations
   */
  setItem(key, value) {
    this._pending.set(key, value);
    
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    
    this._timeout = setTimeout(() => {
      this._pending.forEach((val, k) => {
        try {
          localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
        } catch (error) {
          console.error(`Storage write error for ${k}:`, error);
        }
      });
      this._pending.clear();
      this._timeout = null;
    }, this._delay);
  },
  
  /**
   * Flush immediately
   */
  flush() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    this._pending.forEach((val, k) => {
      try {
        localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
      } catch (error) {
        console.error(`Storage write error for ${k}:`, error);
      }
    });
    this._pending.clear();
  }
};

// ============================================
// Platform and capabilities (single source of truth)
// Use DeviceModule when loaded (device-module.js); otherwise fallback for standalone performance-utils.
// ============================================

/** Capacitor Android WebView: stricter AI/LLM defer than mobile browser Chrome. */
function isRianellCapacitorAndroid() {
  try {
    var c = typeof window !== 'undefined' ? window.Capacitor : null;
    return !!(
      c &&
      typeof c.isNativePlatform === 'function' &&
      c.isNativePlatform() &&
      typeof c.getPlatform === 'function' &&
      c.getPlatform() === 'android'
    );
  } catch (e) {
    return false;
  }
}

function getDevicePerformanceClassFallback() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const deviceMemory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  const isSecure = typeof window !== 'undefined' && window.isSecureContext === true;
  const cap = (typeof window !== 'undefined' && window.Capacitor) || (typeof window !== 'undefined' && window.parent && window.parent.Capacitor);
  const isNativeApp = cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();
  if (isSecure && typeof deviceMemory === 'number' && deviceMemory > 0) {
    if (deviceMemory <= 2) return isNativeApp ? 'medium' : 'low';
    if (deviceMemory >= 4) return 'high';
    return 'medium';
  }
  const dm = typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform ? window.DeviceModule.platform : null;
  const estimatedBucket = dm && dm.estimatedMemoryBucket ? dm.estimatedMemoryBucket : null;
  if (estimatedBucket === 'low') return isNativeApp ? 'medium' : 'low';
  if (estimatedBucket === 'high') return 'high';
  if (estimatedBucket === 'medium') return 'medium';
  if (typeof cores === 'number' && cores > 0) {
    if (cores <= 2) return isNativeApp ? 'medium' : 'low';
    if (cores >= 4) return 'high';
    return 'medium';
  }
  const ua = nav.userAgent || '';
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (nav.maxTouchPoints && nav.maxTouchPoints > 1);
  return mobile || isNativeApp ? 'medium' : 'medium';
}

function getDevicePerformanceClass() {
  if (typeof window !== 'undefined' && window.DeviceModule && typeof window.DeviceModule.getDevicePerformanceClass === 'function') {
    return window.DeviceModule.getDevicePerformanceClass();
  }
  return getDevicePerformanceClassFallback();
}

/**
 * Platform and capabilities object. From DeviceModule when loaded, else computed here.
 * deviceClass is updated when DeviceBenchmark is ready (see getOptimizationProfile / getDeviceOpts).
 * Exposed as PerformanceUtils.platform for use by summary-llm, app.js charts, etc.
 */
const platform = (function () {
  if (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform) {
    var base = window.DeviceModule.platform;
    return Object.assign({}, base, { deviceClass: base.deviceClass || getDevicePerformanceClass() });
  }
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const ua = nav.userAgent || '';
  let platformName = 'desktop';
  if (/iPad|iPhone|iPod/.test(ua)) platformName = 'ios';
  else if (/Android/i.test(ua)) platformName = 'android';
  let connection = null;
  if (nav.connection && typeof nav.connection === 'object') {
    connection = { effectiveType: nav.connection.effectiveType, saveData: !!nav.connection.saveData };
  }
  const win = typeof window !== 'undefined' ? window : null;
  const isStandalone = !!(win && (win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone));
  const prefersReducedMotion = !!(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var w = (win && win.innerWidth) != null ? win.innerWidth : 0;
  var h = (win && win.innerHeight) != null ? win.innerHeight : 0;
  var isTouch = !!(nav.maxTouchPoints && nav.maxTouchPoints > 0);
  var isTablet = isTouch && (Math.min(w, h) >= 600 && (Math.max(w, h) <= 1280 || /iPad|Android(?!.*Mobile)|Tablet/i.test(ua)));
  var hardwareConcurrency = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 ? nav.hardwareConcurrency : 0;
  return {
    deviceClass: getDevicePerformanceClass(),
    platform: platformName,
    isTouch: isTouch,
    isTablet: isTablet,
    isStandalone: isStandalone,
    prefersReducedMotion: prefersReducedMotion,
    connection: connection,
    screenWidth: w,
    screenHeight: h,
    hardwareConcurrency: hardwareConcurrency
  };
})();

/** When DeviceBenchmark is ready, sync platform.deviceClass from benchmark tier. */
function applyBenchmarkToPlatform() {
  if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
    var tier = window.DeviceBenchmark.getPerformanceTier();
    platform.deviceClass = window.DeviceBenchmark.getLegacyDeviceClass(tier);
  }
}

function getDeviceId() {
  if (typeof window !== 'undefined' && window.DeviceModule && typeof window.DeviceModule.getDeviceId === 'function') {
    return window.DeviceModule.getDeviceId();
  }
  return (platform.deviceClass || 'medium') + '_' + (platform.hardwareConcurrency || 0);
}

/**
 * Single optimization profile per device/platform. Use this for charts, preload, DOM, storage.
 * When DeviceBenchmark is ready, uses expansive MOBILE_PROFILES/DESKTOP_PROFILES; otherwise
 * respects deviceClass, saveData, prefersReducedMotion, and platform (ios/android/desktop/tablet).
 */
function getOptimizationProfile() {
  var p = platform;
  var saveData = !!(p.connection && p.connection.saveData);
  var reducedMotion = !!p.prefersReducedMotion;

  if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
    applyBenchmarkToPlatform();
    var platformType = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function')
      ? window.DeviceBenchmark.getPlatformTypeCached()
      : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
    var tier = window.DeviceBenchmark.getPerformanceTier();
    var full = window.DeviceBenchmark.getFullProfile(platformType, tier, { saveData: saveData, prefersReducedMotion: reducedMotion });
    var capAndroidBench = typeof window !== 'undefined' && isRianellCapacitorAndroid();
    return {
      deviceClass: full.deviceClass || p.deviceClass || 'medium',
      llmModelSize: full.llmModelSize != null ? full.llmModelSize : (full.deviceClass === 'low' ? 'tier2' : full.deviceClass === 'high' ? 'tier4' : 'tier3'),
      chartMaxPoints: full.chartMaxPoints != null ? full.chartMaxPoints : 80,
      chartAnimation: full.chartAnimation != null ? full.chartAnimation : !reducedMotion,
      enableChartPreload: full.enableChartPreload != null ? full.enableChartPreload : true,
      chartPreloadDelayMs: full.chartPreloadDelayMs != null ? full.chartPreloadDelayMs : 1200,
      enableAIPreload: capAndroidBench ? false : (full.enableAIPreload != null ? full.enableAIPreload : !saveData),
      aiPreloadDelayMs: full.aiPreloadDelayMs != null ? full.aiPreloadDelayMs : 1500,
      domCacheTtlMs: full.domCacheTtlMs != null ? full.domCacheTtlMs : 30000,
      storageBatchDelayMs: full.storageBatchDelayMs != null ? full.storageBatchDelayMs : 100,
      lazyChartStaggerMs: full.lazyChartStaggerMs != null ? full.lazyChartStaggerMs : 80,
      reduceUIAnimations: full.reduceUIAnimations != null ? full.reduceUIAnimations : reducedMotion,
      saveData: full.saveData != null ? full.saveData : saveData,
      useWorkers: full.useWorkers != null ? full.useWorkers : false
    };
  }

  var deviceClass = p.deviceClass || 'medium';
  var isLow = deviceClass === 'low';
  var isHigh = deviceClass === 'high';
  var isTablet = p.isTablet;
  var plat = p.platform || 'desktop';

  var chartMaxPoints = 80;
  if (isLow) chartMaxPoints = 24;
  else if (isHigh) chartMaxPoints = 200;
  else if (isTablet || plat === 'ios' || plat === 'android') chartMaxPoints = 100;

  var chartAnimation = !reducedMotion && !isLow;

  var enableChartPreload = true;
  var chartPreloadDelayMs = 1200;
  if (saveData) {
    enableChartPreload = false;
  } else if (isLow) {
    chartPreloadDelayMs = 3500;
    enableChartPreload = true;
  } else if (isHigh) {
    chartPreloadDelayMs = 600;
  }

  var effectiveType = (p.connection && p.connection.effectiveType) ? String(p.connection.effectiveType).toLowerCase() : '';
  var slowConnection = saveData || effectiveType === '2g';
  var capAndroid = typeof window !== 'undefined' && isRianellCapacitorAndroid();
  var enableAIPreload = !isLow && !slowConnection && !capAndroid;
  var aiPreloadDelayMs = isLow ? 4000 : isHigh ? 800 : 1500;
  if (slowConnection && aiPreloadDelayMs < 4000) aiPreloadDelayMs = 4000;
  if (capAndroid) {
    enableAIPreload = false;
    aiPreloadDelayMs = Math.max(aiPreloadDelayMs, 8000);
  }

  var domCacheTtlMs = 30000;
  if (isLow) domCacheTtlMs = 45000;
  else if (isHigh) domCacheTtlMs = 20000;

  var storageBatchDelayMs = 100;
  if (isLow) storageBatchDelayMs = 200;

  var lazyChartStaggerMs = 80;
  if (isLow) lazyChartStaggerMs = 150;
  else if (isHigh) lazyChartStaggerMs = 40;

  var reduceUIAnimations = reducedMotion || isLow;
  var useWorkers = (p.hardwareConcurrency || 0) >= 2 && !saveData;

  return {
    deviceClass: deviceClass,
    llmModelSize: isLow ? 'tier2' : isHigh ? 'tier4' : 'tier3',
    chartMaxPoints: chartMaxPoints,
    chartAnimation: chartAnimation,
    enableChartPreload: enableChartPreload,
    chartPreloadDelayMs: chartPreloadDelayMs,
    enableAIPreload: enableAIPreload,
    aiPreloadDelayMs: aiPreloadDelayMs,
    domCacheTtlMs: domCacheTtlMs,
    storageBatchDelayMs: storageBatchDelayMs,
    lazyChartStaggerMs: lazyChartStaggerMs,
    reduceUIAnimations: reduceUIAnimations,
    saveData: saveData,
    useWorkers: useWorkers
  };
}

/**
 * Device-based optimization flags for the rest of the app.
 * When DeviceBenchmark is ready, uses expansive profile; else from platform.deviceClass and prefersReducedMotion.
 * @returns {{ reduceAnimations: boolean, maxChartPoints: number, deferAI: boolean, batchDOM: boolean }}
 */
function getDeviceOpts() {
  var p = platform;
  if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
    applyBenchmarkToPlatform();
    var platformType = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function')
      ? window.DeviceBenchmark.getPlatformTypeCached()
      : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
    var tier = window.DeviceBenchmark.getPerformanceTier();
    var full = window.DeviceBenchmark.getFullProfile(platformType, tier, { saveData: !!(p.connection && p.connection.saveData), prefersReducedMotion: !!p.prefersReducedMotion });
    var capAndroidOpts = typeof window !== 'undefined' && isRianellCapacitorAndroid();
    return {
      reduceAnimations: full.reduceAnimations != null ? full.reduceAnimations : !!(p.prefersReducedMotion || (full.deviceClass === 'low')),
      maxChartPoints: full.maxChartPoints != null ? full.maxChartPoints : 100,
      deferAI: capAndroidOpts || (full.deferAI != null ? full.deferAI : (full.deviceClass === 'low')),
      batchDOM: capAndroidOpts || (full.batchDOM != null ? full.batchDOM : (full.deviceClass === 'low'))
    };
  }
  var deviceClass = p.deviceClass || 'medium';
  var reduceAnimations = !!(p.prefersReducedMotion || deviceClass === 'low');
  var maxChartPoints = deviceClass === 'low' ? 30 : deviceClass === 'medium' ? 120 : 200;
  var capAndroidFallback = typeof window !== 'undefined' && isRianellCapacitorAndroid();
  return {
    reduceAnimations: reduceAnimations,
    maxChartPoints: maxChartPoints,
    deferAI: capAndroidFallback || deviceClass === 'low',
    batchDOM: capAndroidFallback || deviceClass === 'low'
  };
}

// ============================================
// Export
// ============================================

if (typeof window !== 'undefined') {
  var profile = getOptimizationProfile();
  DOMCache._cacheTimeout = profile.domCacheTtlMs;
  StorageBatcher._delay = profile.storageBatchDelayMs;

  window.PerformanceUtils = {
    DOMCache,
    debounce,
    throttle,
    DataCache,
    domBatcher,
    filterMap,
    memoizedSort,
    lazyLoadScript,
    ensureApexChartsLoaded,
    ensureAIEngineLoaded,
    ensureExportUtilsLoaded,
    ensureImportUtilsLoaded,
    ensurePrintUtilsLoaded,
    eventManager,
    PerformanceMonitor,
    StorageBatcher,
    getDevicePerformanceClass,
    getOptimizationProfile,
    getDeviceOpts,
    getDeviceId,
    platform,
    applyBenchmarkToPlatform,
    isRianellCapacitorAndroid
  };
  window.PlatformCapabilities = platform;
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    eventManager.cleanup();
    StorageBatcher.flush();
    DataCache.cleanup();
    DOMCache.clear();
  });
  
  // Periodic cleanup (limit memory growth). Do not clear DOMCache here - it defeats hot-path caching.
  setInterval(function () {
    DataCache.cleanup();
    if (PerformanceMonitor.marks && PerformanceMonitor.marks.size > 20) {
      PerformanceMonitor.marks.clear();
    }
  }, 60000);
}
