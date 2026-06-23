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
  var progressSession = null;

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

  function getActiveTutorialPos() {
    var activeSlide = document.querySelector('.tutorial-slide.tutorial-slide-active');
    if (!activeSlide) return 0;
    var idx = parseInt(activeSlide.dataset.slide, 10);
    var visible = getTutorialVisibleIndicesSafe();
    var pos = visible.indexOf(idx);
    return pos >= 0 ? pos : 0;
  }

  function setStepMeta() {
    var titleEl = document.getElementById('firstRunWizardTitle');
    var metaEl = document.getElementById('firstRunWizardStepMeta');
    var step = plan[stepIndex];
    if (!step) return;
    var meta = S.FIRST_RUN_STEP_META && S.FIRST_RUN_STEP_META[step.id];
    if (titleEl && step.id !== 'tutorial') {
      titleEl.textContent = meta && meta.titleKey ? t(meta.titleKey) : step.id;
    }
    if (metaEl && progressSession && typeof progressSession.resolve === 'function') {
      var prefs = readPrefs();
      var progress = progressSession.resolve({
        prefs: prefs,
        ctx: platformContext(),
        wizardStepId: step.id,
        tutorialPos: step.id === 'tutorial' ? getActiveTutorialPos() : undefined,
        tutorialSlideIndices: getTutorialVisibleIndicesSafe(),
      });
      metaEl.textContent = t('onboarding.stepCounter', {
        current: progress.current,
        total: progress.total,
      });
    } else if (metaEl && typeof S.resolveUnifiedOnboardingProgress === 'function') {
      var prefs = readPrefs();
      var progress = S.resolveUnifiedOnboardingProgress({
        prefs: prefs,
        ctx: platformContext(),
        wizardStepId: step.id,
        tutorialPos: step.id === 'tutorial' ? getActiveTutorialPos() : undefined,
        tutorialSlideIndices: getTutorialVisibleIndicesSafe(),
      });
      metaEl.textContent = t('onboarding.stepCounter', {
        current: progress.current,
        total: progress.total,
      });
    } else if (metaEl) {
      metaEl.textContent = t('onboarding.stepCounter', { current: stepIndex + 1, total: plan.length });
    }
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

  function renderSessionRecordingStep(body) {
    var prefs = readPrefs();
    var enabled = prefs.sessionRecording !== false;
    body.innerHTML =
      '<p class="first-run-wizard-lead">' + escapeHtml(t('onboarding.sessionRecording.body')) + '</p>' +
      '<div class="settings-option first-run-wizard-toggle-row">' +
      '<label for="firstRunWizardSessionRecordingToggle">' + escapeHtml(t('onboarding.sessionRecording.toggleLabel')) + '</label>' +
      '<div class="toggle-switch' + (enabled ? ' active' : '') + '" id="firstRunWizardSessionRecordingToggle" role="switch" aria-checked="' + (enabled ? 'true' : 'false') + '" tabindex="0"></div>' +
      '</div>' +
      '<p class="settings-hint">' + escapeHtml(t('settings.privacy.sessionRecording.hint')) + '</p>';
    showFooter(true);
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    if (continueBtn) continueBtn.textContent = t('common.continue');
    var toggle = document.getElementById('firstRunWizardSessionRecordingToggle');
    if (toggle && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', toggleFirstRunSessionRecording);
      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFirstRunSessionRecording();
        }
      });
    }
  }

  function toggleFirstRunSessionRecording() {
    var toggle = document.getElementById('firstRunWizardSessionRecordingToggle');
    if (!toggle) return;
    var next = !toggle.classList.contains('active');
    toggle.classList.toggle('active', next);
    toggle.setAttribute('aria-checked', next ? 'true' : 'false');
  }

  function confirmSessionRecordingStep() {
    var toggle = document.getElementById('firstRunWizardSessionRecordingToggle');
    var enabled = toggle ? toggle.classList.contains('active') : readPrefs().sessionRecording !== false;
    var now = new Date().toISOString();
    writePrefs({
      sessionRecording: enabled,
      sessionRecordingAt: enabled ? now : null,
      sessionRecordingDisclosureAt: now,
    });
    if (typeof global.RianellSmartlook && typeof global.RianellSmartlook.apply === 'function') {
      global.RianellSmartlook.apply();
    }
    if (typeof global.loadSettingsState === 'function') global.loadSettingsState();
    advanceStep();
  }

  global.toggleFirstRunSessionRecording = toggleFirstRunSessionRecording;

  function getTutorialVisibleIndicesSafe() {
    if (typeof global.getTutorialVisibleIndices === 'function') return global.getTutorialVisibleIndices();
    if (typeof S.getTutorialVisibleIndices === 'function') {
      var prefs = readPrefs();
      return S.getTutorialVisibleIndices(prefs.aiEnabled !== false);
    }
    return [0, 1, 8, 2, 3, 4, 5, 6, 7];
  }

  function syncTutorialWizardFooter() {
    if (!active || !plan[stepIndex] || plan[stepIndex].id !== 'tutorial') return;
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (!continueBtn) return;

    var activeSlide = document.querySelector('.tutorial-slide.tutorial-slide-active');
    var idx = activeSlide ? parseInt(activeSlide.dataset.slide, 10) : 0;
    var visible = getTutorialVisibleIndicesSafe();
    var pos = visible.indexOf(idx);
    var isLast = pos >= 0 && pos === visible.length - 1;
    var isSlide0 = idx === 0;

    continueBtn.style.display = isSlide0 ? 'none' : 'inline-block';
    if (!isSlide0) continueBtn.textContent = isLast ? t('common.finish') : t('common.next');

    if (backBtn) {
      backBtn.style.display = 'inline-block';
      backBtn.textContent = t('common.skip.for.now');
    }

    var titleEl = document.getElementById('firstRunWizardTitle');
    var tutorialTitle = document.getElementById('tutorialModalTitle');
    if (titleEl && tutorialTitle && tutorialTitle.textContent) {
      titleEl.textContent = tutorialTitle.textContent;
    }
    setStepMeta();
  }

  function mountTutorialStep(body) {
    body.innerHTML = '';
    showFooter(true);
    var mount = document.createElement('div');
    mount.id = 'firstRunWizardTutorialMount';
    mount.className = 'first-run-wizard-tutorial-mount';
    body.appendChild(mount);

    var slidesWrap = document.querySelector('#tutorialModalOverlay .tutorial-slides-wrap');
    if (slidesWrap && !mount.contains(slidesWrap)) {
      _tutorialContentHome = document.querySelector('#tutorialModalOverlay .tutorial-modal-content');
      mount.appendChild(slidesWrap);
    }

    if (typeof global.showTutorialSlide === 'function') global.showTutorialSlide(0);
    if (typeof global.updateTutorialConditionDisplay === 'function') global.updateTutorialConditionDisplay();
    syncTutorialWizardFooter();
  }

  function restoreTutorialContent() {
    var slidesWrap = document.querySelector('#firstRunWizardTutorialMount .tutorial-slides-wrap');
    if (slidesWrap && _tutorialContentHome && !_tutorialContentHome.contains(slidesWrap)) {
      var footer = _tutorialContentHome.querySelector('.tutorial-modal-footer');
      if (footer) _tutorialContentHome.insertBefore(slidesWrap, footer);
      else _tutorialContentHome.appendChild(slidesWrap);
    }
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
    var mount = document.createElement('div');
    mount.className = 'first-run-wizard-install-mount';
    body.appendChild(mount);
    var installBody = document.querySelector('#installModalOverlay .install-modal-content .modal-body');
    if (installBody) {
      var clone = installBody.cloneNode(true);
      clone.querySelectorAll('[onclick*="closeInstallModal"]').forEach(function (el) {
        var onclick = el.getAttribute('onclick') || '';
        el.setAttribute('onclick', onclick.replace(/closeInstallModal\(\);?\s*/g, ''));
      });
      mount.appendChild(clone);
      if (typeof global.refreshBuildDownloadLinks === 'function') global.refreshBuildDownloadLinks();
    } else {
      mount.innerHTML = '<p class="first-run-wizard-lead">' + escapeHtml(t('common.add.rianell.to.your.device.for.quick.acc')) + '</p>';
    }
    var continueBtn = document.getElementById('firstRunWizardContinueBtn');
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (continueBtn) continueBtn.textContent = t('common.skip.for.now');
    if (backBtn) backBtn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
  }

  function renderCurrentStep() {
    var body = document.getElementById('firstRunWizardBody');
    if (!body || !plan[stepIndex]) return;
    setStepMeta();
    var stepId = plan[stepIndex].id;
    var backBtn = document.getElementById('firstRunWizardBackBtn');
    if (backBtn && stepId !== 'tutorial') {
      backBtn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
      backBtn.textContent = t('common.back');
    }

    if (stepId === 'region') renderRegionStep(body);
    else if (stepId === 'healthConsent') renderHealthConsentStep(body);
    else if (stepId === 'cookies') renderCookiesStep(body);
    else if (stepId === 'sessionRecording') renderSessionRecordingStep(body);
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
    advanceFromStep('region');
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

  function advanceTutorialStep() {
    var activeSlide = document.querySelector('.tutorial-slide.tutorial-slide-active');
    var idx = activeSlide ? parseInt(activeSlide.dataset.slide, 10) : 0;
    var visible = getTutorialVisibleIndicesSafe();
    var pos = visible.indexOf(idx);
    if (pos >= 0 && pos < visible.length - 1) {
      if (typeof global.showTutorialSlide === 'function') global.showTutorialSlide(visible[pos + 1]);
      syncTutorialWizardFooter();
      return;
    }
    onTutorialFinished();
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
    else if (step.id === 'sessionRecording') confirmSessionRecordingStep();
    else if (step.id === 'tutorial') advanceTutorialStep();
    else if (step.id === 'aiDownload') handleAiDownloadStep(true);
    else if (step.id === 'install') completeInstallStep();
  }

  function onBack() {
    var step = plan[stepIndex];
    if (step && step.id === 'tutorial') {
      onTutorialFinished();
      return;
    }
    if (step && step.id === 'aiDownload') {
      handleAiDownloadStep(false);
      return;
    }
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderCurrentStep();
    }
  }

  function advanceFromStep(completedStepId) {
    plan = rebuildPlan();
    if (typeof S.resolveNextStepIndexAfterComplete === 'function') {
      stepIndex = S.resolveNextStepIndexAfterComplete(readPrefs(), platformContext(), completedStepId);
    } else if (stepIndex >= plan.length - 1) {
      closeWizard(true);
      return;
    } else {
      stepIndex += 1;
    }
    if (!plan.length || stepIndex >= plan.length) {
      closeWizard(true);
      return;
    }
    if (progressSession && typeof progressSession.refresh === 'function') {
      progressSession.refresh(readPrefs(), platformContext(), getTutorialVisibleIndicesSafe());
    }
    renderCurrentStep();
  }

  function advanceStep() {
    var completed = plan[stepIndex] && plan[stepIndex].id;
    if (completed) advanceFromStep(completed);
    else if (stepIndex >= plan.length - 1) closeWizard(true);
    else {
      stepIndex += 1;
      renderCurrentStep();
    }
  }

  function onTutorialFinished() {
    restoreTutorialContent();
    try { localStorage.setItem('rianellTutorialSeen', '1'); } catch (e) {}
    writePrefs({ tutorialSeen: true });
    advanceFromStep('tutorial');
  }

  function openWizard() {
    if (active || isComplete()) return false;
    plan = rebuildPlan();
    if (!plan.length) {
      closeWizard(true);
      return false;
    }
    if (typeof S.createOnboardingProgressSession === 'function') {
      progressSession = S.createOnboardingProgressSession(readPrefs(), platformContext(), {
        tutorialSlideIndices: getTutorialVisibleIndicesSafe(),
      });
    } else {
      progressSession = null;
    }
    stepIndex = 0;
    active = true;
    var overlay = overlayEl();
    if (!overlay) return false;
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.classList.add('modal-active', 'first-run-wizard-active');
    if (global.RianellPrivacy && typeof global.RianellPrivacy.syncConsentEnforcement === 'function') {
      global.RianellPrivacy.syncConsentEnforcement('first-run-open');
    }
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
    if (global.RianellPrivacy && typeof global.RianellPrivacy.syncConsentEnforcement === 'function') {
      global.RianellPrivacy.syncConsentEnforcement(completed ? 'first-run-complete' : 'first-run-closed');
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
    syncTutorialFooter: syncTutorialWizardFooter,
  };
})(typeof window !== 'undefined' ? window : globalThis);
