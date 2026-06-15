/**
 * PWA i18n runtime — loads locale packs from /i18n-packs/locale-packs/v1/ and exposes t().
 */
(function (global) {
  'use strict';
  var S = global.RianellShared || {};
  var catalogs = {};
  var activeLocale = 'en-GB';
  var loadPromise = null;
  var localeChangeListeners = [];
  var notifyingLocaleChange = false;

  function mergeCatalog(locale, data) {
    if (data) catalogs[locale] = data;
  }

  function loadLocale(locale) {
    if (catalogs[locale]) return Promise.resolve(catalogs[locale]);
    return fetch('i18n-packs/locale-packs/v1/' + encodeURIComponent(locale) + '.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        mergeCatalog(locale, data);
        return data;
      })
      .catch(function () { return null; });
  }

  function ensureCatalogs(locale) {
    var chain = typeof S.localeFallbackChain === 'function' ? S.localeFallbackChain(locale) : [locale, 'en-GB'];
    if (S.SHIPPED_LOCALES && S.SHIPPED_LOCALES.length) {
      chain = chain.filter(function (loc, idx, arr) {
        return S.SHIPPED_LOCALES.indexOf(loc) >= 0 && arr.indexOf(loc) === idx;
      });
    }
    if (chain.indexOf('en-GB') < 0) chain.push('en-GB');
    var tasks = chain.filter(function (loc) { return !catalogs[loc]; }).map(loadLocale);
    if (!tasks.length) return Promise.resolve();
    if (!loadPromise) loadPromise = Promise.all(tasks).finally(function () { loadPromise = null; });
    return loadPromise;
  }

  function applyDocumentDirection(locale) {
    var dir = typeof S.textDirection === 'function' ? S.textDirection(locale) : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale || 'en-GB');
  }

  function notifyLocaleChange() {
    if (notifyingLocaleChange) return;
    notifyingLocaleChange = true;
    try {
      localeChangeListeners.forEach(function (fn) {
        try { fn(activeLocale); } catch (e) { /* ignore */ }
      });
    } finally {
      notifyingLocaleChange = false;
    }
  }

  function setLocale(locale, prefs) {
    activeLocale = typeof S.resolveActiveLocale === 'function'
      ? S.resolveActiveLocale(Object.assign({}, prefs || {}, { uiLocale: locale }))
      : locale || 'en-GB';
    applyDocumentDirection(activeLocale);
    return ensureCatalogs(activeLocale);
  }

  function t(key, params) {
    if (typeof S.t === 'function') return S.t(key, activeLocale, catalogs, params);
    return key;
  }

  function hydrateGate() {
    var map = {
      privacyRegionGateTitle: 'gate.title',
      privacyRegionGateConfirm: 'gate.confirm',
      privacyRegionGateViewPolicies: 'gate.viewPolicies',
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = t(map[id]);
    });
    var lead = document.querySelector('#privacyRegionGateOverlay .privacy-region-gate-lead');
    if (lead) lead.textContent = t('gate.lead');
    var label = document.querySelector('label[for="privacyRegionGateSelect"]');
    if (label) label.textContent = t('gate.regionLabel');
    var hint = document.getElementById('privacyRegionGateHint');
    if (hint) hint.textContent = t('gate.hint');
  }

  function hydratePrivacySettings() {
    var pane = document.getElementById('privacyRegionSettingsPane');
    if (!pane) return;
    var h4 = pane.querySelector('h4');
    if (h4) h4.textContent = t('settings.privacy.title');
    var regionLbl = pane.querySelector('label[for="privacyRegionSettingsSelect"]');
    if (regionLbl) regionLbl.textContent = t('settings.privacy.regionLabel');
    var langLbl = pane.querySelector('label[for="privacyUiLocaleSelect"]');
    if (langLbl) langLbl.textContent = t('settings.privacy.languageLabel');
    var storageLbl = pane.querySelector('#privacyStorageLabel');
    if (storageLbl) storageLbl.textContent = t('settings.privacy.storageLabel');
    var note = pane.querySelector('#privacyStorageNote');
    if (note) note.textContent = t('settings.privacy.storageNote');
    var viewBtn = document.getElementById('privacyRegionViewPoliciesBtn');
    if (viewBtn) viewBtn.textContent = t('settings.privacy.viewPolicies');
    var gdprBtn = document.getElementById('privacyRegionGdprBtn');
    if (gdprBtn) gdprBtn.textContent = t('settings.privacy.gdprConsent');
  }

  function applyDataI18nAttributes() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key) el.setAttribute('title', t(key));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
  }

  function applyDocumentI18n() {
    hydrateGate();
    hydratePrivacySettings();
    if (typeof global !== 'undefined' && global.__rianellAppInitStarted) {
      applyDataI18nAttributes();
      var settingsOpen = document.getElementById('settingsOverlay');
      if (settingsOpen && (settingsOpen.classList.contains('settings-overlay--open') || settingsOpen.style.display === 'block') && typeof global.settingsCarouselGo === 'function') {
        var track = document.getElementById('settingsCarouselTrack');
        var idx = track ? parseInt(track.getAttribute('data-settings-index') || '0', 10) : 0;
        global.settingsCarouselGo(idx);
      }
    }
  }

  global.applyNavI18n = function () {
    var navMap = {
      'nav.home': document.querySelectorAll('[data-tab="home"] .tab-text'),
      'nav.logs': document.querySelectorAll('[data-tab="logs"] .tab-text'),
      'nav.charts': document.querySelectorAll('[data-tab="charts"] .tab-text'),
      'nav.ai': document.querySelectorAll('[data-tab="ai"] .tab-text'),
    };
    Object.keys(navMap).forEach(function (key) {
      navMap[key].forEach(function (el) { el.textContent = t(key); });
    });
  };

  function refreshLocaleUI() {
    applyDocumentI18n();
    global.applyNavI18n();
    if (typeof global.refreshAllTabsForLocaleChange === 'function') {
      try { global.refreshAllTabsForLocaleChange(); } catch (e) { /* ignore */ }
    }
    notifyLocaleChange();
  }

  global.RianellI18n = {
    t: t,
    setLocale: setLocale,
    getLocale: function () { return activeLocale; },
    ensureCatalogs: ensureCatalogs,
    applyDocumentI18n: applyDocumentI18n,
    refreshLocaleUI: refreshLocaleUI,
    onLocaleChange: function (fn) {
      if (typeof fn === 'function') localeChangeListeners.push(fn);
    },
    hydrateGate: hydrateGate,
    hydratePrivacySettings: hydratePrivacySettings,
  };
})(typeof window !== 'undefined' ? window : globalThis);
