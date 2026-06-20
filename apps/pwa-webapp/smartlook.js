/**
 * Smartlook session recording — consent-gated (PWA).
 * Project key and EU region from Smartlook dashboard (mobile + web).
 */
(function (global) {
  'use strict';

  var PROJECT_KEY = 'c205987c47aef0b2da2a93569620b15a81bef013';
  var REGION = 'eu';
  var SDK_URL = 'https://web-sdk.smartlook.com/recorder.js';
  var scriptLoading = false;
  var initialized = false;

  function getSettings() {
    return (global.appSettings && typeof global.appSettings === 'object') ? global.appSettings : {};
  }

  function shouldRecord() {
    var s = getSettings();
    if (s.demoMode) return false;
    if (s.localOnlyMode) return false;
    if (s.sessionRecording !== true) return false;
    if (global.RianellPrivacy && typeof global.RianellPrivacy.checkFeature === 'function') {
      var check = global.RianellPrivacy.checkFeature('sessionRecording');
      if (check && check.available === false) return false;
    }
    return true;
  }

  function ensureSdkLoaded(done) {
    if (typeof global.smartlook === 'function') {
      done();
      return;
    }
    if (scriptLoading) {
      var wait = setInterval(function () {
        if (typeof global.smartlook === 'function') {
          clearInterval(wait);
          done();
        }
      }, 50);
      return;
    }
    scriptLoading = true;
    global.smartlook = global.smartlook || function () {
      (global.smartlook.api = global.smartlook.api || []).push(arguments);
    };
    global.smartlook.api = global.smartlook.api || [];
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = SDK_URL;
    script.onload = function () { scriptLoading = false; done(); };
    script.onerror = function () { scriptLoading = false; };
    head.appendChild(script);
  }

  function pauseRecording() {
    if (!initialized || typeof global.smartlook !== 'function') return;
    try { global.smartlook('pause'); } catch (e) {}
  }

  function resumeRecording() {
    if (!initialized || typeof global.smartlook !== 'function') return;
    try { global.smartlook('resume'); } catch (e) {}
  }

  function applySessionRecording() {
    if (!shouldRecord()) {
      pauseRecording();
      return;
    }
    ensureSdkLoaded(function () {
      if (!initialized) {
        try {
          global.smartlook('init', PROJECT_KEY, { region: REGION });
          initialized = true;
        } catch (e) {
          console.warn('[Rianell] Smartlook init failed', e);
          return;
        }
      } else {
        resumeRecording();
      }
    });
  }

  global.RianellSmartlook = {
    apply: applySessionRecording,
    shouldRecord: shouldRecord,
  };
})(typeof window !== 'undefined' ? window : globalThis);
