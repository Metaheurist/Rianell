// ============================================
// Performance Optimization Utilities
// ============================================

/**
 * Performance optimization utilities for the Health App
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
// Data Processing Optimization
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
// Export
// ============================================

if (typeof window !== 'undefined') {
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
    StorageBatcher
  };
  
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
