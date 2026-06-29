/**
 * Guided first-run onboarding questionnaire (PWA).
 * Friendly multichoice cards driven by @rianell/shared guidedQuestionnaire.
 */
(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var I = global.RianellI18n || {};
  var active = false;
  var cardIndex = 0;
  var cards = [];
  var regionPickerOpen = false;
  var reminderTimePickerOpen = false;
  var selectedRegion = '';
  var reminderTime = '09:00';
  var draftAppearanceMode = 'light';
  var draftGlobalTheme = 'mint';
  var draftProfileAvatar = '';
  var avatarPickMade = false;
  var _focusTrapTeardown = null;
  var progressSession = null;

  function t(key, params) {
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return typeof I.t === 'function' ? I.t(key, params) : key;
  }

  function ensureI18nReady() {
    var locale = typeof I.getLocale === 'function' ? I.getLocale() : 'en-GB';
    if (typeof I.ensureCatalogs === 'function') {
      return I.ensureCatalogs(locale);
    }
    return Promise.resolve();
  }

  function paintWizard() {
    renderCurrentCard();
    bindFooterOnce();
    if (typeof global.installModalFocusTrap === 'function') {
      _focusTrapTeardown = global.installModalFocusTrap(overlayEl(), { onEscape: function () {} });
    }
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

  function isCloudAuthenticated() {
    try {
      if (global.cloudSyncState && global.cloudSyncState.isAuthenticated) return true;
      var raw = localStorage.getItem('cloudSyncState');
      if (raw) {
        var parsed = JSON.parse(raw);
        return !!parsed.isAuthenticated;
      }
    } catch (e) {}
    return false;
  }

  function platformContext() {
    var standalone = false;
    try {
      standalone = !!(global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) || !!global.navigator.standalone;
    } catch (e) {}
    var installSeen = false;
    var cookieAccepted = false;
    try { installSeen = !!localStorage.getItem('rianellInstallModalAfterTutorialSeen'); } catch (e2) {}
    try { cookieAccepted = !!localStorage.getItem('rianellCookieConsent'); } catch (e3) {}
    return {
      platform: 'pwa',
      cookieConsentAccepted: cookieAccepted,
      installModalSeen: installSeen,
      standalonePwa: standalone,
      tutorialSeenLegacy: false,
      isAuthenticated: isCloudAuthenticated(),
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
    if (active) return true;
    return !isComplete();
  }

  function applyLiveAppearancePreview() {
    if (typeof global.setAppearanceMode === 'function') {
      global.setAppearanceMode(draftAppearanceMode);
    }
    if (typeof global.setGlobalTheme === 'function') {
      global.setGlobalTheme(draftGlobalTheme);
    }
  }

  function renderThemeChoiceButton(themeId, labelKey) {
    var active = draftGlobalTheme === themeId;
    return (
      '<button type="button" class="settings-theme-choice guided-onboarding-theme-choice' +
      (active ? ' settings-theme-choice--active' : '') +
      ' settings-theme-choice--' + themeId + '" data-theme-id="' + escapeHtml(themeId) + '" role="radio" aria-checked="' +
      (active ? 'true' : 'false') + '">' +
      '<span class="settings-theme-choice__swatch" aria-hidden="true"></span>' +
      '<span class="settings-theme-choice__label">' + escapeHtml(t(labelKey)) + '</span>' +
      '</button>'
    );
  }

  function renderAppearanceCard(card, body, footer, continueBtn, backBtn, detailsBtn, hint) {
    var illus = '<div class="guided-onboarding-illus-wrap guided-onboarding-illus-wrap--sparkle" aria-hidden="true">' +
      illustrationIcon(card.illustration) + '</div>';
    var preview =
      '<div class="guided-onboarding-theme-preview guided-onboarding-theme-preview--' + escapeHtml(draftAppearanceMode) +
      ' theme-' + escapeHtml(draftGlobalTheme) + '" data-preview="1" aria-hidden="true">' +
      '<div class="guided-onboarding-theme-preview__header"></div>' +
      '<div class="guided-onboarding-theme-preview__card">' +
      '<span class="guided-onboarding-theme-preview__line guided-onboarding-theme-preview__line--accent"></span>' +
      '<span class="guided-onboarding-theme-preview__line"></span>' +
      '<span class="guided-onboarding-theme-preview__line guided-onboarding-theme-preview__line--short"></span>' +
      '</div>' +
      '<span class="guided-onboarding-theme-preview__pill"></span>' +
      '</div>';
    var modeRow =
      '<div class="guided-onboarding-appearance-modes" role="radiogroup" aria-label="' + escapeHtml(t('onboarding.questionnaire.appearance.modeLabel')) + '">' +
      '<button type="button" class="guided-onboarding-mode-btn' + (draftAppearanceMode === 'light' ? ' guided-onboarding-mode-btn--active' : '') +
      '" data-appearance-mode="light" role="radio" aria-checked="' + (draftAppearanceMode === 'light' ? 'true' : 'false') + '">' +
      escapeHtml(t('onboarding.questionnaire.appearance.light')) + '</button>' +
      '<button type="button" class="guided-onboarding-mode-btn' + (draftAppearanceMode === 'dark' ? ' guided-onboarding-mode-btn--active' : '') +
      '" data-appearance-mode="dark" role="radio" aria-checked="' + (draftAppearanceMode === 'dark' ? 'true' : 'false') + '">' +
      escapeHtml(t('onboarding.questionnaire.appearance.dark')) + '</button>' +
      '</div>';
    var themeGrid =
      '<div class="settings-theme-grid guided-onboarding-theme-grid" role="radiogroup" aria-label="' + escapeHtml(t('onboarding.questionnaire.appearance.themeLabel')) + '">' +
      renderThemeChoiceButton('mint', 'common.mint') +
      renderThemeChoiceButton('red-black', 'common.red.black') +
      renderThemeChoiceButton('mono', 'common.black.white') +
      renderThemeChoiceButton('rainbow', 'common.rainbow') +
      '</div>';
    body.innerHTML = illus +
      '<p class="guided-onboarding-lead">' + escapeHtml(t(card.bodyKey)) + '</p>' +
      preview +
      '<p class="guided-onboarding-field-label">' + escapeHtml(t('onboarding.questionnaire.appearance.modeLabel')) + '</p>' +
      modeRow +
      '<p class="guided-onboarding-field-label">' + escapeHtml(t('onboarding.questionnaire.appearance.themeLabel')) + '</p>' +
      themeGrid + hint;
    bindAppearanceControls(body);
    if (footer) footer.style.display = 'flex';
    if (continueBtn) {
      continueBtn.textContent = t('onboarding.questionnaire.continue');
      continueBtn.style.display = 'inline-block';
    }
    if (backBtn) backBtn.style.visibility = cardIndex > 0 ? 'visible' : 'hidden';
    if (detailsBtn) detailsBtn.style.display = 'none';
  }

  function bindAppearanceControls(body) {
    if (!body) return;
    body.querySelectorAll('[data-appearance-mode]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        draftAppearanceMode = btn.getAttribute('data-appearance-mode') === 'dark' ? 'dark' : 'light';
        applyLiveAppearancePreview();
        renderCurrentCard();
      });
    });
    body.querySelectorAll('[data-theme-id]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        draftGlobalTheme = btn.getAttribute('data-theme-id') || 'mint';
        applyLiveAppearancePreview();
        renderCurrentCard();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function overlayEl() {
    return document.getElementById('guidedOnboardingOverlay');
  }

  function suggestRegion() {
    var pack = S.getPolicyPack ? S.getPolicyPack() : null;
    var labels = S.getRegionLabels ? S.getRegionLabels(pack) : [];
    var hint = S.suggestPrivacyRegionFromHint
      ? S.suggestPrivacyRegionFromHint(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone)
      : 'eea_uk';
    if (!hint || !labels.some(function (r) { return r.id === hint; })) hint = 'eea_uk';
    return { hint: hint, labels: labels };
  }

  function regionLabel(regionId) {
    var pack = S.getPolicyPack ? S.getPolicyPack() : null;
    var labels = S.getRegionLabels ? S.getRegionLabels(pack) : [];
    var found = labels.find(function (r) { return r.id === regionId; });
    return found ? found.label : regionId;
  }

  function rebuildCards() {
    if (typeof S.buildGuidedQuestionnaire !== 'function') return [];
    return S.buildGuidedQuestionnaire(readPrefs(), platformContext());
  }

  function illustrationIcon(name) {
    var map = {
      'mascot-wave': 'onboard-mascot',
      globe: 'onboard-globe',
      coach: 'onboard-coach',
      helper: 'onboard-helper',
      shield: 'onboard-shield',
      cookie: 'onboard-cookie',
      sparkle: 'onboard-sparkle',
      brain: 'brain',
      heart: 'onboard-heart',
      bell: 'onboard-bell',
      install: 'onboard-install',
      celebrate: 'onboard-celebrate',
    };
    var icon = map[name] || 'onboard-mascot';
    if (typeof global.svgIcon === 'function') {
      return global.svgIcon(icon, 'guided-onboarding-illus', '');
    }
    return '';
  }

  function renderProgressDots() {
    var dotsEl = document.getElementById('guidedOnboardingDots');
    if (!dotsEl || !progressSession) return;
    var progress = progressSession.resolve(readPrefs(), platformContext(), cardIndex);
    dotsEl.innerHTML = '';
    for (var i = 0; i < progress.total; i += 1) {
      var dot = document.createElement('span');
      dot.className = 'guided-onboarding-dot' + (i === cardIndex ? ' guided-onboarding-dot--active' : '');
      dot.setAttribute('aria-hidden', 'true');
      dotsEl.appendChild(dot);
    }
    var metaEl = document.getElementById('guidedOnboardingStepMeta');
    if (metaEl) {
      metaEl.textContent = t('onboarding.stepCounter', {
        current: progress.current,
        total: progress.total,
      });
    }
  }

  function renderChoiceCard(choice, card) {
    var hint = choice.hintKey ? '<span class="guided-onboarding-choice-hint">' + escapeHtml(t(choice.hintKey)) + '</span>' : '';
    return (
      '<button type="button" class="guided-onboarding-choice" data-choice-id="' + escapeHtml(choice.id) + '" aria-pressed="false">' +
      '<span class="guided-onboarding-choice-label">' + escapeHtml(t(choice.labelKey)) + '</span>' +
      hint +
      '</button>'
    );
  }

  function renderPasskeyButtonHtml(isSignIn) {
    var label = isSignIn
      ? t('common.sign.in.with.a.passkey.biometrics.or.sec')
      : t('common.register.a.passkey.biometrics.or.securit');
    var icon = typeof global.svgIcon === 'function'
      ? global.svgIcon('shield-check', 'ui-svg-icon', '')
      : '<svg class="ui-svg-icon" aria-hidden="true"><use href="#icon-shield-check"></use></svg>';
    return (
      '<div class="cloud-passkey-row">' +
      '<button type="button" class="cloud-btn passkey-btn" id="guidedOnboardingAuthPasskeyBtn" title="' + escapeHtml(label) + '">' +
      '<span>' + icon + ' ' + escapeHtml(label) + '</span>' +
      '</button></div>'
    );
  }

  function renderAuthForm(card) {
    var isSignIn = card.id === 'signIn';
    var emailLabel = t('onboarding.questionnaire.auth.emailLabel');
    var passwordLabel = t('onboarding.questionnaire.auth.passwordLabel');
    var primaryLabel = isSignIn ? t('settings.cloud.signIn') : t('settings.cloud.signUp');
    var altChoices = (card.choices || []).map(function (c) { return renderChoiceCard(c, card); }).join('');
    return (
      '<div class="guided-onboarding-auth">' +
      '<label for="guidedOnboardingAuthEmail" class="privacy-region-gate-label">' + escapeHtml(emailLabel) + '</label>' +
      '<input type="email" id="guidedOnboardingAuthEmail" class="first-run-wizard-input guided-onboarding-auth-input" autocomplete="email">' +
      '<label for="guidedOnboardingAuthPassword" class="privacy-region-gate-label">' + escapeHtml(passwordLabel) + '</label>' +
      '<input type="password" id="guidedOnboardingAuthPassword" class="first-run-wizard-input guided-onboarding-auth-input" autocomplete="' + (isSignIn ? 'current-password' : 'new-password') + '">' +
      '<button type="button" class="modal-save-btn guided-onboarding-auth-primary" id="guidedOnboardingAuthPrimaryBtn">' + escapeHtml(primaryLabel) + '</button>' +
      renderPasskeyButtonHtml(isSignIn) +
      (altChoices ? '<div class="guided-onboarding-choices guided-onboarding-choices--auth">' + altChoices + '</div>' : '') +
      '</div>'
    );
  }

  function onboardingAuthContext(card, onSuccess) {
    var isSignIn = card && card.id === 'signIn';
    return {
      emailId: 'guidedOnboardingAuthEmail',
      passwordId: 'guidedOnboardingAuthPassword',
      signUpBtnId: 'guidedOnboardingAuthPrimaryBtn',
      loginBtnId: 'guidedOnboardingAuthPrimaryBtn',
      passkeyBtnId: 'guidedOnboardingAuthPasskeyBtn',
      passkeyLabel: isSignIn
        ? t('common.sign.in.with.a.passkey.biometrics.or.sec')
        : t('common.register.a.passkey.biometrics.or.securit'),
      passkeyEnroll: !isSignIn,
      onSuccess: onSuccess,
    };
  }

  function bindAuthForm(card) {
    var primaryBtn = document.getElementById('guidedOnboardingAuthPrimaryBtn');
    var passkeyBtn = document.getElementById('guidedOnboardingAuthPasskeyBtn');
    var onAuthSuccess = function () {
      advanceAfterAnswer(card.id);
    };
    var ctx = onboardingAuthContext(card, onAuthSuccess);
    if (primaryBtn) {
      primaryBtn.onclick = function () {
        if (card.id === 'signIn' && typeof global.handleCloudLogin === 'function') {
          global.handleCloudLogin(ctx);
        } else if (card.id === 'accountSignUp' && typeof global.handleCloudSignUp === 'function') {
          global.handleCloudSignUp(ctx);
        }
      };
    }
    if (passkeyBtn) {
      passkeyBtn.onclick = function () {
        if (card.id === 'signIn' && typeof global.handlePasskeySignIn === 'function') {
          global.handlePasskeySignIn(ctx);
        } else if (card.id === 'accountSignUp' && typeof global.handlePasskeyEnroll === 'function') {
          global.handlePasskeyEnroll(ctx);
        }
      };
    }
    bindChoiceButtons(document.getElementById('guidedOnboardingBody'), card);
  }

  function renderRegionPicker() {
    var sug = suggestRegion();
    var labels = sug.labels;
    return (
      '<label for="guidedOnboardingRegionSelect" class="privacy-region-gate-label">' + escapeHtml(t('gate.regionLabel')) + '</label>' +
      '<select id="guidedOnboardingRegionSelect" class="privacy-region-gate-select">' +
      labels.map(function (r) {
        return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.label) + '</option>';
      }).join('') +
      '</select>' +
      '<button type="button" class="modal-save-btn modal-cancel-btn guided-onboarding-details-btn" id="guidedOnboardingViewPolicies">' +
      escapeHtml(t('gate.viewPolicies')) + '</button>'
    );
  }

  function renderCurrentCard() {
    cards = rebuildCards();
    if (!cards.length) {
      closeWizard(true);
      return;
    }
    cardIndex = Math.min(cardIndex, cards.length - 1);
    var card = cards[cardIndex];
    if (!card) return;

    var body = document.getElementById('guidedOnboardingBody');
    var titleEl = document.getElementById('guidedOnboardingTitle');
    var footer = document.getElementById('guidedOnboardingFooter');
    var detailsBtn = document.getElementById('guidedOnboardingDetailsBtn');
    var backBtn = document.getElementById('guidedOnboardingBackBtn');
    var continueBtn = document.getElementById('guidedOnboardingContinueBtn');

    if (titleEl) titleEl.textContent = t(card.titleKey);
    renderProgressDots();

    if (!body) return;
    body.className = 'modal-body guided-onboarding-body guided-onboarding-body--enter';
    requestAnimationFrame(function () {
      body.classList.remove('guided-onboarding-body--enter');
    });

    var illus = '<div class="guided-onboarding-illus-wrap guided-onboarding-illus-wrap--' + escapeHtml(card.illustration) + '">' +
      illustrationIcon(card.illustration) + '</div>';

    var hint = card.settingsHintKey
      ? '<p class="guided-onboarding-settings-hint">' + escapeHtml(t(card.settingsHintKey)) + '</p>'
      : '';

    if (card.kind === 'auth') {
      body.innerHTML = illus + '<p class="guided-onboarding-lead">' + escapeHtml(t(card.bodyKey)) + '</p>' + renderAuthForm(card);
      bindAuthForm(card);
      if (footer) footer.style.display = 'none';
      if (backBtn) backBtn.style.visibility = cardIndex > 0 ? 'visible' : 'hidden';
      if (detailsBtn) detailsBtn.style.display = 'none';
      regionPickerOpen = false;
      reminderTimePickerOpen = false;
      return;
    }

    if (card.kind === 'theme') {
      renderAppearanceCard(card, body, footer, continueBtn, backBtn, detailsBtn, hint);
      return;
    }

    if (card.kind === 'avatar-carousel') {
      var GP = global.RianellGraphicsPortfolio;
      var bootAvatar = draftProfileAvatar || (readPrefs().profileAvatar || 'voidorb');
      if (GP && typeof GP.renderAvatarCarouselHTML === 'function') {
        body.innerHTML = illus + '<p class="guided-onboarding-lead">' + escapeHtml(t(card.bodyKey)) + '</p>' +
          GP.renderAvatarCarouselHTML(bootAvatar, { variant: 'intro' }) + hint;
        if (typeof GP.bindAvatarCarousel === 'function') {
          GP.bindAvatarCarousel(body, function (id) {
            draftProfileAvatar = id;
            avatarPickMade = true;
            writePrefs({ profileAvatar: id });
            if (typeof GP.updateHeaderAvatar === 'function') GP.updateHeaderAvatar(id);
            if (continueBtn) continueBtn.textContent = t('onboarding.questionnaire.avatarPick.continueSelected');
          });
        }
      }
      if (footer) footer.style.display = 'flex';
      if (continueBtn) {
        continueBtn.textContent = avatarPickMade
          ? t('onboarding.questionnaire.avatarPick.continueSelected')
          : t('onboarding.questionnaire.avatarPick.skip');
        continueBtn.style.display = 'inline-block';
      }
      if (backBtn) backBtn.style.visibility = cardIndex > 0 ? 'visible' : 'hidden';
      if (detailsBtn) detailsBtn.style.display = 'none';
      return;
    }

    if (card.id === 'region') {
      if (!selectedRegion) {
        selectedRegion = suggestRegion().hint;
      }
      if (regionPickerOpen) {
        body.innerHTML = illus + '<p class="guided-onboarding-lead">' + escapeHtml(t(card.bodyKey)) + '</p>' + renderRegionPicker();
        var sel = document.getElementById('guidedOnboardingRegionSelect');
        if (sel) sel.value = selectedRegion;
        var viewBtn = document.getElementById('guidedOnboardingViewPolicies');
        if (viewBtn) {
          viewBtn.onclick = function () {
            var regionId = sel ? sel.value : selectedRegion;
            if (global.RianellPrivacy && typeof global.RianellPrivacy.showPolicyViewerModal === 'function') {
              global.RianellPrivacy.showPolicyViewerModal(regionId, true);
            }
          };
        }
        if (continueBtn) {
          continueBtn.textContent = t('gate.confirm');
          continueBtn.style.display = 'inline-block';
        }
        if (backBtn) backBtn.style.visibility = 'visible';
      } else {
        body.innerHTML = illus +
          '<p class="guided-onboarding-lead">' + escapeHtml(t('onboarding.questionnaire.region.suggested', { region: regionLabel(selectedRegion) })) + '</p>' +
          '<div class="guided-onboarding-choices">' +
          renderChoiceCard({ id: 'confirm', labelKey: 'onboarding.questionnaire.region.confirm' }, card) +
          renderChoiceCard({ id: 'pickAnother', labelKey: 'onboarding.questionnaire.region.pickAnother' }, card) +
          '</div>' + hint;
        bindChoiceButtons(body, card);
      }
      if (footer) footer.style.display = regionPickerOpen ? 'flex' : 'none';
      if (backBtn) backBtn.style.visibility = cardIndex > 0 ? 'visible' : 'hidden';
      if (detailsBtn) detailsBtn.style.display = 'none';
      return;
    }

    if (card.id === 'dailyNudge' && reminderTimePickerOpen) {
      body.innerHTML = illus +
        '<p class="guided-onboarding-lead">' + escapeHtml(t(card.bodyKey)) + '</p>' +
        '<label for="guidedOnboardingReminderTime" class="privacy-region-gate-label">' + escapeHtml(t('onboarding.questionnaire.dailyNudge.timeLabel')) + '</label>' +
        '<input type="time" id="guidedOnboardingReminderTime" class="first-run-wizard-input" value="' + escapeHtml(reminderTime) + '">';
      if (footer) footer.style.display = 'flex';
      if (continueBtn) {
        continueBtn.textContent = t('onboarding.questionnaire.continue');
        continueBtn.style.display = 'inline-block';
      }
      if (backBtn) backBtn.style.visibility = 'visible';
      if (detailsBtn) detailsBtn.style.display = 'none';
      return;
    }

    if (card.id === 'healthConsent' && document.body.dataset.guidedHealthDeclined === '1') {
      body.innerHTML = illus +
        '<p class="guided-onboarding-lead">' + escapeHtml(t('onboarding.questionnaire.healthConsent.declineHint')) + '</p>' + hint;
      if (footer) footer.style.display = 'flex';
      if (continueBtn) {
        continueBtn.style.display = 'inline-block';
        continueBtn.textContent = t('onboarding.questionnaire.continue');
      }
      if (backBtn) backBtn.style.visibility = 'visible';
      if (detailsBtn) detailsBtn.style.display = 'none';
      return;
    }

    var choicesHtml = '';
    if (card.choices && card.choices.length) {
      choicesHtml = '<div class="guided-onboarding-choices">' +
        card.choices.map(function (c) { return renderChoiceCard(c, card); }).join('') +
        '</div>';
    }
    body.innerHTML = illus + '<p class="guided-onboarding-lead">' + escapeHtml(t(card.bodyKey)) + '</p>' + choicesHtml + hint;
    bindChoiceButtons(body, card);

    if (footer) footer.style.display = 'none';
    if (backBtn) backBtn.style.visibility = cardIndex > 0 ? 'visible' : 'hidden';
    if (detailsBtn) {
      detailsBtn.style.display = card.kind === 'consent' ? 'inline-block' : 'none';
      detailsBtn.textContent = t('onboarding.questionnaire.seeDetails');
    }
    if (continueBtn) continueBtn.style.display = 'none';
  }

  function bindChoiceButtons(body, card) {
    if (!body || !card) return;
    var buttons = body.querySelectorAll('.guided-onboarding-choice');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        var choiceId = btn.getAttribute('data-choice-id');
        if (!choiceId) return;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        handleChoice(card, choiceId);
      });
    });
  }

  function hidePrivacyGateIfOpen() {
    if (global.RianellPrivacy && typeof global.RianellPrivacy.hidePrivacyGateOverlay === 'function') {
      global.RianellPrivacy.hidePrivacyGateOverlay();
      return;
    }
    var gate = document.getElementById('privacyRegionGateOverlay');
    if (gate) gate.style.display = 'none';
  }

  function handleChoice(card, choiceId) {
    if (card.id === 'signIn' && choiceId === 'setUpInstead') {
      applyAndAdvance(card.id, choiceId, {});
      return;
    }
    if (card.id === 'accountSignUp' && choiceId === 'skip') {
      applyAndAdvance(card.id, choiceId, {});
      return;
    }
    if (card.id === 'region') {
      if (choiceId === 'pickAnother') {
        regionPickerOpen = true;
        renderCurrentCard();
        return;
      }
      if (choiceId === 'confirm') {
        var pack = S.getPolicyPack ? S.getPolicyPack() : null;
        applyAndAdvance(card.id, 'confirm', {
          regionId: selectedRegion,
          policyPackId: pack && pack.policyPackId ? pack.policyPackId : 'v1.0.0',
        });
        return;
      }
    }
    if (card.id === 'dailyNudge' && choiceId === 'yes') {
      reminderTimePickerOpen = true;
      renderCurrentCard();
      return;
    }
    if (card.id === 'install' && choiceId === 'install') {
      try { localStorage.setItem('rianellInstallModalAfterTutorialSeen', '1'); } catch (e) {}
      applyAndAdvance(card.id, 'install', {});
      if (typeof global.openInstallModal === 'function') global.openInstallModal(true);
      return;
    }
    if (card.id === 'finish') {
      finishOnboarding(choiceId);
      return;
    }
    if (card.id === 'healthConsent' && choiceId === 'notNow') {
      document.body.dataset.guidedHealthDeclined = '1';
      var declinedPrefs = readPrefs();
      if (typeof S.applyQuestionnaireAnswer === 'function') {
        declinedPrefs = S.applyQuestionnaireAnswer(declinedPrefs, card.id, choiceId, {});
      }
      writePrefs(declinedPrefs);
      renderCurrentCard();
      return;
    }
    applyAndAdvance(card.id, choiceId, {});
  }

  function refreshLocaleAfterPrefs() {
    if (global.RianellPrivacy && typeof global.RianellPrivacy.refreshLocaleUI === 'function') {
      global.RianellPrivacy.refreshLocaleUI();
    } else if (I.setLocale && typeof I.setLocale === 'function') {
      var prefs = readPrefs();
      I.setLocale(prefs.uiLocale || 'en-GB', prefs);
    }
  }

  function advanceAfterAnswer(answeredCardId) {
    cards = rebuildCards();
    if (progressSession && typeof progressSession.refresh === 'function') {
      progressSession.refresh(readPrefs(), platformContext());
    }
    if (typeof S.resolveNextGuidedCardIndex === 'function') {
      cardIndex = S.resolveNextGuidedCardIndex(cards, answeredCardId);
    } else {
      cardIndex = Math.min(cardIndex + 1, Math.max(cards.length - 1, 0));
    }
    document.body.dataset.guidedHealthDeclined = '';
    reminderTimePickerOpen = false;
    renderCurrentCard();
  }

  function applyAndAdvance(cardId, choiceId, extra) {
    var prefs = readPrefs();
    if (typeof S.applyQuestionnaireAnswer === 'function') {
      prefs = S.applyQuestionnaireAnswer(prefs, cardId, choiceId, extra);
    }
    writePrefs(prefs);
    if (cardId === 'region') {
      regionPickerOpen = false;
      refreshLocaleAfterPrefs();
      if (global.RianellPrivacy && typeof global.RianellPrivacy.upsertPrivacyProfile === 'function') {
        try { global.RianellPrivacy.upsertPrivacyProfile(prefs); } catch (e) {}
      }
      if (global.RianellPrivacy && typeof global.RianellPrivacy.syncConsentEnforcement === 'function') {
        global.RianellPrivacy.syncConsentEnforcement('guided-region-confirmed');
      }
    }
    if (cardId === 'sessionRecording' && global.RianellSmartlook && typeof global.RianellSmartlook.apply === 'function') {
      global.RianellSmartlook.apply(prefs);
    }
    if (cardId === 'cookies' && choiceId === 'accept') {
      try { localStorage.setItem('rianellCookieConsent', '1'); } catch (e2) {}
    }
    advanceAfterAnswer(cardId);
  }

  function finishOnboarding(choiceId) {
    var prefs = readPrefs();
    if (typeof S.applyQuestionnaireAnswer === 'function') {
      prefs = S.applyQuestionnaireAnswer(prefs, 'finish', choiceId, {});
    }
    writePrefs(prefs);
    try { localStorage.setItem('rianellTutorialSeen', '1'); } catch (e) {}
    try {
      if (choiceId === 'quickTour' && typeof global.openTutorialModal === 'function') {
        global.openTutorialModal();
      }
      if (typeof global.onFirstRunWizardComplete === 'function') global.onFirstRunWizardComplete();
      else if (typeof global.ensureShellContentVisible === 'function') global.ensureShellContentVisible();
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[Rianell] guided onboarding finish hook failed', err);
      }
      if (typeof global.ensureShellContentVisible === 'function') {
        try { global.ensureShellContentVisible(); } catch (e2) {}
      }
    } finally {
      closeWizard(true);
    }
  }

  function onContinue() {
    var card = cards[cardIndex];
    if (!card) return;
    if (card.id === 'region' && regionPickerOpen) {
      var sel = document.getElementById('guidedOnboardingRegionSelect');
      selectedRegion = sel ? sel.value : selectedRegion;
      var pack = S.getPolicyPack ? S.getPolicyPack() : null;
      applyAndAdvance('region', 'confirm', {
        regionId: selectedRegion,
        policyPackId: pack && pack.policyPackId ? pack.policyPackId : 'v1.0.0',
      });
      return;
    }
    if (card.id === 'dailyNudge' && reminderTimePickerOpen) {
      var timeInput = document.getElementById('guidedOnboardingReminderTime');
      reminderTime = timeInput ? timeInput.value : reminderTime;
      applyAndAdvance('dailyNudge', 'yes', { reminderTime: reminderTime });
      return;
    }
    if (card.id === 'healthConsent' && document.body.dataset.guidedHealthDeclined === '1') {
      document.body.dataset.guidedHealthDeclined = '';
      advanceAfterAnswer('healthConsent');
      return;
    }
    if (card.kind === 'theme') {
      applyAndAdvance('appearance', 'continue', {
        appearanceMode: draftAppearanceMode,
        globalTheme: draftGlobalTheme,
      });
      return;
    }
    if (card.kind === 'avatar-carousel') {
      applyAndAdvance('avatarPick', avatarPickMade ? 'continue' : 'skip', {
        profileAvatar: draftProfileAvatar || readPrefs().profileAvatar || 'voidorb',
      });
      return;
    }
  }

  function onBack() {
    if (regionPickerOpen) {
      regionPickerOpen = false;
      renderCurrentCard();
      return;
    }
    if (reminderTimePickerOpen) {
      reminderTimePickerOpen = false;
      renderCurrentCard();
      return;
    }
    cardIndex = Math.max(0, cardIndex - 1);
    renderCurrentCard();
  }

  function onDetails() {
    var card = cards[cardIndex];
    if (!card || card.kind !== 'consent') return;
    var prefs = readPrefs();
    var regionId = prefs.privacyRegion || selectedRegion || 'other';
    if (global.RianellPrivacy && typeof global.RianellPrivacy.showPolicyViewerModal === 'function') {
      global.RianellPrivacy.showPolicyViewerModal(regionId, true);
    }
  }

  function openWizard() {
    if (active) return true;
    var overlay = overlayEl();
    if (!overlay) return false;
    active = true;
    cardIndex = 0;
    regionPickerOpen = false;
    reminderTimePickerOpen = false;
    selectedRegion = suggestRegion().hint;
    var bootPrefs = readPrefs();
    draftAppearanceMode = bootPrefs.appearanceMode === 'dark' ? 'dark' : 'light';
    draftGlobalTheme = bootPrefs.globalTheme || 'mint';
    draftProfileAvatar = bootPrefs.profileAvatar || 'voidorb';
    avatarPickMade = !!bootPrefs.avatarPickAt;
    hidePrivacyGateIfOpen();
    cards = rebuildCards();
    applyLiveAppearancePreview();
    if (typeof S.createGuidedOnboardingProgressSession === 'function') {
      progressSession = S.createGuidedOnboardingProgressSession(readPrefs(), platformContext());
    }
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    overlay.classList.add('modal-overlay--open');
    document.body.classList.add('modal-active', 'guided-onboarding-active');
    if (global.RianellPrivacy && typeof global.RianellPrivacy.syncConsentEnforcement === 'function') {
      global.RianellPrivacy.syncConsentEnforcement('first-run-open');
    }
    ensureI18nReady().then(paintWizard).catch(paintWizard);
    return true;
  }

  function bindFooterOnce() {
    var continueBtn = document.getElementById('guidedOnboardingContinueBtn');
    var backBtn = document.getElementById('guidedOnboardingBackBtn');
    var detailsBtn = document.getElementById('guidedOnboardingDetailsBtn');
    if (continueBtn && !continueBtn.dataset.bound) {
      continueBtn.dataset.bound = '1';
      continueBtn.addEventListener('click', onContinue);
    }
    if (backBtn && !backBtn.dataset.bound) {
      backBtn.dataset.bound = '1';
      backBtn.addEventListener('click', onBack);
    }
    if (detailsBtn && !detailsBtn.dataset.bound) {
      detailsBtn.dataset.bound = '1';
      detailsBtn.addEventListener('click', onDetails);
    }
  }

  function closeWizard(completed) {
    active = false;
    var overlay = overlayEl();
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      overlay.classList.remove('modal-overlay--open');
    }
    document.body.classList.remove('guided-onboarding-active');
    var anyModalOpen = typeof global.isAnyModalOverlayOpen === 'function'
      ? global.isAnyModalOverlayOpen()
      : !!document.querySelector('.modal-overlay--open, .settings-overlay--open');
    if (!anyModalOpen) {
      document.body.classList.remove('modal-active');
      document.body.style.overflow = '';
    }
    if (_focusTrapTeardown) {
      try { _focusTrapTeardown(); } catch (e) {}
      _focusTrapTeardown = null;
    }
    if (global.RianellPrivacy && typeof global.RianellPrivacy.syncConsentEnforcement === 'function') {
      global.RianellPrivacy.syncConsentEnforcement(completed ? 'first-run-complete' : 'first-run-closed');
    }
  }

  function openIfNeeded() {
    if (isComplete()) return false;
    return openWizard();
  }

  var api = {
    isActive: function () { return active; },
    isComplete: isComplete,
    shouldDeferRegionGate: shouldDeferRegionGate,
    shouldSuppressStandaloneModals: shouldSuppressStandaloneModals,
    openIfNeeded: openIfNeeded,
    refreshLocaleUI: function () {
      if (!active) return;
      ensureI18nReady().then(function () {
        if (active) renderCurrentCard();
      }).catch(function () {
        if (active) renderCurrentCard();
      });
    },
    onTutorialFinished: function () {},
    advanceFromTutorial: function () {},
    syncTutorialFooter: function () {},
  };

  global.RianellGuidedOnboarding = api;
  global.RianellFirstRunWizard = api;
  if (typeof I.onLocaleChange === 'function') {
    I.onLocaleChange(function () {
      if (active) api.refreshLocaleUI();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
