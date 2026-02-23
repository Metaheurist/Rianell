// ============================================
// Performance Optimisation Utilities
// ============================================

/**
 * Performance optimisation utilities for the Health App
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
const DataCache = {
  _cache: new Map(),
  _cacheTime: new Map(),
  _defaultTTL: 60000, // 1 minute default
  
  /**
   * Get cached data or compute and cache
   */
  get(key, computeFn, ttl = this._defaultTTL) {
    const now = Date.now();
    const cached = this._cache.get(key);
    const cacheTime = this._cacheTime.get(key);
    
    if (cached && cacheTime && (now - cacheTime) < ttl) {
      return cached;
    }
    
    const result = computeFn();
    this._cache.set(key, result);
    this._cacheTime.set(key, now);
    return result;
  },
  
  /**
   * Invalidate cache
   */
  invalidate(key = null) {
    if (key) {
      this._cache.delete(key);
      this._cacheTime.delete(key);
    } else {
      this._cache.clear();
      this._cacheTime.clear();
    }
  },
  
  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, time] of this._cacheTime.entries()) {
      if ((now - time) > this._defaultTTL) {
        this._cache.delete(key);
        this._cacheTime.delete(key);
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
class DOMBatcher {
  constructor() {
    this.pendingUpdates = [];
    this.scheduled = false;
  }
  
  /**
   * Schedule a DOM update
   */
  schedule(updateFn) {
    this.pendingUpdates.push(updateFn);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  /**
   * Flush all pending updates
   */
  flush() {
    const updates = this.pendingUpdates.splice(0);
    this.scheduled = false;
    
    // Use DocumentFragment for better performance
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
    // Check if already loaded
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
// ============================================

/**
 * Returns device performance tier: 'low' | 'medium' | 'high'.
 * Used for per-platform optimisations (LLM lazy-load, chart point cap).
 */
function getDevicePerformanceClass() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const deviceMemory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  const isSecure = typeof window !== 'undefined' && window.isSecureContext === true;

  if (isSecure && typeof deviceMemory === 'number' && deviceMemory > 0) {
    if (deviceMemory <= 2) return 'low';
    if (deviceMemory >= 8) return 'high';
    return 'medium';
  }
  if (typeof cores === 'number' && cores > 0) {
    if (cores <= 2) return 'low';
    if (cores >= 6) return 'high';
    return 'medium';
  }
  const ua = nav.userAgent || '';
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (nav.maxTouchPoints && nav.maxTouchPoints > 1);
  if (mobile) return 'low';
  return 'medium';
}

/**
 * Platform and capabilities object, computed once.
 * Exposed as PerformanceUtils.platform for use by summary-llm, app.js charts, etc.
 */
const platform = (function () {
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
    isStandalone,
    prefersReducedMotion,
    connection: connection,
    screenWidth: w,
    screenHeight: h,
    hardwareConcurrency: hardwareConcurrency
  };
})();

/**
 * Single optimization profile per device/platform. Use this for charts, preload, DOM, storage.
 * Respects deviceClass, saveData, prefersReducedMotion, and platform (ios/android/desktop/tablet).
 */
function getOptimizationProfile() {
  var p = platform;
  var deviceClass = p.deviceClass || 'medium';
  var saveData = !!(p.connection && p.connection.saveData);
  var reducedMotion = p.prefersReducedMotion;
  var isLow = deviceClass === 'low';
  var isHigh = deviceClass === 'high';
  var isTablet = p.isTablet;
  var plat = p.platform || 'desktop';

  var chartMaxPoints = 50;
  if (isLow) chartMaxPoints = 24;
  else if (isTablet || plat === 'ios' || plat === 'android') chartMaxPoints = 40;

  var chartAnimation = !reducedMotion && !isLow;

  var enableChartPreload = true;
  var chartPreloadDelayMs = 1500;
  if (saveData) {
    enableChartPreload = false;
  } else if (isLow) {
    chartPreloadDelayMs = 3500;
    enableChartPreload = true;
  } else if (isHigh) {
    chartPreloadDelayMs = 800;
  }

  var effectiveType = (p.connection && p.connection.effectiveType) ? String(p.connection.effectiveType).toLowerCase() : '';
  var slowConnection = saveData || effectiveType === '2g';
  var enableAIPreload = !isLow && !slowConnection;
  var aiPreloadDelayMs = isLow ? 4000 : isHigh ? 1000 : 2000;
  if (slowConnection && aiPreloadDelayMs < 4000) aiPreloadDelayMs = 4000;

  var domCacheTtlMs = 30000;
  if (isLow) domCacheTtlMs = 45000;
  else if (isHigh) domCacheTtlMs = 20000;

  var storageBatchDelayMs = 100;
  if (isLow) storageBatchDelayMs = 200;

  var lazyChartStaggerMs = 80;
  if (isLow) lazyChartStaggerMs = 150;
  else if (isHigh) lazyChartStaggerMs = 40;

  var reduceUIAnimations = reducedMotion || isLow; // same as getDeviceOpts().reduceAnimations
  var useWorkers = (p.hardwareConcurrency || 0) >= 2 && !saveData;

  return {
    deviceClass: deviceClass,
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
 * Derived from platform.deviceClass and platform.prefersReducedMotion (single source of truth).
 * @returns {{ reduceAnimations: boolean, maxChartPoints: number, deferAI: boolean, batchDOM: boolean }}
 */
function getDeviceOpts() {
  var p = platform;
  var deviceClass = p.deviceClass || 'medium';
  var reduceAnimations = !!(p.prefersReducedMotion || deviceClass === 'low');
  var maxChartPoints = deviceClass === 'low' ? 30 : deviceClass === 'medium' ? 80 : 200;
  return {
    reduceAnimations: reduceAnimations,
    maxChartPoints: maxChartPoints,
    deferAI: deviceClass === 'low',
    batchDOM: deviceClass === 'low' || deviceClass === 'medium'
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
    eventManager,
    PerformanceMonitor,
    StorageBatcher,
    getDevicePerformanceClass,
    getOptimizationProfile,
    getDeviceOpts,
    platform
  };
  window.PlatformCapabilities = platform;
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    eventManager.cleanup();
    StorageBatcher.flush();
    DataCache.cleanup();
  });
  
  // Periodic cleanup
  setInterval(() => {
    DataCache.cleanup();
    DOMCache.clear(); // Clear DOM cache periodically
  }, 60000); // Every minute
}
