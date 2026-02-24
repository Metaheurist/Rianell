// ============================================
// DEVICE MODULE
// Single source of truth for device class, platform capabilities, and optional device id for cache partitioning.
// Load before performance-utils.js. Used by performance-utils, summary-llm, background-loader, app.js.
// ============================================

(function () {
  'use strict';

  /**
   * Returns device performance tier: 'low' | 'medium' | 'high'.
   * Prefer more resources: relaxed thresholds so mobile/desktop/compiled app use more processing.
   * Compiled app (Capacitor) is treated as at least 'medium'.
   */
  function getDevicePerformanceClass() {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var deviceMemory = nav.deviceMemory;
    var cores = nav.hardwareConcurrency;
    var isSecure = typeof window !== 'undefined' && window.isSecureContext === true;
    var cap = (typeof window !== 'undefined' && window.Capacitor) || (typeof window !== 'undefined' && window.parent && window.parent.Capacitor);
    var isNativeApp = cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();

    if (isSecure && typeof deviceMemory === 'number' && deviceMemory > 0) {
      if (deviceMemory <= 2) return isNativeApp ? 'medium' : 'low';
      if (deviceMemory >= 4) return 'high';
      return 'medium';
    }
    if (typeof cores === 'number' && cores > 0) {
      if (cores <= 2) return isNativeApp ? 'medium' : 'low';
      if (cores >= 4) return 'high';
      return 'medium';
    }
    var ua = nav.userAgent || '';
    var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (nav.maxTouchPoints && nav.maxTouchPoints > 1);
    if (mobile || isNativeApp) return 'medium';
    return 'medium';
  }

  /**
   * Platform and capabilities object, computed once.
   */
  var platform = (function () {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var ua = nav.userAgent || '';
    var platformName = 'desktop';
    if (/iPad|iPhone|iPod/.test(ua)) platformName = 'ios';
    else if (/Android/i.test(ua)) platformName = 'android';

    var connection = null;
    if (nav.connection && typeof nav.connection === 'object') {
      connection = { effectiveType: nav.connection.effectiveType, saveData: !!nav.connection.saveData };
    }

    var win = typeof window !== 'undefined' ? window : null;
    var isStandalone = !!(win && (win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone));
    var prefersReducedMotion = !!(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

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

  /**
   * Returns a stable string for cache partitioning (e.g. per device tier). No PII.
   * Hash of deviceClass + hardwareConcurrency + screen + connection type.
   */
  function getDeviceId() {
    var p = platform;
    var deviceClass = p.deviceClass || 'medium';
    var cores = (p.hardwareConcurrency || 0).toString();
    var screen = (p.screenWidth || 0) + 'x' + (p.screenHeight || 0);
    var conn = (p.connection && p.connection.effectiveType) ? String(p.connection.effectiveType) : '';
    var str = deviceClass + '|' + cores + '|' + screen + '|' + conn;
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
  }

  if (typeof window !== 'undefined') {
    window.DeviceModule = {
      getDevicePerformanceClass: getDevicePerformanceClass,
      platform: platform,
      getDeviceId: getDeviceId
    };
  }
})();
