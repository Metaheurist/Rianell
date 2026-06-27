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

  function readEnforcementPrefs() {
    var prefs = readSettings();
    if (global.appSettings && typeof global.appSettings === 'object') {
      prefs = Object.assign({}, prefs, global.appSettings);
    }
    try {
      if (localStorage.getItem('rianellCookieConsent')) prefs.cookieConsent = true;
    } catch (e) {}
    try {
      if (localStorage.getItem('rianellTutorialSeen')) prefs.tutorialSeen = true;
    } catch (e2) {}
    return prefs;
  }

  function getPrivacyFields() {
    var s = readEnforcementPrefs();
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

  function isFirstRunWizardActive() {
    return !!(global.RianellFirstRunWizard &&
      typeof global.RianellFirstRunWizard.isActive === 'function' &&
      global.RianellFirstRunWizard.isActive());
  }

  function isOnboardingInteractionTarget(target) {
    if (!target || !target.closest) return false;
    if (isFirstRunWizardActive()) return true;
    return !!target.closest(
      '#privacyRegionGateOverlay, #firstRunWizardOverlay, #firstRunWizardTutorialMount, ' +
      '#tutorialModalOverlay, #healthDataConsentOverlay, #cookieBanner, #perfBenchmarkOverlay'
    );
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
    var resolvedRegion = regionId || getPrivacyFields().privacyRegion || 'other';
    var settingsSelect = document.getElementById('privacyRegionSettingsSelect');
    if (settingsSelect && settingsSelect.value) resolvedRegion = settingsSelect.value;
    var docs = typeof S.getPolicyDocumentsForRegion === 'function'
      ? S.getPolicyDocumentsForRegion(resolvedRegion)
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
      return;
    }
    if (typeof global.open === 'function') {
      global.open('privacy.html', '_blank', 'noopener,noreferrer');
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
    syncConsentEnforcement('confirmRegionForWizard');
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
  var gateOverlayTemplate = null;
  var consentEnforcementStarted = false;

  function platformContext() {
    var standalone = false;
    try {
      standalone = !!(global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) || !!global.navigator.standalone;
    } catch (e) {}
    var installSeen = false;
    var cookieAccepted = false;
    var tutorialLegacy = false;
    try { installSeen = !!localStorage.getItem('rianellInstallModalAfterTutorialSeen'); } catch (e2) {}
    try { cookieAccepted = !!localStorage.getItem('rianellCookieConsent'); } catch (e3) {}
    try { tutorialLegacy = !!localStorage.getItem('rianellTutorialSeen'); } catch (e4) {}
    return {
      platform: 'pwa',
      cookieConsentAccepted: cookieAccepted,
      installModalSeen: installSeen,
      standalonePwa: standalone,
      tutorialSeenLegacy: tutorialLegacy,
    };
  }

  function getBlockReason() {
    if (typeof S.getConsentBlockReason === 'function') {
      return S.getConsentBlockReason(readEnforcementPrefs(), platformContext());
    }
    return isConfigured() ? null : 'region-unconfigured';
  }

  function isUnlocked() {
    if (typeof S.isHealthLoggingUnlocked === 'function') {
      return S.isHealthLoggingUnlocked(readEnforcementPrefs(), platformContext());
    }
    return isConfigured();
  }

  function lockAppChrome() {
    if (!document.body) return;
    document.body.classList.add('consent-locked', 'privacy-gate-active');
    ['appShell', 'appFabWrap', 'app-mobile-bottom-chrome'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        try { el.setAttribute('inert', ''); } catch (e) { /* ignore */ }
        el.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function unlockAppChrome() {
    if (getBlockReason()) return;
    if (!document.body) return;
    document.body.classList.remove('consent-locked', 'privacy-gate-active');
    ['appShell', 'appFabWrap', 'app-mobile-bottom-chrome'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        try { el.removeAttribute('inert'); } catch (e) { /* ignore */ }
        el.removeAttribute('aria-hidden');
      }
    });
  }

  function ensureGateOverlayElement() {
    var overlay = document.getElementById('privacyRegionGateOverlay');
    if (overlay) return overlay;
    if (!gateOverlayTemplate || !document.body) return null;
    var clone = gateOverlayTemplate.cloneNode(true);
    clone.id = 'privacyRegionGateOverlay';
    clone.style.display = 'none';
    document.body.appendChild(clone);
    gateUiBound = false;
    initGateUI();
    return clone;
  }

  function syncConsentEnforcement(source) {
    var reason = getBlockReason();
    if (!reason) {
      unlockAppChrome();
      logGateState('syncConsentEnforcement:unlocked', { source: source || '' });
      return;
    }
    lockAppChrome();
    logGateState('syncConsentEnforcement:locked', { source: source || '', reason: reason });
    if (reason === 'region-unconfigured') {
      if (!shouldDeferToFirstRunWizard()) {
        if (!gateVisible) showGate();
        else {
          var gate = ensureGateOverlayElement();
          if (gate) {
            gate.style.display = 'flex';
            gateVisible = true;
          }
        }
      } else if (global.RianellFirstRunWizard && typeof global.RianellFirstRunWizard.openIfNeeded === 'function') {
        global.RianellFirstRunWizard.openIfNeeded();
      }
    } else if (reason === 'missing-health-consent') {
      if (
        !(global.RianellFirstRunWizard && global.RianellFirstRunWizard.shouldSuppressStandaloneModals &&
          global.RianellFirstRunWizard.shouldSuppressStandaloneModals()) &&
        typeof global.showHealthDataConsentModal === 'function'
      ) {
        global.showHealthDataConsentModal(function () {
          syncConsentEnforcement('health-consent-accepted');
        });
      }
    } else if (reason === 'first-run-incomplete') {
      if (global.RianellFirstRunWizard && typeof global.RianellFirstRunWizard.openIfNeeded === 'function') {
        global.RianellFirstRunWizard.openIfNeeded();
      }
    }
  }

  function requireUnlocked(source) {
    if (isUnlocked()) return true;
    syncConsentEnforcement(source || 'require');
    return false;
  }

  function onBlockedInteraction(event) {
    if (isUnlocked()) return;
    if (isOnboardingInteractionTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    syncConsentEnforcement('interaction-blocked');
  }

  function startConsentEnforcement() {
    if (consentEnforcementStarted || typeof document === 'undefined') return;
    consentEnforcementStarted = true;
    var initialGate = document.getElementById('privacyRegionGateOverlay');
    if (initialGate) gateOverlayTemplate = initialGate.cloneNode(true);

    document.addEventListener('click', onBlockedInteraction, true);
    document.addEventListener('pointerdown', onBlockedInteraction, true);
    document.addEventListener('keydown', function (event) {
      if (isUnlocked()) return;
      if (event.key === 'Tab' || event.key === 'Escape') return;
      if (isOnboardingInteractionTarget(event.target)) return;
      if (event.key.length === 1 || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopImmediatePropagation();
        syncConsentEnforcement('keydown-blocked');
      }
    }, true);

    if (typeof MutationObserver !== 'undefined' && document.body) {
      var observer = new MutationObserver(function () {
        if (isUnlocked()) return;
        var gate = document.getElementById('privacyRegionGateOverlay');
        if (!gate && !shouldDeferToFirstRunWizard()) {
          ensureGateOverlayElement();
          showGate();
          return;
        }
        if (gate && gateVisible && gate.style.display === 'none') {
          gate.style.display = 'flex';
        }
        if (!document.body.classList.contains('consent-locked')) {
          lockAppChrome();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'inert'] });
    }

    window.setInterval(function () {
      if (!isUnlocked()) syncConsentEnforcement('interval');
    }, 2000);

    syncConsentEnforcement('start');
  }

  function logGateState(phase, extra) {
    if (typeof console !== 'undefined' && console.log) {
      var payload = {
        phase: phase,
        gateVisible: gateVisible,
        privacyGate: !!(document.body && document.body.classList.contains('privacy-gate-active')),
        consentLocked: !!(document.body && document.body.classList.contains('consent-locked')),
        loaded: !!(document.body && document.body.classList.contains('loaded')),
        blockReason: getBlockReason(),
      };
      if (extra && typeof extra === 'object') {
        Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
      }
      console.log('[Rianell boot]', JSON.stringify(payload));
    }
    if (typeof global !== 'undefined') {
      global.__rianellBootLog = global.__rianellBootLog || [];
      global.__rianellBootLog.push({
        t: Date.now(),
        phase: phase,
        gateVisible: gateVisible,
        privacyGate: !!(document.body && document.body.classList.contains('privacy-gate-active')),
        consentLocked: !!(document.body && document.body.classList.contains('consent-locked')),
        loaded: !!(document.body && document.body.classList.contains('loaded')),
        blockReason: getBlockReason(),
      });
    }
  }

  function hidePrivacyGateOverlay() {
    gateVisible = false;
    var overlay = document.getElementById('privacyRegionGateOverlay');
    if (overlay) overlay.style.display = 'none';
    if (!getBlockReason()) {
      document.body.classList.remove('privacy-gate-active');
    }
    logGateState('hidePrivacyGateOverlay');
  }

  function unlockApp() {
    hidePrivacyGateOverlay();
    if (isUnlocked()) {
      unlockAppChrome();
      logGateState('unlockApp');
      var cbs = gateUnlockCallbacks.slice();
      gateUnlockCallbacks = [];
      cbs.forEach(function (cb) {
        try { cb(); } catch (e) { console.error(e); }
      });
    } else {
      syncConsentEnforcement('unlockApp-partial');
    }
  }

  function awaitGateReady(cb) {
    if (isUnlocked()) { cb(); return; }
    if (shouldDeferToFirstRunWizard()) {
      cb();
      return;
    }
    gateUnlockCallbacks.push(cb);
    syncConsentEnforcement('awaitGateReady');
  }

  function showGate() {
    gateVisible = true;
    initGateUI();
    lockAppChrome();
    logGateState('showGate');
    var overlay = ensureGateOverlayElement();
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
        startConsentEnforcement();
        if (!isConfigured()) {
          if (!shouldDeferToFirstRunWizard()) showGate();
          else logGateState('deferToFirstRunWizard');
        } else runDriftCheck();
      });
    } else {
      initGateUI();
      bindSettingsPane();
      startConsentEnforcement();
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
    isUnlocked: isUnlocked,
    getBlockReason: getBlockReason,
    requireUnlocked: requireUnlocked,
    syncConsentEnforcement: syncConsentEnforcement,
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
