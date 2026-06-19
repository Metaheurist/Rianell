(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var _step = 0;
  var _briefText = '';
  var _screeningKind = 'phq2';
  var _screeningResponses = {};
  var _screeningResult = false;

  function openScreeningModal(kind) {
    _screeningKind = kind === 'gad2' ? 'gad2' : 'phq2';
    _screeningResponses = {};
    _screeningResult = false;
    var modal = document.getElementById('weeklyReviewModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderScreeningModalBody();
  }

  function renderScreeningModalBody() {
    var body = document.getElementById('weeklyReviewModalBody');
    if (!body || !S.SCREENING_RESPONSE_OPTIONS) return;
    var questions = _screeningKind === 'gad2' ? (S.GAD2_QUESTIONS || []) : (S.PHQ2_QUESTIONS || []);
    var titleKey = _screeningKind === 'gad2' ? 'mentalHealth.gad2.title' : 'mentalHealth.phq2.title';
    var html = '<h3>' + escapeHTML(t(titleKey)) + '</h3>';
    html += '<p class="settings-hint">' + escapeHTML(t('mentalHealth.disclaimer')) + '</p>';
    if (!_screeningResult) {
      questions.forEach(function (q) {
        html += '<div class="weekly-review-question"><p>' + escapeHTML(t(q.i18n)) + '</p>';
        (S.SCREENING_RESPONSE_OPTIONS || []).forEach(function (opt) {
          var sel = _screeningResponses[q.id] === opt.value;
          html += '<button type="button" class="action-btn screening-opt' + (sel ? ' active' : '') + '" data-q="' + q.id + '" data-v="' + opt.value + '">' + escapeHTML(t(opt.i18n)) + '</button>';
        });
        html += '</div>';
      });
      html += '<button type="button" class="action-btn" id="screeningSubmitBtn">' + escapeHTML(t('mentalHealth.submit')) + '</button>';
    } else {
      var responses = questions.map(function (q) { return { value: _screeningResponses[q.id] }; });
      var scored = S.scoreScreeningResponses ? S.scoreScreeningResponses(responses) : { total: 0 };
      var interp = _screeningKind === 'gad2'
        ? (S.interpretGad2Score ? S.interpretGad2Score(scored.total) : { i18n: 'mentalHealth.gad2.low' })
        : (S.interpretPhq2Score ? S.interpretPhq2Score(scored.total) : { i18n: 'mentalHealth.phq2.low' });
      html += '<p><strong>' + escapeHTML(t('mentalHealth.result.title')) + '</strong></p>';
      html += '<p>' + escapeHTML(t(interp.i18n)) + ' (' + scored.total + '/6)</p>';
      var crisis = S.getCrisisResourcesForRegion ? S.getCrisisResourcesForRegion(getSettings().privacyRegion || 'other') : [];
      crisis.forEach(function (link) {
        html += '<p><a href="' + escapeHTML(link.url) + '" target="_blank" rel="noopener">' + escapeHTML(t(link.i18n)) + '</a></p>';
      });
    }
    body.innerHTML = html;
    body.querySelectorAll('.screening-opt').forEach(function (btn) {
      btn.onclick = function () {
        _screeningResponses[btn.getAttribute('data-q')] = Number(btn.getAttribute('data-v'));
        renderScreeningModalBody();
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
        html += '<p>· ' + escapeHTML(line.label) + (line.detail ? ' — ' + escapeHTML(line.detail) : '') + '</p>';
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
    _step = 0;
    _briefText = '';
    var modal = document.getElementById('weeklyReviewModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderWeeklyReviewModalBody();
  }

  function closeWeeklyReviewModal() {
    var modal = document.getElementById('weeklyReviewModal');
    if (modal) modal.style.display = 'none';
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
      '<h3 class="home-weekly-review-title">' + escapeHTML(t('weeklyReview.card.title')) + '</h3>' +
      '<p class="home-weekly-review-lead">' + escapeHTML(t('weeklyReview.card.lead')) + '</p>' +
      '<button type="button" class="action-btn home-weekly-review-start" data-ripple>' + escapeHTML(t('weeklyReview.card.action')) + '</button>' +
      '<button type="button" class="text-btn home-weekly-review-dismiss">' + escapeHTML(t('weeklyReview.card.dismiss')) + '</button>';
    var startBtn = card.querySelector('.home-weekly-review-start');
    if (startBtn) startBtn.onclick = openWeeklyReviewModal;
    var dismissBtn = card.querySelector('.home-weekly-review-dismiss');
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

  function renderSettingsCrossCutting() {
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
    var phqBtn = document.getElementById('mentalHealthPhq2Btn');
    if (phqBtn) phqBtn.onclick = function () { openScreeningModal('phq2'); };
    var gadBtn = document.getElementById('mentalHealthGad2Btn');
    if (gadBtn) gadBtn.onclick = function () { openScreeningModal('gad2'); };
    renderSettingsCrossCutting();
    bindChartsPresentationMode();
  }

  global.RianellWeeklyReview = {
    openWeeklyReviewModal: openWeeklyReviewModal,
    openScreeningModal: openScreeningModal,
    renderHomeWeeklyReviewCard: renderHomeWeeklyReviewCard,
    bindWeeklyReviewModule: bindWeeklyReviewModule,
    bindChartsPresentationMode: bindChartsPresentationMode,
    renderSettingsCrossCutting: renderSettingsCrossCutting,
  };
})(typeof window !== 'undefined' ? window : globalThis);
