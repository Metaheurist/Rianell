(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var _step = 0;
  var _briefText = '';
  var _screeningKind = 'phq2';
  var _screeningResponses = {};
  var _screeningResult = false;
  var _modalMode = null;

  function withCatalogsReady(fn) {
    var I = global.RianellI18n;
    if (I && typeof I.ensureCatalogs === 'function') {
      var loc = typeof I.getLocale === 'function' ? I.getLocale() : 'en-GB';
      return I.ensureCatalogs(loc).then(fn).catch(fn);
    }
    fn();
  }

  function isWeeklyReviewModalOpen() {
    var modal = document.getElementById('weeklyReviewModal');
    return !!(modal && modal.style.display === 'flex');
  }

  function setWeeklyReviewModalTitle(key) {
    var titleEl = document.getElementById('weeklyReviewModalTitle');
    if (titleEl) titleEl.textContent = t(key);
  }

  function refreshOpenModalI18n() {
    if (!isWeeklyReviewModalOpen()) return;
    if (_modalMode === 'screening') {
      var titleKey = _screeningKind === 'gad2' ? 'mentalHealth.gad2.title' : 'mentalHealth.phq2.title';
      setWeeklyReviewModalTitle(titleKey);
      renderScreeningModalBody();
      return;
    }
    if (_modalMode === 'weekly') {
      setWeeklyReviewModalTitle('weeklyReview.title');
      renderWeeklyReviewModalBody();
    }
  }

  function openScreeningModal(kind) {
    _modalMode = 'screening';
    _screeningKind = kind === 'gad2' ? 'gad2' : 'phq2';
    _screeningResponses = {};
    _screeningResult = false;
    var questions = _screeningKind === 'gad2' ? (S.GAD2_QUESTIONS || []) : (S.PHQ2_QUESTIONS || []);
    questions.forEach(function (q) {
      _screeningResponses[q.id] = 0;
    });
    var modal = document.getElementById('weeklyReviewModal');
    if (!modal) return;
    var titleKey = _screeningKind === 'gad2' ? 'mentalHealth.gad2.title' : 'mentalHealth.phq2.title';
    withCatalogsReady(function () {
      modal.style.display = 'flex';
      modal.classList.add('screening-modal-open');
      setWeeklyReviewModalTitle(titleKey);
      renderScreeningModalBody();
    });
  }

  function renderScreeningModalBody() {
    var body = document.getElementById('weeklyReviewModalBody');
    if (!body || !S.SCREENING_RESPONSE_OPTIONS) return;
    var questions = _screeningKind === 'gad2' ? (S.GAD2_QUESTIONS || []) : (S.PHQ2_QUESTIONS || []);
    var options = S.SCREENING_RESPONSE_OPTIONS || [];
    var html = '<p class="settings-hint screening-disclaimer">' + escapeHTML(t('mentalHealth.disclaimer')) + '</p>';
    if (!_screeningResult) {
      html += '<div class="screening-form">';
      questions.forEach(function (q) {
        var val = Number.isFinite(_screeningResponses[q.id]) ? _screeningResponses[q.id] : 0;
        var opt = options[val] || options[0];
        var sliderId = 'screening-slider-' + q.id;
        html += '<div class="screening-slider-block" data-q="' + escapeHTML(q.id) + '">';
        html += '<p class="screening-question">' + escapeHTML(t(q.i18n)) + '</p>';
        html += '<div class="screening-slider-row">';
        html += '<input type="range" class="screening-slider" id="' + sliderId + '" min="0" max="3" step="1" value="' + val + '" aria-valuemin="0" aria-valuemax="3" aria-valuenow="' + val + '" aria-valuetext="' + escapeHTML(t(opt.i18n)) + '">';
        html += '<output class="screening-slider-value" for="' + sliderId + '">' + escapeHTML(t(opt.i18n)) + '</output>';
        html += '</div>';
        html += '<div class="screening-slider-ticks" aria-hidden="true">';
        options.forEach(function (o) {
          html += '<span>' + escapeHTML(t(o.i18n)) + '</span>';
        });
        html += '</div></div>';
      });
      html += '</div>';
      html += '<div class="screening-submit-footer"><button type="button" class="action-btn screening-submit-btn" id="screeningSubmitBtn">' + escapeHTML(t('mentalHealth.submit')) + '</button></div>';
    } else {
      var responses = questions.map(function (q) { return { value: _screeningResponses[q.id] }; });
      var scored = S.scoreScreeningResponses ? S.scoreScreeningResponses(responses) : { total: 0 };
      var interp = _screeningKind === 'gad2'
        ? (S.interpretGad2Score ? S.interpretGad2Score(scored.total) : { i18n: 'mentalHealth.gad2.low' })
        : (S.interpretPhq2Score ? S.interpretPhq2Score(scored.total) : { i18n: 'mentalHealth.phq2.low' });
      html += '<p><strong>' + escapeHTML(t('mentalHealth.result.title')) + '</strong></p>';
      html += '<p>' + escapeHTML(t(interp.i18n)) + ' (' + scored.total + '/6)</p>';
      var crisis = S.getCrisisResourcesForRegion ? S.getCrisisResourcesForRegion(getSettings().privacyRegion || 'other') : [];
      if (crisis.length) {
        html += '<div class="crisis-help-buttons" role="group" aria-label="' + escapeHTML(t('mentalHealth.crisis.groupLabel')) + '">';
        crisis.forEach(function (link) {
          html += '<a class="crisis-help-btn" href="' + escapeHTML(link.url) + '" target="_blank" rel="noopener noreferrer">'
            + '<svg class="ui-svg-icon" aria-hidden="true"><use href="#icon-life-ring"></use></svg>'
            + '<span>' + escapeHTML(t(link.i18n)) + '</span></a>';
        });
        html += '</div>';
      }
    }
    body.innerHTML = html;
    body.querySelectorAll('.screening-slider').forEach(function (slider) {
      slider.oninput = function () {
        var block = slider.closest('.screening-slider-block');
        var qId = block && block.getAttribute('data-q');
        if (!qId) return;
        var nextVal = Number(slider.value);
        _screeningResponses[qId] = nextVal;
        var opt = options[nextVal] || options[0];
        slider.setAttribute('aria-valuenow', String(nextVal));
        slider.setAttribute('aria-valuetext', t(opt.i18n));
        var out = block.querySelector('.screening-slider-value');
        if (out) out.textContent = t(opt.i18n);
      };
    });
    var submit = document.getElementById('screeningSubmitBtn');
    if (submit) submit.onclick = function () {
      var complete = questions.every(function (q) { return Number.isFinite(_screeningResponses[q.id]); });
      if (!complete) return;
      _screeningResult = true;
      renderScreeningModalBody();
    };
  }

  function t(key, params) {
    if (typeof global.tUi === 'function') return global.tUi(key, params || {});
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      return global.RianellI18n.t(key, params || {});
    }
    return key;
  }

  function escapeHTML(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getLogs() {
    return global.logs && Array.isArray(global.logs) ? global.logs : [];
  }

  function getSettings() {
    return global.appSettings || {};
  }

  function saveSettingsPatch(patch) {
    if (!global.appSettings) global.appSettings = {};
    Object.assign(global.appSettings, patch);
    if (typeof global.saveSettings === 'function') global.saveSettings();
  }

  function correlationLines(logArr) {
    var engine = global.RianellAIEngine;
    if (!engine || typeof engine.buildCorrelationCards !== 'function') return [];
    var cards = engine.buildCorrelationCards(logArr, 14);
    if (S.summarizeCorrelationStep) return S.summarizeCorrelationStep(cards);
    return (cards || []).slice(0, 3).map(function (c) {
      return { id: c.id, label: c.label || '', detail: c.detail || '' };
    });
  }

  function digestFromLogs(logArr) {
    var engine = global.RianellAIEngine;
    if (!engine || typeof engine.runDeterministicAnalysis !== 'function') {
      return S.summarizeDigestStep ? S.summarizeDigestStep(null) : { headline: '', improvements: [], concerns: [] };
    }
    var analysis = engine.runDeterministicAnalysis(logArr, 14, { goals: getSettings().goals });
    return S.summarizeDigestStep ? S.summarizeDigestStep(analysis && analysis.weeklyDigest) : { headline: '', improvements: [], concerns: [] };
  }

  function renderWeeklyReviewModalBody() {
    var body = document.getElementById('weeklyReviewModalBody');
    if (!body) return;
    var steps = S.WEEKLY_REVIEW_STEPS || [];
    var current = steps[_step] || { id: 'correlations', i18n: 'weeklyReview.step.correlations' };
    var logArr = getLogs();
    var html = '<p class="weekly-review-progress">' + escapeHTML(t('weeklyReview.progress', { current: String(_step + 1), total: String(steps.length || 5) })) + '</p>';
    html += '<h3>' + escapeHTML(t(current.i18n)) + '</h3>';

    if (current.id === 'correlations') {
      var lines = correlationLines(logArr);
      if (!lines.length) html += '<p>' + escapeHTML(t('weeklyReview.correlations.empty')) + '</p>';
      lines.forEach(function (line) {
        html += '<p>· ' + escapeHTML(line.label) + (line.detail ? ', ' + escapeHTML(line.detail) : '') + '</p>';
      });
    } else if (current.id === 'digest') {
      var digest = digestFromLogs(logArr);
      html += '<p>' + escapeHTML(digest.headline || '') + '</p>';
      (digest.improvements || []).forEach(function (line) {
        html += '<p>+ ' + escapeHTML(line) + '</p>';
      });
      (digest.concerns || []).forEach(function (line) {
        html += '<p>− ' + escapeHTML(line) + '</p>';
      });
    } else if (current.id === 'brief') {
      html += '<p>' + escapeHTML(_briefText || t('weeklyReview.brief.fallback')) + '</p>';
    } else if (current.id === 'confirm') {
      html += '<p>' + escapeHTML(t('weeklyReview.confirm.lead')) + '</p>';
    } else if (current.id === 'pdf') {
      html += '<p>' + escapeHTML(t('weeklyReview.pdf.lead')) + '</p>';
    }

    html += '<div class="weekly-review-actions">';
    if (_step > 0) html += '<button type="button" class="action-btn" id="weeklyReviewBackBtn">' + escapeHTML(t('common.back') || 'Back') + '</button>';
    if (_step < steps.length - 1) {
      html += '<button type="button" class="action-btn" id="weeklyReviewNextBtn">' + escapeHTML(t('common.continue')) + '</button>';
    } else {
      html += '<button type="button" class="action-btn" id="weeklyReviewPdfBtn">' + escapeHTML(t('weeklyReview.pdf.action')) + '</button>';
    }
    html += '</div>';
    body.innerHTML = html;

    var backBtn = document.getElementById('weeklyReviewBackBtn');
    if (backBtn) backBtn.onclick = function () { _step = Math.max(0, _step - 1); renderWeeklyReviewModalBody(); };
    var nextBtn = document.getElementById('weeklyReviewNextBtn');
    if (nextBtn) nextBtn.onclick = function () {
      if (steps[_step] && steps[_step].id === 'brief' && !_briefText) {
        loadBriefText().then(function () {
          _step += 1;
          renderWeeklyReviewModalBody();
        });
        return;
      }
      _step += 1;
      renderWeeklyReviewModalBody();
    };
    var pdfBtn = document.getElementById('weeklyReviewPdfBtn');
    if (pdfBtn) pdfBtn.onclick = finishWeeklyReviewPdf;
  }

  function loadBriefText() {
    _briefText = t('weeklyReview.brief.fallback');
    var settings = getSettings();
    if (!settings.aiEnabled) return Promise.resolve(_briefText);
    if (typeof global.generateClinicianVisitBrief !== 'function') return Promise.resolve(_briefText);
    var logArr = getLogs();
    return global.generateClinicianVisitBrief(logArr, 14).then(function (text) {
      _briefText = text || t('weeklyReview.brief.fallback');
      return _briefText;
    }).catch(function () {
      _briefText = t('weeklyReview.brief.fallback');
      return _briefText;
    });
  }

  function openWeeklyReviewModal() {
    _modalMode = 'weekly';
    _step = 0;
    _briefText = '';
    var modal = document.getElementById('weeklyReviewModal');
    if (!modal) return;
    withCatalogsReady(function () {
      modal.style.display = 'flex';
      setWeeklyReviewModalTitle('weeklyReview.title');
      renderWeeklyReviewModalBody();
    });
  }

  function closeWeeklyReviewModal() {
    var modal = document.getElementById('weeklyReviewModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('screening-modal-open');
    }
    _modalMode = null;
    _screeningResult = false;
    _screeningResponses = {};
    setWeeklyReviewModalTitle('weeklyReview.title');
  }

  function finishWeeklyReviewPdf() {
    if (typeof global.printOrShareAppointmentReport === 'function') {
      global.printOrShareAppointmentReport({ briefText: _briefText, doctorQuestions: [] });
    }
    var today = new Date().toISOString().slice(0, 10);
    if (S.isoWeekMondayKey) {
      saveSettingsPatch({ weeklyReviewDismissedWeek: S.isoWeekMondayKey(today) });
    }
    closeWeeklyReviewModal();
    if (typeof global.applyHomeCardLayout === 'function') global.applyHomeCardLayout();
  }

  function renderHomeWeeklyReviewCard(todayStr, ctx) {
    var card = document.getElementById('homeWeeklyReviewCard');
    if (!card) return;
    if (!ctx || !ctx.showWeeklyReview) {
      card.hidden = true;
      card.innerHTML = '';
      return;
    }
    card.hidden = false;
    card.innerHTML =
      '<button type="button" class="home-inset-dismiss" aria-label="' + escapeHTML(t('common.close')) + '">&times;</button>' +
      '<h4 class="home-inset-title">' + escapeHTML(t('weeklyReview.card.title')) + '</h4>' +
      '<p class="home-inset-body">' + escapeHTML(t('weeklyReview.card.lead')) + '</p>' +
      '<div class="home-inset-actions">' +
      '<button type="button" class="action-btn home-weekly-review-start" data-ripple>' + escapeHTML(t('weeklyReview.card.action')) + '</button>' +
      '</div>';
    var startBtn = card.querySelector('.home-weekly-review-start');
    if (startBtn) startBtn.onclick = openWeeklyReviewModal;
    var dismissBtn = card.querySelector('.home-inset-dismiss');
    if (dismissBtn) dismissBtn.onclick = function () {
      if (S.isoWeekMondayKey) saveSettingsPatch({ weeklyReviewDismissedWeek: S.isoWeekMondayKey(todayStr) });
      if (typeof global.applyHomeCardLayout === 'function') global.applyHomeCardLayout();
    };
    if (typeof global.initRipple === 'function') global.initRipple(card);
  }

  function bindChartsPresentationMode() {
    var toggle = document.getElementById('chartsPresentationModeToggle');
    if (!toggle || !global.appSettings) return;
    var on = global.appSettings.chartsPresentationMode === true;
    toggle.classList.toggle('active', on);
    document.body.classList.toggle('charts-presentation-mode', on);
    if (on && typeof global.setChartDateRange === 'function') global.setChartDateRange(7);
  }

  function toggleChartsPresentationMode() {
    if (!global.appSettings) global.appSettings = {};
    global.appSettings.chartsPresentationMode = !global.appSettings.chartsPresentationMode;
    if (typeof global.saveSettings === 'function') global.saveSettings();
    bindChartsPresentationMode();
  }

  function renderSettingsPerformanceLearn() {
    var moatList = document.getElementById('onDeviceMoatList');
    if (moatList && S.getOnDeviceMoatBulletKeys) {
      moatList.innerHTML = S.getOnDeviceMoatBulletKeys().map(function (key) {
        return '<li>' + escapeHTML(t(key)) + '</li>';
      }).join('');
    }
    var milestoneList = document.getElementById('progressiveDisclosureList');
    if (milestoneList && S.getProgressiveDisclosureMilestones) {
      milestoneList.innerHTML = S.getProgressiveDisclosureMilestones().map(function (m) {
        return '<li>' + escapeHTML(t(m.i18n)) + '</li>';
      }).join('');
    }
  }

  function bindWeeklyReviewModule() {
    var closeBtn = document.getElementById('weeklyReviewModalClose');
    if (closeBtn) closeBtn.onclick = closeWeeklyReviewModal;
    var presToggle = document.getElementById('chartsPresentationModeToggle');
    if (presToggle) presToggle.onclick = toggleChartsPresentationMode;
    if (global.RianellI18n && typeof global.RianellI18n.onLocaleChange === 'function') {
      global.RianellI18n.onLocaleChange(function () { refreshOpenModalI18n(); });
    }
    withCatalogsReady(renderSettingsPerformanceLearn);
    bindChartsPresentationMode();
  }

  global.RianellWeeklyReview = {
    openWeeklyReviewModal: openWeeklyReviewModal,
    openScreeningModal: openScreeningModal,
    renderHomeWeeklyReviewCard: renderHomeWeeklyReviewCard,
    bindWeeklyReviewModule: bindWeeklyReviewModule,
    bindChartsPresentationMode: bindChartsPresentationMode,
    renderSettingsPerformanceLearn: renderSettingsPerformanceLearn,
    /** @deprecated use renderSettingsPerformanceLearn */
    renderSettingsCrossCutting: renderSettingsPerformanceLearn,
    refreshOpenModalI18n: refreshOpenModalI18n,
  };
})(typeof window !== 'undefined' ? window : globalThis);
