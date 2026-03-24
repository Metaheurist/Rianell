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
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-module.js", "anonymous", arguments) : undefined;
  try {
    function getDevicePerformanceClass() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-module.js", "getDevicePerformanceClass", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var deviceMemory = nav.deviceMemory;
        var cores = nav.hardwareConcurrency;
        var isSecure = typeof window !== 'undefined' && window.isSecureContext === true;
        var cap = typeof window !== 'undefined' && window.Capacitor || typeof window !== 'undefined' && window.parent && window.parent.Capacitor;
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
        var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || nav.maxTouchPoints && nav.maxTouchPoints > 1;
        if (mobile || isNativeApp) return 'medium';
        return 'medium';
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * When deviceMemory is missing (e.g. iOS), estimate a bucket from device type, OS, cores.
     */
    function getEstimatedMemoryBucket(platformName, isTablet, cores, osName, osVersion, deviceType) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-module.js", "getEstimatedMemoryBucket", arguments) : undefined;
      try {
        if (isTablet) return 'high';
        if (platformName === 'ios') {
          var major = 0;
          if (osVersion) {
            var parts = String(osVersion).split('.');
            if (parts.length) major = parseInt(parts[0], 10) || 0;
          }
          if (major > 0 && major < 14) return 'low';
          return 'medium';
        }
        if (platformName === 'android') {
          if (typeof cores === 'number' && cores > 0) {
            if (cores < 4) return 'low';
            if (cores <= 6) return 'medium';
            return 'high';
          }
          return 'medium';
        }
        if (platformName === 'desktop') {
          if (typeof cores === 'number' && cores > 0) {
            if (cores <= 2) return 'low';
            if (cores <= 4) return 'medium';
            return 'high';
          }
          return 'medium';
        }
        return 'medium';
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Platform and capabilities object, computed once.
     * If UAParser is available, adds osName, osVersion, deviceType, deviceVendor, deviceModel, cpuArchitecture.
     * Exposes cores, deviceMemory (when in secure context), and estimatedMemoryBucket when deviceMemory is missing.
     */
    var platform = function () {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-module.js", "anonymous", arguments) : undefined;
      try {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var ua = nav.userAgent || '';
        var platformName = 'desktop';
        if (/iPad|iPhone|iPod/.test(ua)) platformName = 'ios';else if (/Android/i.test(ua)) platformName = 'android';
        var osName = '';
        var osVersion = '';
        var deviceType = '';
        var deviceVendor = '';
        var deviceModel = '';
        var cpuArchitecture = '';
        if (typeof window !== 'undefined' && window.UAParser) {
          try {
            var parsed = new window.UAParser().getResult();
            if (parsed && parsed.os) {
              osName = parsed.os.name && String(parsed.os.name) || '';
              osVersion = parsed.os.version && String(parsed.os.version) || '';
            }
            if (parsed && parsed.device) {
              deviceType = parsed.device.type && String(parsed.device.type) || '';
              deviceVendor = parsed.device.vendor && String(parsed.device.vendor) || '';
              deviceModel = parsed.device.model && String(parsed.device.model) || '';
            }
            if (parsed && parsed.cpu && parsed.cpu.architecture) {
              cpuArchitecture = String(parsed.cpu.architecture);
            }
          } catch (e) {}
        }
        var connection = null;
        if (nav.connection && typeof nav.connection === 'object') {
          connection = {
            effectiveType: nav.connection.effectiveType,
            saveData: !!nav.connection.saveData
          };
        }
        var win = typeof window !== 'undefined' ? window : null;
        var isStandalone = !!(win && (win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone));
        var prefersReducedMotion = !!(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
        var w = (win && win.innerWidth) != null ? win.innerWidth : 0;
        var h = (win && win.innerHeight) != null ? win.innerHeight : 0;
        var isTouch = !!(nav.maxTouchPoints && nav.maxTouchPoints > 0);
        var isTablet = isTouch && Math.min(w, h) >= 600 && (Math.max(w, h) <= 1280 || /iPad|Android(?!.*Mobile)|Tablet/i.test(ua));
        var hardwareConcurrency = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 ? nav.hardwareConcurrency : 0;
        var isSecure = typeof window !== 'undefined' && window.isSecureContext === true;
        var deviceMemory = isSecure && typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 ? nav.deviceMemory : null;
        var estimatedMemoryBucket = null;
        if (deviceMemory == null) {
          var dt = deviceType || (isTablet ? 'tablet' : '');
          estimatedMemoryBucket = getEstimatedMemoryBucket(platformName, isTablet, hardwareConcurrency, osName, osVersion, dt);
        }
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
          hardwareConcurrency: hardwareConcurrency,
          cores: hardwareConcurrency,
          deviceMemory: deviceMemory,
          estimatedMemoryBucket: estimatedMemoryBucket,
          osName: osName,
          osVersion: osVersion,
          deviceType: deviceType,
          deviceVendor: deviceVendor,
          deviceModel: deviceModel,
          cpuArchitecture: cpuArchitecture
        };
      } finally {
        __rianellTraceExit(__rt);
      }
    }();

    /**
     * Returns a stable string for cache partitioning (e.g. per device tier). No PII.
     * Hash of deviceClass + hardwareConcurrency + screen + connection type.
     */
    function getDeviceId() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("device-module.js", "getDeviceId", arguments) : undefined;
      try {
        var p = platform;
        var deviceClass = p.deviceClass || 'medium';
        var cores = (p.hardwareConcurrency || 0).toString();
        var screen = (p.screenWidth || 0) + 'x' + (p.screenHeight || 0);
        var conn = p.connection && p.connection.effectiveType ? String(p.connection.effectiveType) : '';
        var str = deviceClass + '|' + cores + '|' + screen + '|' + conn;
        var h = 5381;
        for (var i = 0; i < str.length; i++) {
          h = (h << 5) + h + str.charCodeAt(i);
        }
        return (h >>> 0).toString(36);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    if (typeof window !== 'undefined') {
      window.DeviceModule = {
        getDevicePerformanceClass: getDevicePerformanceClass,
        platform: platform,
        getDeviceId: getDeviceId
      };
    }
  } finally {
    __rianellTraceExit(__rt);
  }
})();