/**
 * Platform and host detection (static host, service-worker hosts, native shell, orientation lock).
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

// ============================================
// Static host detection (no /api on this origin: skip reload stream and server logging)
// Only localhost / 127.0.0.1 run the Python dev server with /api/reload and /api/log.
// Production (e.g. rianell.com) must be treated as static so we do not GET /api/reload (404).
// ============================================
function isStaticHost() {
  try {
    const h = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname.toLowerCase() : '';
    if (!h) return true;
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return false;
    return true;
  } catch (e) {
    return true;
  }
}

/** Production hosts where the PWA service worker is enabled for updates (GitHub Pages + main site). */
function isRianellServiceWorkerHost() {
  try {
    var h = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname.toLowerCase() : '';
    if (!h) return false;
    if (h === 'rianell.com' || h === 'www.rianell.com') return true;
    if (h.slice(-10) === '.github.io') return true;
    return false;
  } catch (e) {
    return false;
  }
}

/** True when the optional static SW should register: prod PWA hosts, ?sw=1, or localStorage opt-in. */
function shouldEnableRianellServiceWorker() {
  try {
    if (typeof isRianellNativeApp === 'function' && isRianellNativeApp()) return false;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('rianellEnableStaticSW') === '1') return true;
    if (typeof location !== 'undefined' && /[?&]sw=1(?:&|$)/.test(location.search || '')) return true;
    return isRianellServiceWorkerHost();
  } catch (e) {
    return false;
  }
}

/** True when startup should not delete Cache Storage (SW manages caches). Sync with shouldEnableRianellServiceWorker. */
function rianellSwManagesCaches() {
  return shouldEnableRianellServiceWorker();
}

/** Rianell ships as a PWA only. Retained as a no-op so legacy guards keep working. */
function isRianellNativeApp() {
  return false;
}

/* First-paint: sync work here stays small (host detection, storage migration); charts/ML/export load via PerformanceUtils lazy loaders. */

/**
 * Mobile web / PWA: request portrait where Screen Orientation API allows (often needs user gesture).
 * Native Android/iOS shells use manifest / Info.plist; skip here to avoid redundant work.
 */
function tryLockPortraitOrientationMobile() {
  try {
    if (typeof isRianellNativeApp === 'function' && isRianellNativeApp()) return;
    if (typeof window === 'undefined' || typeof screen === 'undefined') return;
    var narrow = false;
    try {
      narrow = window.matchMedia('(max-width: 1024px)').matches;
    } catch (e) {}
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    var mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (!narrow && !mobileUa) return;
    var o = screen.orientation;
    if (!o || typeof o.lock !== 'function') return;
    var lock = function () {
      try {
        o.lock('portrait').catch(function () {});
      } catch (e) {}
    };
    lock();
    var once = function () {
      lock();
      document.removeEventListener('touchstart', once, true);
      document.removeEventListener('click', once, true);
    };
    document.addEventListener('touchstart', once, true);
    document.addEventListener('click', once, true);
  } catch (e) {}
}

export { isStaticHost, shouldEnableRianellServiceWorker, rianellSwManagesCaches, isRianellNativeApp, tryLockPortraitOrientationMobile };
