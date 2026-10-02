/**
 * Service worker registration and update handling, plus the long-task performance observer.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { isRianellNativeApp } from './platform.js';
import { Logger } from './logger.js';
import { showConfirmModal } from './modal-host.js';

// ============================================
// PWA Service Worker - rianell.com / *.github.io (or ?sw=1 / localStorage rianellEnableStaticSW=1)
// ============================================
function initRianellPwaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (typeof isRianellNativeApp === 'function' && isRianellNativeApp()) return;

  navigator.serviceWorker
    .register('sw.js', { updateViaCache: 'none' })
    .then(function (reg) {
      window.__rianellSwRegistration = reg;

      function promptUpdateIfNeeded() {
        if (!reg.waiting || !navigator.serviceWorker.controller) return;
        if (window.__rianellPwaUpdateModalShown) return;
        window.__rianellPwaUpdateModalShown = true;
        showConfirmModal(
          'A new version of Rianell is available. Update now to get the latest fixes and features. Your saved data on this device is kept.',
          'Update available',
          function () {
            window.__rianellPendingSwReload = true;
            try {
              if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch (e) {}
          },
          function () {
            window.__rianellPwaUpdateModalShown = false;
            try {
              var _cnt = parseInt(sessionStorage.getItem('rianellUpdateDismissCount') || '0', 10) + 1;
              sessionStorage.setItem('rianellUpdateDismissCount', String(_cnt));
              if (_cnt >= 3 && reg.waiting) {
                window.__rianellPendingSwReload = true;
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            } catch (_) {}
          },
          { confirmText: 'Update', cancelText: 'Later' }
        );
      }

      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            promptUpdateIfNeeded();
          }
        });
      });

      if (reg.waiting && navigator.serviceWorker.controller) {
        promptUpdateIfNeeded();
      }

      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
          reg.update().catch(function () {});
        }
      });
    })
    .catch(function (e) {
      Logger.debug('Service Worker registration failed', { error: e && e.message ? e.message : String(e) });
    });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!window.__rianellPendingSwReload) return;
    if (window.__rianellSwReloadGuard) return;
    window.__rianellSwReloadGuard = true;
    window.__rianellPendingSwReload = false;
    /* Short delay avoids iOS WKWebView reload races during skipWaiting handoff */
    setTimeout(function () {
      try {
        var reloadUrl = new URL(window.location.href);
        reloadUrl.searchParams.set('_sw', String(Date.now()));
        window.location.replace(reloadUrl.toString());
      } catch (e) {
        window.location.reload();
      }
    }, 80);
  });
}

function installPerfLongTaskObserver() {
  if (typeof PerformanceObserver === 'undefined') return;
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('rianellPerfLongTasks') !== '1' && !window.rianellDebug) return;
  try {
    var po = new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        if (window.console && console.warn) console.warn('[longtask]', Math.round(entries[i].duration) + 'ms');
      }
    });
    po.observe({ type: 'longtask', buffered: true });
  } catch (e) {}
}

export { initRianellPwaServiceWorker, installPerfLongTaskObserver };
