/**
 * Privacy region gate, settings helpers, policy viewer, and i18n hooks (PWA).
 */
(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var I = global.RianellI18n || {};
  var SETTINGS_KEY = S.SETTINGS_STORAGE_KEY || 'rianellSettings';

  function readSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeSettings(patch) {
    var cur = readSettings();
    var next = Object.assign({}, cur, patch);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    if (global.appSettings) Object.assign(global.appSettings, patch);
    return next;
  }

  function getPrivacyFields() {
    var s = readSettings();
    return {
      privacyRegion: s.privacyRegion || '',
      privacyRegionSource: s.privacyRegionSource || '',
      privacyRegionUpdatedAt: s.privacyRegionUpdatedAt || null,
      policyAcknowledgedVersion: s.policyAcknowledgedVersion || null,
      policyAcknowledgedAt: s.policyAcknowledgedAt || null,
      uiLocale: s.uiLocale || 'en-GB',
      uiLocaleSource: s.uiLocaleSource || '',
      uiLocaleUpdatedAt: s.uiLocaleUpdatedAt || null,
      dataResidencyCode: 'default',
      healthDataConsent: s.healthDataConsent === true,
      healthDataConsentAt: s.healthDataConsentAt || null,
    };
  }

  function t(key, params) {
    return typeof I.t === 'function' ? I.t(key, params) : key;
  }

  function refreshGateLocaleUI() {
    var prefs = readSettings();
    if (typeof I.setLocale === 'function') {
      return I.setLocale(prefs.uiLocale || 'en-GB', prefs).then(function () {
        if (typeof I.hydrateGate === 'function') I.hydrateGate();
      });
    }
    if (typeof I.hydrateGate === 'function') I.hydrateGate();
    return Promise.resolve();
  }

  function refreshSettingsPaneLocaleUI() {
    var prefs = readSettings();
    if (typeof I.setLocale === 'function') {
      return I.setLocale(prefs.uiLocale || 'en-GB', prefs).then(function () {
        if (typeof I.hydratePrivacySettings === 'function') I.hydratePrivacySettings();
      });
    }
    if (typeof I.hydratePrivacySettings === 'function') I.hydratePrivacySettings();
    return Promise.resolve();
  }

  function refreshLocaleUI() {
    var prefs = readSettings();
    if (typeof I.setLocale === 'function') {
      I.setLocale(prefs.uiLocale || 'en-GB', prefs).then(function () {
        if (typeof I.refreshLocaleUI === 'function') I.refreshLocaleUI();
      });
    } else if (typeof I.refreshLocaleUI === 'function') {
      I.refreshLocaleUI();
    }
  }

  function isConfigured() {
    return typeof S.isPrivacyRegionConfigured === 'function'
      ? S.isPrivacyRegionConfigured(getPrivacyFields())
      : !!(getPrivacyFields().privacyRegion);
  }

  function getActiveLocale() {
    if (typeof I.getLocale === 'function') return I.getLocale();
    return getPrivacyFields().uiLocale || 'en-GB';
  }

  function showPolicyViewerModal(regionId, readOnly) {
    var docs = typeof S.getPolicyDocumentsForRegion === 'function'
      ? S.getPolicyDocumentsForRegion(regionId || getPrivacyFields().privacyRegion || 'other')
      : [];
    var html = docs.map(function (d) {
      var title = t('policy.' + d.id + '.title');
      var summary = t('policy.' + d.id + '.summary');
      if (title === 'policy.' + d.id + '.title') title = d.title;
      if (summary === 'policy.' + d.id + '.summary') summary = d.summary;
      var bodyHtml = (d.body || []).map(function (para) {
        return '<p style="margin:0.5rem 0 0;line-height:1.45">' + escapeHtml(para) + '</p>';
      }).join('');
      return '<section style="margin-bottom:1rem"><h4 style="margin:0 0 0.35rem">' + escapeHtml(title) + '</h4><p style="margin:0;line-height:1.45">' + escapeHtml(summary) + '</p>' + bodyHtml + '</section>';
    }).join('');
    var locale = getActiveLocale();
    if (locale !== 'en-GB') {
      var notice = t('policy.machineTranslatedNotice');
      if (notice === 'policy.machineTranslatedNotice') {
        notice = 'This policy text was machine-translated. The English (UK) version is authoritative.';
      }
      var banner = '<div role="note" style="margin-bottom:1rem;padding:0.65rem 0.75rem;border-radius:8px;background:rgba(13,148,136,0.12);border:1px solid rgba(13,148,136,0.35);font-size:0.9rem;line-height:1.4">' + escapeHtml(notice) + '</div>';
      html = banner + html;
    }
    if (typeof global.showAlertModal === 'function') {
      global.showAlertModal(html || t('gate.policiesTitle'), t('gate.policiesTitle'), undefined, { html: true });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function confirmRegion(selectedId, source) {
    var now = new Date().toISOString();
    var prefs = readSettings();
    var pack = S.getPolicyPack ? S.getPolicyPack() : null;
    var merged = typeof S.applyRegionDefaultLocale === 'function'
      ? S.applyRegionDefaultLocale(Object.assign({}, prefs, {
          privacyRegion: selectedId,
          privacyRegionSource: source || 'onboarding',
          privacyRegionUpdatedAt: now,
          policyAcknowledgedVersion: (pack && pack.policyPackId) || 'v1.0.0',
          policyAcknowledgedAt: now,
        }), selectedId, pack)
      : Object.assign(prefs, { privacyRegion: selectedId, uiLocale: 'en-GB' });
    writeSettings(merged);
    refreshLocaleUI();
    if (selectedId === 'eea_uk' && !getPrivacyFields().healthDataConsent) {
      if (typeof global.showHealthDataConsentModal === 'function' && !(global.RianellFirstRunWizard && global.RianellFirstRunWizard.shouldSuppressStandaloneModals && global.RianellFirstRunWizard.shouldSuppressStandaloneModals())) {
        /* Drop privacy-gate-active before health consent; otherwise the shell stays visibility:hidden behind the modal. */
        hidePrivacyGateOverlay();
        global.showHealthDataConsentModal(function () { unlockApp(); });
        return;
      }
    }
    if (global.cloudSyncState && global.cloudSyncState.isAuthenticated && typeof global.upsertPrivacyProfile === 'function') {
      global.upsertPrivacyProfile().catch(function () {});
    }
    unlockApp();
  }

  function confirmRegionForWizard(selectedId, source) {
    var now = new Date().toISOString();
    var prefs = readSettings();
    var pack = S.getPolicyPack ? S.getPolicyPack() : null;
    var merged = typeof S.applyRegionDefaultLocale === 'function'
      ? S.applyRegionDefaultLocale(Object.assign({}, prefs, {
          privacyRegion: selectedId,
          privacyRegionSource: source || 'onboarding',
          privacyRegionUpdatedAt: now,
          policyAcknowledgedVersion: (pack && pack.policyPackId) || 'v1.0.0',
          policyAcknowledgedAt: now,
          uiLocaleSource: 'onboarding',
        }), selectedId, pack)
      : Object.assign(prefs, { privacyRegion: selectedId, uiLocale: 'en-GB' });
    writeSettings(merged);
    refreshLocaleUI();
    if (global.cloudSyncState && global.cloudSyncState.isAuthenticated && typeof global.upsertPrivacyProfile === 'function') {
      global.upsertPrivacyProfile().catch(function () {});
    }
    return merged;
  }

  function shouldDeferToFirstRunWizard() {
    return global.RianellFirstRunWizard &&
      typeof global.RianellFirstRunWizard.shouldDeferRegionGate === 'function' &&
      global.RianellFirstRunWizard.shouldDeferRegionGate();
  }

  var gateUnlockCallbacks = [];
  var gateVisible = false;
  var gateUiBound = false;

  function logGateState(phase) {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Rianell boot]', JSON.stringify({
        phase: phase,
        gateVisible: gateVisible,
        privacyGate: !!(document.body && document.body.classList.contains('privacy-gate-active')),
        loaded: !!(document.body && document.body.classList.contains('loaded')),
      }));
    }
    if (typeof global !== 'undefined') {
      global.__rianellBootLog = global.__rianellBootLog || [];
      global.__rianellBootLog.push({
        t: Date.now(),
        phase: phase,
        gateVisible: gateVisible,
        privacyGate: !!(document.body && document.body.classList.contains('privacy-gate-active')),
        loaded: !!(document.body && document.body.classList.contains('loaded')),
      });
    }
  }

  function hidePrivacyGateOverlay() {
    gateVisible = false;
    var overlay = document.getElementById('privacyRegionGateOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('privacy-gate-active');
    logGateState('hidePrivacyGateOverlay');
  }

  function unlockApp() {
    hidePrivacyGateOverlay();
    logGateState('unlockApp');
    var cbs = gateUnlockCallbacks.slice();
    gateUnlockCallbacks = [];
    cbs.forEach(function (cb) {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  function awaitGateReady(cb) {
    if (isConfigured()) { cb(); return; }
    if (shouldDeferToFirstRunWizard()) {
      cb();
      return;
    }
    gateUnlockCallbacks.push(cb);
    if (!gateVisible) showGate();
  }

  function showGate() {
    gateVisible = true;
    initGateUI();
    document.body.classList.add('privacy-gate-active');
    logGateState('showGate');
    var overlay = document.getElementById('privacyRegionGateOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    refreshGateLocaleUI();
    var select = document.getElementById('privacyRegionGateSelect');
    if (select && typeof S.getRegionLabels === 'function') {
      var labels = S.getRegionLabels(S.getPolicyPack ? S.getPolicyPack() : null);
      select.innerHTML = labels.map(function (r) {
        return '<option value="' + r.id + '">' + escapeHtml(r.label) + '</option>';
      }).join('');
      var hint = typeof S.suggestPrivacyRegionFromHint === 'function'
        ? S.suggestPrivacyRegionFromHint(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone)
        : 'eea_uk';
      if (!hint || !select.querySelector('option[value="' + hint + '"]')) hint = 'eea_uk';
      select.value = hint;
    }
  }

  function initGateUI() {
    if (gateUiBound) return;
    var btn = document.getElementById('privacyRegionGateConfirm');
    var viewBtn = document.getElementById('privacyRegionGateViewPolicies');
    var select = document.getElementById('privacyRegionGateSelect');
    if (btn && select) {
      gateUiBound = true;
      btn.addEventListener('click', function () { confirmRegion(select.value, 'onboarding'); });
    }
    if (viewBtn && select) {
      viewBtn.addEventListener('click', function () { showPolicyViewerModal(select.value, true); });
    }
  }

  function renderLanguageSelect() {
    var sel = document.getElementById('privacyUiLocaleSelect');
    if (!sel || typeof S.SHIPPED_LOCALES === 'undefined') return;
    var fields = getPrivacyFields();
    sel.innerHTML = S.SHIPPED_LOCALES.map(function (loc) {
      var label = typeof S.localeLabel === 'function' ? S.localeLabel(loc) : loc;
      return '<option value="' + loc + '"' + (fields.uiLocale === loc ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }

  function renderSettingsPane() {
    var pane = document.getElementById('privacyRegionSettingsPane');
    if (!pane) return;
    refreshSettingsPaneLocaleUI();
    var fields = getPrivacyFields();
    var select = pane.querySelector('#privacyRegionSettingsSelect');
    if (select && typeof S.getRegionLabels === 'function') {
      var labels = S.getRegionLabels(S.getPolicyPack ? S.getPolicyPack() : null);
      select.innerHTML = labels.map(function (r) {
        return '<option value="' + r.id + '"' + (r.id === fields.privacyRegion ? ' selected' : '') + '>' + escapeHtml(r.label) + '</option>';
      }).join('');
    }
    renderLanguageSelect();
    var badge = pane.querySelector('#privacyPolicyUpdateBadge');
    if (badge) badge.style.display = global.__privacyPolicyDrift ? 'inline' : 'none';
  }

  function bindSettingsPane() {
    var pane = document.getElementById('privacyRegionSettingsPane');
    if (!pane || pane.dataset.bound) return;
    pane.dataset.bound = '1';
    var select = pane.querySelector('#privacyRegionSettingsSelect');
    var langSelect = pane.querySelector('#privacyUiLocaleSelect');
    var viewBtn = pane.querySelector('#privacyRegionViewPoliciesBtn');
    var gdprBtn = pane.querySelector('#privacyRegionGdprBtn');
    if (select) {
      select.addEventListener('change', function () {
        var newId = select.value;
        var oldId = getPrivacyFields().privacyRegion;
        if (newId === oldId) return;
        var msg = t('settings.privacy.regionChangeBody');
        if (typeof global.showConfirmModal === 'function') {
          global.showConfirmModal(
            msg,
            t('settings.privacy.regionChangeTitle'),
            function () { applyRegionChange(newId); },
            function () { select.value = oldId; }
          );
        } else if (confirm(msg)) applyRegionChange(newId);
        else select.value = oldId;
      });
    }
    if (langSelect) {
      langSelect.addEventListener('change', function () {
        var loc = langSelect.value;
        writeSettings({ uiLocale: loc, uiLocaleSource: 'user', uiLocaleUpdatedAt: new Date().toISOString() });
        refreshLocaleUI();
        if (typeof global.showToast === 'function') global.showToast(t('settings.privacy.languageChanged'), 'info');
        if (global.cloudSyncState && global.cloudSyncState.isAuthenticated && typeof global.upsertPrivacyProfile === 'function') {
          global.upsertPrivacyProfile().catch(function () {});
        }
      });
    }
    if (viewBtn) viewBtn.addEventListener('click', function () { showPolicyViewerModal(getPrivacyFields().privacyRegion, false); });
    if (gdprBtn && typeof global.showGDPRAgreementModal === 'function') {
      gdprBtn.addEventListener('click', function () {
        global.showGDPRAgreementModal(function () { global.closeGDPRAgreementModal(); }, function () { global.closeGDPRAgreementModal(); });
      });
    }
    renderSettingsPane();
  }

  function applyRegionChange(newId) {
    var fields = getPrivacyFields();
    var prefs = readSettings();
    var pack = S.getPolicyPack ? S.getPolicyPack() : null;
    var base = typeof S.applyRegionDowngradeToggles === 'function'
      ? S.applyRegionDowngradeToggles(prefs, fields.privacyRegion, newId)
      : prefs;
    var merged = typeof S.applyRegionDefaultLocale === 'function'
      ? S.applyRegionDefaultLocale(Object.assign(base, {
          privacyRegion: newId,
          privacyRegionSource: 'user',
          privacyRegionUpdatedAt: new Date().toISOString(),
        }), newId, pack)
      : Object.assign(base, { privacyRegion: newId });
    writeSettings(merged);
    refreshLocaleUI();
    if (newId === 'eea_uk' && !getPrivacyFields().healthDataConsent && typeof global.showHealthDataConsentModal === 'function') {
      global.showHealthDataConsentModal(function () {});
    }
    if (global.cloudSyncState && global.cloudSyncState.isAuthenticated && typeof global.upsertPrivacyProfile === 'function') {
      global.upsertPrivacyProfile().catch(function () {});
    }
    renderSettingsPane();
  }

  function applyProfileFromCloud(profile, showToast) {
    if (!profile || typeof S.applyPrivacyProfileToLocal !== 'function') return;
    var prefs = readSettings();
    var hadRegion = prefs.privacyRegion;
    var hadLocale = prefs.uiLocale;
    var merged = S.applyPrivacyProfileToLocal(prefs, profile);
    writeSettings(merged);
    refreshLocaleUI();
    if (showToast && typeof global.showToast === 'function') {
      if (hadRegion && hadRegion !== merged.privacyRegion) global.showToast(t('settings.privacy.regionRestored'), 'info');
      if (hadLocale && hadLocale !== merged.uiLocale) global.showToast(t('settings.privacy.languageRestored'), 'info');
    }
    if (isConfigured()) unlockApp();
  }

  function checkFeature(featureKey) {
    var f = getPrivacyFields();
    var consents = typeof S.prefsToConsents === 'function' ? S.prefsToConsents(readSettings()) : {};
    if (typeof S.getFeatureAvailability !== 'function') return { available: true };
    return S.getFeatureAvailability(f.privacyRegion || 'other', featureKey, consents);
  }

  function runDriftCheck() {
    if (typeof S.checkPolicyDrift !== 'function') return Promise.resolve();
    var f = getPrivacyFields();
    return S.checkPolicyDrift(f.policyAcknowledgedVersion).then(function (result) {
      if (result && result.drift) {
        global.__privacyPolicyDrift = true;
        if (typeof global.showConfirmModal === 'function') {
          global.showConfirmModal(
            (result.changelog || t('modal.policyUpdateBody')) + ' ' + t('modal.policyUpdateAccept') + '?',
            t('modal.policyUpdateTitle'),
            function () { acknowledgePolicyUpdate(result.remoteVersion); },
            function () { declinePolicyUpdate(); }
          );
        }
        renderSettingsPane();
      }
    }).catch(function () {});
  }

  function acknowledgePolicyUpdate(version) {
    writeSettings({
      policyAcknowledgedVersion: version || (S.getPolicyPack && S.getPolicyPack().policyPackId) || 'v1.0.0',
      policyAcknowledgedAt: new Date().toISOString(),
    });
    global.__privacyPolicyDrift = false;
    renderSettingsPane();
    if (global.cloudSyncState && global.cloudSyncState.isAuthenticated && typeof global.upsertPrivacyProfile === 'function') {
      global.upsertPrivacyProfile().catch(function () {});
    }
  }

  function declinePolicyUpdate() {
    var prefs = readSettings();
    if (typeof S.applyRegionDowngradeToggles === 'function') {
      var downgraded = S.applyRegionDowngradeToggles(prefs, prefs.privacyRegion, prefs.privacyRegion || 'other');
      writeSettings(Object.assign(downgraded, { backup: false, contributeAnonData: false, aiEnabled: false }));
    } else {
      writeSettings({ backup: false, contributeAnonData: false, aiEnabled: false });
    }
    if (typeof global.showToast === 'function') global.showToast(t('toast.policyUpdate'), 'info');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var prefs = readSettings();
    if (typeof I.setLocale === 'function') {
      I.setLocale(prefs.uiLocale || 'en-GB', prefs).then(function () {
        initGateUI();
        bindSettingsPane();
        if (!isConfigured()) {
          if (!shouldDeferToFirstRunWizard()) showGate();
          else logGateState('deferToFirstRunWizard');
        } else runDriftCheck();
      });
    } else {
      initGateUI();
      bindSettingsPane();
      if (!isConfigured()) {
        if (!shouldDeferToFirstRunWizard()) showGate();
        else logGateState('deferToFirstRunWizard');
      } else runDriftCheck();
    }
  });

  global.RianellPrivacy = {
    readSettings: readSettings,
    writeSettings: writeSettings,
    getPrivacyFields: getPrivacyFields,
    isConfigured: isConfigured,
    awaitGateReady: awaitGateReady,
    confirmRegionForWizard: confirmRegionForWizard,
    showPolicyViewerModal: showPolicyViewerModal,
    applyProfileFromCloud: applyProfileFromCloud,
    renderSettingsPane: renderSettingsPane,
    bindSettingsPane: bindSettingsPane,
    checkFeature: checkFeature,
    runDriftCheck: runDriftCheck,
    refreshLocaleUI: refreshLocaleUI,
    acknowledgePolicyUpdate: acknowledgePolicyUpdate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
