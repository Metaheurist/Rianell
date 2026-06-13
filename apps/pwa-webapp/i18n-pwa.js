/**
 * PWA i18n runtime — loads locale-packs from /locale-packs/v1/ and exposes t().
 */
(function (global) {
  'use strict';
  var S = global.RianellShared || {};
  var catalogs = {};
  var activeLocale = 'en-GB';
  var loadPromise = null;

  function mergeCatalog(locale, data) {
    if (data) catalogs[locale] = data;
  }

  function loadLocale(locale) {
    if (catalogs[locale]) return Promise.resolve(catalogs[locale]);
    return fetch('locale-packs/v1/' + encodeURIComponent(locale) + '.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        mergeCatalog(locale, data);
        return data;
      })
      .catch(function () { return null; });
  }

  function ensureCatalogs(locale) {
    var chain = typeof S.localeFallbackChain === 'function' ? S.localeFallbackChain(locale) : [locale, 'en-GB'];
    var tasks = chain.filter(function (loc) { return !catalogs[loc]; }).map(loadLocale);
    if (!tasks.length) return Promise.resolve();
    if (!loadPromise) loadPromise = Promise.all(tasks).finally(function () { loadPromise = null; });
    return loadPromise;
  }

  function setLocale(locale, prefs) {
    activeLocale = typeof S.resolveActiveLocale === 'function'
      ? S.resolveActiveLocale(Object.assign({}, prefs || {}, { uiLocale: locale }))
      : locale || 'en-GB';
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

  function applyDocumentI18n() {
    hydrateGate();
    hydratePrivacySettings();
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
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

  global.RianellI18n = {
    t: t,
    setLocale: setLocale,
    getLocale: function () { return activeLocale; },
    ensureCatalogs: ensureCatalogs,
    applyDocumentI18n: function () {
      applyDocumentI18n();
      global.applyNavI18n();
    },
    hydrateGate: hydrateGate,
    hydratePrivacySettings: hydratePrivacySettings,
  };
})(typeof window !== 'undefined' ? window : globalThis);
