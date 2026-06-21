/**
 * Unified first-run onboarding wizard (PWA).
 * Combines region, consents, tracking profile, tutorial, AI download, and install into one modal.
 */
(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var I = global.RianellI18n || {};
  var active = false;
  var stepIndex = 0;
  var plan = [];
  var _tutorialContentHome = null;
  var _focusTrapTeardown = null;

  function t(key, params) {
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return typeof I.t === 'function' ? I.t(key, params) : key;
  }

  function readPrefs() {
    var prefs = {};
    try {
      if (global.RianellPrivacy && typeof global.RianellPrivacy.readSettings === 'function') {
        prefs = global.RianellPrivacy.readSettings() || {};
      } else {
        var raw = localStorage.getItem(S.SETTINGS_STORAGE_KEY || 'rianellSettings');
        prefs = raw ? JSON.parse(raw) : {};
      }
    } catch (e) {
      prefs = {};
    }
    if (global.appSettings && typeof global.appSettings === 'object') {
      prefs = Object.assign({}, prefs, global.appSettings);
    }
    prefs.tutorialSeen = prefs.tutorialSeen === true;
    try {
      if (localStorage.getItem('rianellTutorialSeen')) prefs.tutorialSeen = true;
    } catch (e2) {}
    try {
      if (localStorage.getItem('rianellCookieConsent')) prefs.cookieConsent = true;
    } catch (e3) {}
    return prefs;
  }

  function writePrefs(patch) {
    if (global.RianellPrivacy && typeof global.RianellPrivacy.writeSettings === 'function') {
      global.RianellPrivacy.writeSettings(patch);
    } else {
      try {
        var cur = readPrefs();
        localStorage.setItem(S.SETTINGS_STORAGE_KEY || 'rianellSettings', JSON.stringify(Object.assign({}, cur, patch)));
      } catch (e) {}
    }
    if (global.appSettings) Object.assign(global.appSettings, patch);
  }

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

  function isComplete() {
    if (typeof S.isFirstRunWizardComplete !== 'function') return true;
    return S.isFirstRunWizardComplete(readPrefs(), platformContext());
  }

  function shouldDeferRegionGate() {
    return !isComplete();
  }

  function shouldSuppressStandaloneModals() {
    return !isComplete();
  }

  function rebuildPlan() {
    if (typeof S.buildFirstRunPlan !== 'function') return [];
    return S.buildFirstRunPlan(readPrefs(), platformContext());
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function overlayEl() {
    return document.getElementById('firstRunWizardOverlay');
  }

  function setStepMeta() {
    var titleEl = document.getElementById('firstRunWizardTitle');
    var metaEl = document.getElementById('firstRunWizardStepMeta');
    var step = plan[stepIndex];
    if (!step) return;
    var meta = S.FIRST_RUN_STEP_META && S.FIRST_RUN_STEP_META[step.id];
    if (titleEl) titleEl.textContent = meta && meta.titleKey ? t(meta.titleKey) : step.id;
    if (metaEl) metaEl.textContent = t('onboarding.stepCounter', { current: stepIndex + 1, total: plan.length });
  }

  function showFooter(show) {
    var footer = document.getElementById('firstRunWizardFooter');
    if (footer) footer.style.display = show ? 'flex' : 'none';
  }

  function renderRegionStep(body) {
    var pack = S.getPolicyPack ? S.getPolicyPack() : null;
    var labels = S.getRegionLabels ? S.getRegionLabels(pack) : [];
    var hint = S.suggestPrivacyRegionFromHint
      ? S.suggestPrivacyRegionFromHint(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone)
      : 'eea_uk';
    if (!hint || !labels.some(function (r) { return r.id === hint; })) hint = 'eea_uk';
    body.innerHTML =
      '<p class="first-run-wizard-lead">' + escapeHtml(t('gate.lead')) + '</p>' +
      '<p class="privacy-region-gate-hint">' + escapeHtml(t('gate.hint')) + '</p>' +
      '<label for="firstRunWizardRegionSelect" class="privacy-region-gate-label">' + escapeHtml(t('gate.regionLabel')) + '</label>' +
      '<select id="firstRunWizardRegionSelect" class="privacy-region-gate-select">' +
      labels.map(function (r) {
        return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.label) + '</option>';
      }).join('') +
      '</select>' +
      '<button type="button" class="modal-save-btn modal-cancel-btn first-run-wizard-inline-btn" id="firstRunWizardViewPolicies">' +
      escapeHtml(t('gate.viewPolicies')) + '</button>';
    var sel = document.getElementById('firstRunWizardRegionSelect');
    if (sel) sel.value = hint;
    var viewBtn = document.getElementById('firstRunWizardViewPolicies');
    if (viewBtn) {
      viewBtn.onclick = function () {
        var regionId = sel ? sel.value : hint;
        if (global.RianellPrivacy && typeof global.RianellPrivacy.showPolicyViewerModal === 'function') {
          global.RianellPrivacy.showPolicyViewerModal(regionId, true);
        }
      };
    }
    showFooter(true);
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    if (continueBtn) continueBtn.textContent = t('gate.confirm');
  }

  function renderHealthConsentStep(body) {
    body.innerHTML =
      '<div class="health-data-consent-body">' +
      '<p>' + escapeHtml(t('common.consent.healthDataBody')) + '</p>' +
      '<p>' + escapeHtml(t('common.consent.healthDataContact')) + '</p>' +
      '</div>';
    showFooter(true);
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (continueBtn) continueBtn.textContent = t('common.i.agree.continue');
    if (backBtn) backBtn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
  }

  function renderCookiesStep(body) {
    body.innerHTML =
      '<p class="first-run-wizard-lead">' + escapeHtml(t('common.cookie.bannerText')) + '</p>' +
      '<button type="button" class="modal-save-btn modal-cancel-btn first-run-wizard-inline-btn" id="firstRunWizardCookiePolicy">' +
      escapeHtml(t('common.cookie.policy')) + '</button>';
    var policyBtn = document.getElementById('firstRunWizardCookiePolicy');
    if (policyBtn && typeof global.openCookiePolicyModal === 'function') {
      policyBtn.onclick = function () { global.openCookiePolicyModal(); };
    }
    showFooter(true);
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    if (continueBtn) continueBtn.textContent = t('common.accept');
  }

  function renderTrackingProfileStep(body) {
    var profile = S.normalizeTrackingProfile
      ? S.normalizeTrackingProfile(readPrefs().trackingProfile)
      : { condition: '', fields: { mood: true, pain: true, notes: true, sleep: false, fatigue: false } };
    var keys = S.TRACKING_PROFILE_FIELD_KEYS || ['mood', 'pain', 'notes', 'sleep', 'fatigue'];
    body.innerHTML =
      '<p class="first-run-wizard-lead">' + escapeHtml(t('settings.trackingProfile.lead')) + '</p>' +
      '<p class="first-run-wizard-lead">' + escapeHtml(t('progressiveDisclosure.lead')) + '</p>' +
      '<label class="privacy-region-gate-label" for="firstRunWizardCondition">' + escapeHtml(t('common.medical.condition')) + '</label>' +
      '<input type="text" id="firstRunWizardCondition" class="item-input first-run-wizard-input" placeholder="' + escapeHtml(t('common.enter.your.condition')) + '" value="' + escapeHtml(profile.condition || readPrefs().medicalCondition || '') + '" />' +
      '<p class="privacy-region-gate-label" style="margin-top:12px;">' + escapeHtml(t('settings.trackingProfile.fieldsLabel')) + '</p>' +
      keys.map(function (key) {
        var checked = profile.fields && profile.fields[key] ? ' checked' : '';
        return '<label class="first-run-wizard-toggle-row"><span>' + escapeHtml(t('settings.trackingProfile.field.' + key)) + '</span>' +
          '<input type="checkbox" data-tracking-field="' + key + '"' + checked + ' /></label>';
      }).join('');
    showFooter(true);
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    if (continueBtn) continueBtn.textContent = t('common.continue');
  }

  function mountTutorialStep(body) {
    body.innerHTML = '';
    showFooter(false);
    var mount = document.getElementById('firstRunWizardTutorialMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'firstRunWizardTutorialMount';
      mount.className = 'first-run-wizard-tutorial-mount';
      body.appendChild(mount);
    }
    mount.style.display = 'block';
    var tutorialContent = document.querySelector('#tutorialModalOverlay .tutorial-modal-content');
    if (tutorialContent && !mount.contains(tutorialContent)) {
      _tutorialContentHome = tutorialContent.parentElement;
      mount.appendChild(tutorialContent);
    }
    var closeBtn = tutorialContent && tutorialContent.querySelector('.modal-close');
    if (closeBtn) closeBtn.style.display = 'none';
    if (typeof global.showTutorialSlide === 'function') global.showTutorialSlide(0);
    if (typeof global.updateTutorialConditionDisplay === 'function') global.updateTutorialConditionDisplay();
  }

  function restoreTutorialContent() {
    var tutorialContent = document.querySelector('#firstRunWizardTutorialMount .tutorial-modal-content') ||
      document.querySelector('#tutorialModalOverlay .tutorial-modal-content');
    if (tutorialContent && _tutorialContentHome && ! _tutorialContentHome.contains(tutorialContent)) {
      _tutorialContentHome.appendChild(tutorialContent);
    }
    var closeBtn = tutorialContent && tutorialContent.querySelector('.modal-close');
    if (closeBtn) closeBtn.style.display = '';
    _tutorialContentHome = null;
  }

  function renderAiDownloadStep(body) {
    body.innerHTML =
      '<p class="first-run-wizard-lead">' + escapeHtml(t('common.download.on.device.ai.model')) + '</p>' +
      '<p>' + escapeHtml(t('onboarding.aiDownload.body')) + '</p>' +
      '<p class="settings-hint">' + escapeHtml(t('onboarding.aiDownload.hint')) + '</p>';
    showFooter(true);
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (continueBtn) continueBtn.textContent = t('common.download.now');
    if (backBtn) backBtn.textContent = t('common.not.now');
  }

  function renderInstallStep(body) {
    body.innerHTML = '';
    showFooter(true);
    var installContent = document.querySelector('#installModalOverlay .install-modal-content');
    if (installContent) {
      var clone = installContent.cloneNode(true);
      clone.querySelectorAll('.modal-close').forEach(function (el) { el.remove(); });
      clone.querySelectorAll('[onclick*="closeInstallModal"]').forEach(function (el) {
        el.removeAttribute('onclick');
      });
      body.appendChild(clone);
      if (typeof global.refreshBuildDownloadLinks === 'function') global.refreshBuildDownloadLinks();
    } else {
      body.innerHTML = '<p class="first-run-wizard-lead">' + escapeHtml(t('common.add.rianell.to.your.device.for.quick.acc')) + '</p>';
    }
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    if (continueBtn) continueBtn.textContent = t('common.continue');
  }

  function renderCurrentStep() {
    var body = document.getElementById('firstRunWizardBody');
    if (!body || !plan[stepIndex]) return;
    setStepMeta();
    var stepId = plan[stepIndex].id;
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (backBtn) backBtn.style.display = stepIndex > 0 && stepId !== 'tutorial' ? 'inline-block' : 'none';

    if (stepId === 'region') renderRegionStep(body);
    else if (stepId === 'healthConsent') renderHealthConsentStep(body);
    else if (stepId === 'cookies') renderCookiesStep(body);
    else if (stepId === 'trackingProfile') renderTrackingProfileStep(body);
    else if (stepId === 'tutorial') mountTutorialStep(body);
    else if (stepId === 'aiDownload') renderAiDownloadStep(body);
    else if (stepId === 'install') renderInstallStep(body);
  }

  function confirmRegionStep() {
    var sel = document.getElementById('firstRunWizardRegionSelect');
    var selectedId = sel ? sel.value : 'eea_uk';
    if (global.RianellPrivacy && typeof global.RianellPrivacy.confirmRegionForWizard === 'function') {
      global.RianellPrivacy.confirmRegionForWizard(selectedId, 'onboarding');
    }
    plan = rebuildPlan();
    advanceStep();
  }

  function acceptHealthConsentStep() {
    if (typeof global.acceptHealthDataConsent === 'function') {
      global.acceptHealthDataConsent();
    } else {
      writePrefs({ healthDataConsent: true, healthDataConsentAt: new Date().toISOString() });
    }
    advanceStep();
  }

  function acceptCookiesStep() {
    if (typeof global.acceptCookieConsent === 'function') {
      global.acceptCookieConsent();
    } else {
      try {
        localStorage.setItem('rianellCookieConsent', 'accepted');
        localStorage.setItem('rianellCookieConsentAcceptedAt', new Date().toISOString());
      } catch (e) {}
      writePrefs({ cookieConsent: true, cookieConsentAt: new Date().toISOString() });
    }
    advanceStep();
  }

  function saveTrackingProfileStep() {
    var conditionEl = document.getElementById('firstRunWizardCondition');
    var condition = conditionEl ? String(conditionEl.value || '').trim().slice(0, 200) : '';
    var fields = S.getDefaultTrackingProfileFields ? S.getDefaultTrackingProfileFields() : { mood: true, pain: true, notes: true, sleep: false, fatigue: false };
    document.querySelectorAll('[data-tracking-field]').forEach(function (el) {
      var key = el.getAttribute('data-tracking-field');
      if (key && fields.hasOwnProperty(key)) fields[key] = el.checked;
    });
    var profile = S.normalizeTrackingProfile
      ? S.normalizeTrackingProfile({ condition: condition, fields: fields, configuredAt: new Date().toISOString() })
      : { condition: condition, fields: fields, configuredAt: new Date().toISOString() };
    writePrefs({ trackingProfile: profile, medicalCondition: condition || readPrefs().medicalCondition });
    advanceStep();
  }

  function handleAiDownloadStep(downloadNow) {
    if (downloadNow) {
      if (typeof global.grantAiModelDownloadConsent === 'function') global.grantAiModelDownloadConsent();
      else writePrefs({ aiModelDownloadConsent: 'granted', aiModelDownloadConsentAt: new Date().toISOString() });
    } else {
      if (typeof global.deferAiModelDownloadConsent === 'function') global.deferAiModelDownloadConsent();
      else writePrefs({ aiModelDownloadConsent: 'deferred' });
    }
    advanceStep();
  }

  function completeInstallStep() {
    try { localStorage.setItem('rianellInstallModalAfterTutorialSeen', '1'); } catch (e) {}
    advanceStep();
  }

  function onContinue() {
    var step = plan[stepIndex];
    if (!step) return;
    if (step.id === 'region') confirmRegionStep();
    else if (step.id === 'healthConsent') acceptHealthConsentStep();
    else if (step.id === 'cookies') acceptCookiesStep();
    else if (step.id === 'trackingProfile') saveTrackingProfileStep();
    else if (step.id === 'aiDownload') handleAiDownloadStep(true);
    else if (step.id === 'install') completeInstallStep();
  }

  function onBack() {
    var step = plan[stepIndex];
    if (step && step.id === 'aiDownload') {
      handleAiDownloadStep(false);
      return;
    }
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderCurrentStep();
    }
  }

  function advanceStep() {
    if (stepIndex >= plan.length - 1) {
      closeWizard(true);
      return;
    }
    stepIndex += 1;
    renderCurrentStep();
  }

  function onTutorialFinished() {
    restoreTutorialContent();
    try { localStorage.setItem('rianellTutorialSeen', '1'); } catch (e) {}
    writePrefs({ tutorialSeen: true });
    plan = rebuildPlan();
    var tutorialIdx = -1;
    for (var i = 0; i < plan.length; i++) {
      if (plan[i].id === 'tutorial') { tutorialIdx = i; break; }
    }
    if (tutorialIdx >= 0 && tutorialIdx < plan.length - 1) {
      stepIndex = tutorialIdx + 1;
      renderCurrentStep();
    } else {
      closeWizard(true);
    }
  }

  function openWizard() {
    if (active || isComplete()) return false;
    plan = rebuildPlan();
    if (!plan.length) {
      closeWizard(true);
      return false;
    }
    stepIndex = 0;
    active = true;
    var overlay = overlayEl();
    if (!overlay) return false;
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.classList.add('modal-active', 'first-run-wizard-active');
    renderCurrentStep();
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (continueBtn && !continueBtn.dataset.bound) {
      continueBtn.dataset.bound = '1';
      continueBtn.addEventListener('click', onContinue);
    }
    if (backBtn && !backBtn.dataset.bound) {
      backBtn.dataset.bound = '1';
      backBtn.addEventListener('click', onBack);
    }
    if (typeof global.installModalFocusTrap === 'function') {
      _focusTrapTeardown = global.installModalFocusTrap(overlay, { onEscape: function () {} });
    }
    return true;
  }

  function closeWizard(completed) {
    restoreTutorialContent();
    active = false;
    var overlay = overlayEl();
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
    }
    document.body.classList.remove('first-run-wizard-active');
    if (!document.querySelector('.modal-overlay[style*="display: block"], .modal-overlay--open')) {
      document.body.classList.remove('modal-active');
    }
    if (_focusTrapTeardown) {
      try { _focusTrapTeardown(); } catch (e) {}
      _focusTrapTeardown = null;
    }
    if (completed) {
      var prefs = readPrefs();
      if (typeof S.completeFirstRunWizard === 'function') {
        prefs = S.completeFirstRunWizard(prefs);
      } else {
        prefs.firstRunWizardCompletedAt = new Date().toISOString();
        prefs.tutorialSeen = true;
      }
      if (typeof S.migrateFirstRunWizardPrefs === 'function') {
        prefs = S.migrateFirstRunWizardPrefs(prefs, platformContext());
      }
      writePrefs(prefs);
      try { localStorage.setItem('rianellTutorialSeen', '1'); } catch (e2) {}
      if (typeof global.onFirstRunWizardComplete === 'function') global.onFirstRunWizardComplete();
    }
  }

  function openIfNeeded() {
    if (isComplete()) return false;
    return openWizard();
  }

  global.RianellFirstRunWizard = {
    isActive: function () { return active; },
    isComplete: isComplete,
    shouldDeferRegionGate: shouldDeferRegionGate,
    shouldSuppressStandaloneModals: shouldSuppressStandaloneModals,
    openIfNeeded: openIfNeeded,
    onTutorialFinished: onTutorialFinished,
    advanceFromTutorial: onTutorialFinished,
  };
})(typeof window !== 'undefined' ? window : globalThis);
