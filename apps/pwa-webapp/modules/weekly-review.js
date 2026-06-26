(function (global) {

  'use strict';



  var S = global.RianellShared || {};

  var _step = 0;

  var _briefText = '';

  var _screeningKind = 'phq2';

  var _screeningResponses = {};

  var _screeningResult = false;

  var _screeningPhase = 'initial';

  var _initialScreeningResponses = {};

  var _screeningMergedResponses = {};

  var _screeningFullInstrument = false;

  var _modalMode = null;

  var _carouselBound = false;



  var STEP_ICONS = {

    correlations: 'chart-bars',

    digest: 'chart-up',

    brief: 'stethoscope',

    confirm: 'document',

    pdf: 'document',

  };



  function withCatalogsReady(fn) {

    var I = global.RianellI18n;

    if (I && typeof I.ensureCatalogs === 'function') {

      var loc = typeof I.getLocale === 'function' ? I.getLocale() : 'en-GB';

      return I.ensureCatalogs(loc).then(fn).catch(fn);

    }

    fn();

  }



  function svgIcon(name, className) {

    if (typeof global.svgIcon === 'function') return global.svgIcon(name, className || 'ui-svg-icon');

    return '<svg class="' + (className || 'ui-svg-icon') + '" aria-hidden="true"><use href="#icon-' + escapeHTML(name) + '"></use></svg>';

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

    _screeningPhase = 'initial';

    _initialScreeningResponses = {};

    _screeningMergedResponses = {};

    _screeningFullInstrument = false;

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



  function getScreeningQuestionsForPhase() {

    if (_screeningPhase === 'followup') {

      return _screeningKind === 'gad2'

        ? (S.GAD7_FOLLOWUP_QUESTIONS || [])

        : (S.PHQ9_FOLLOWUP_QUESTIONS || []);

    }

    return _screeningKind === 'gad2' ? (S.GAD2_QUESTIONS || []) : (S.PHQ2_QUESTIONS || []);

  }



  function renderScreeningModalBody() {

    var body = document.getElementById('weeklyReviewModalBody');

    if (!body || !S.SCREENING_RESPONSE_OPTIONS) return;

    var questions = getScreeningQuestionsForPhase();

    var options = S.SCREENING_RESPONSE_OPTIONS || [];

    var html = '<p class="settings-hint screening-disclaimer">' + escapeHTML(t('mentalHealth.disclaimer')) + '</p>';

    if (!_screeningResult) {

      if (_screeningPhase === 'followup') {

        var introKey = _screeningKind === 'gad2' ? 'mentalHealth.gad2.followUpIntro' : 'mentalHealth.phq2.followUpIntro';

        html += '<p class="settings-hint screening-followup-intro">' + escapeHTML(t(introKey)) + '</p>';

      }

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

      var submitKey = _screeningPhase === 'followup' ? 'mentalHealth.submitFollowUp' : 'mentalHealth.submit';

      html += '<div class="screening-submit-footer"><button type="button" class="action-btn screening-submit-btn" id="screeningSubmitBtn">' + escapeHTML(t(submitKey)) + '</button></div>';

    } else {

      var scored = { total: 0 };

      var interp = { i18n: 'mentalHealth.phq2.low' };

      var maxScore = 6;

      if (_screeningFullInstrument) {

        scored = _screeningKind === 'gad2'

          ? (S.scoreGad7FromResponses ? S.scoreGad7FromResponses(_screeningMergedResponses) : { total: 0 })

          : (S.scorePhq9FromResponses ? S.scorePhq9FromResponses(_screeningMergedResponses) : { total: 0 });

        interp = _screeningKind === 'gad2'

          ? (S.interpretGad7Score ? S.interpretGad7Score(scored.total) : { i18n: 'mentalHealth.gad7.severity.minimal' })

          : (S.interpretPhq9Score ? S.interpretPhq9Score(scored.total) : { i18n: 'mentalHealth.phq9.severity.minimal' });

        maxScore = _screeningKind === 'gad2' ? (S.GAD7_MAX_SCORE || 21) : (S.PHQ9_MAX_SCORE || 27);

        if (_screeningKind === 'phq2' && S.isPhq9SuicideItemPositive && S.isPhq9SuicideItemPositive(_screeningMergedResponses)) {

          html += '<div class="phq9-crisis-card screening-item9-crisis" role="alert"><strong>' + escapeHTML(t('mentalHealth.phq9.item9Crisis')) + '</strong></div>';

        }

      } else {

        var initialQuestions = _screeningKind === 'gad2' ? (S.GAD2_QUESTIONS || []) : (S.PHQ2_QUESTIONS || []);

        var initialResponses = initialQuestions.map(function (q) { return { value: _screeningResponses[q.id] }; });

        scored = S.scoreScreeningResponses ? S.scoreScreeningResponses(initialResponses) : { total: 0 };

        interp = _screeningKind === 'gad2'

          ? (S.interpretGad2Score ? S.interpretGad2Score(scored.total) : { i18n: 'mentalHealth.gad2.low' })

          : (S.interpretPhq2Score ? S.interpretPhq2Score(scored.total) : { i18n: 'mentalHealth.phq2.low' });

        maxScore = _screeningKind === 'gad2' ? (S.GAD2_MAX_SCORE || 6) : (S.PHQ2_MAX_SCORE || 6);

      }

      html += '<p><strong>' + escapeHTML(t('mentalHealth.result.title')) + '</strong></p>';

      html += '<p>' + escapeHTML(t(interp.i18n)) + ' (' + scored.total + '/' + maxScore + ')</p>';

      var crisis = S.getCrisisResourcesForRegion ? S.getCrisisResourcesForRegion(getSettings().privacyRegion || 'other') : [];

      if (crisis.length) {

        html += '<div class="crisis-help-buttons" role="group" aria-label="' + escapeHTML(t('mentalHealth.crisis.groupLabel')) + '">';

        crisis.forEach(function (link) {

          html += '<a class="crisis-help-btn" href="' + escapeHTML(link.url) + '" target="_blank" rel="noopener noreferrer">'

            + svgIcon('life-ring')

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

      if (_screeningPhase === 'initial') {

        var initialQuestions = _screeningKind === 'gad2' ? (S.GAD2_QUESTIONS || []) : (S.PHQ2_QUESTIONS || []);

        var initialResponses = initialQuestions.map(function (q) { return { value: _screeningResponses[q.id] }; });

        var initialScored = S.scoreScreeningResponses ? S.scoreScreeningResponses(initialResponses) : { total: 0 };

        var offerFollowUp = _screeningKind === 'gad2'

          ? (S.shouldOfferGad7FollowUp ? S.shouldOfferGad7FollowUp(initialScored.total) : false)

          : (S.shouldOfferPhq9FollowUp ? S.shouldOfferPhq9FollowUp(initialScored.total) : false);

        if (offerFollowUp) {

          _initialScreeningResponses = Object.assign({}, _screeningResponses);

          _screeningPhase = 'followup';

          _screeningResponses = {};

          var followUpQs = getScreeningQuestionsForPhase();

          followUpQs.forEach(function (q) { _screeningResponses[q.id] = 0; });

          renderScreeningModalBody();

          return;

        }

        _screeningFullInstrument = false;

      } else if (_screeningPhase === 'followup') {

        _screeningMergedResponses = _screeningKind === 'gad2'

          ? (S.mergeGad7Responses ? S.mergeGad7Responses(_initialScreeningResponses, _screeningResponses) : {})

          : (S.mergePhq9Responses ? S.mergePhq9Responses(_initialScreeningResponses, _screeningResponses) : {});

        _screeningFullInstrument = true;

      }

      _screeningPhase = 'result';

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



  function readScaleMetric(log, field) {

    var raw = log && log[field];

    if (raw == null || raw === '') return null;

    var n = typeof raw === 'number' ? raw : parseFloat(String(raw));

    if (!Number.isFinite(n) || n < 0 || n > 10) return null;

    return n;

  }



  function metricSeries(logArr, metric, days) {

    var sorted = logArr.slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

    var slice = sorted.slice(-days);

    return slice.map(function (l) { return readScaleMetric(l, metric); }).filter(function (v) { return v != null; });

  }



  function renderSparkline(values, tone) {

    if (!values.length) return '';

    var w = 64;

    var h = 32;

    var pad = 3;

    var min = Math.min.apply(null, values);

    var max = Math.max.apply(null, values);

    var range = max - min || 1;

    var pts = values.map(function (v, i) {

      var x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);

      var y = h - pad - ((v - min) / range) * (h - pad * 2);

      return x.toFixed(1) + ',' + y.toFixed(1);

    }).join(' ');

    var cls = 'weekly-review-sparkline' + (tone ? ' weekly-review-sparkline--' + tone : '');

    return '<svg class="' + cls + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">'

      + '<polyline fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" points="' + pts + '"/></svg>';

  }



  function renderCompareBars(prior, current, kind) {

    var max = 10;

    var priorH = Math.max(4, Math.round((prior / max) * 100));

    var currentH = Math.max(4, Math.round((current / max) * 100));

    var tone = kind === 'concern' ? 'concern' : 'positive';

    return '<div class="weekly-review-compare-bars weekly-review-compare-bars--' + tone + '" aria-hidden="true">'

      + '<div class="weekly-review-compare-bar-wrap"><span class="weekly-review-compare-label">' + escapeHTML(t('weeklyReview.chart.prior')) + '</span>'

      + '<div class="weekly-review-compare-bar" style="height:' + priorH + '%"></div><span class="weekly-review-compare-value">' + prior.toFixed(1) + '</span></div>'

      + '<div class="weekly-review-compare-bar-wrap"><span class="weekly-review-compare-label">' + escapeHTML(t('weeklyReview.chart.thisWeek')) + '</span>'

      + '<div class="weekly-review-compare-bar weekly-review-compare-bar--current" style="height:' + currentH + '%"></div><span class="weekly-review-compare-value">' + current.toFixed(1) + '</span></div>'

      + '</div>';

  }



  function correlationCards(logArr) {

    var engine = global.RianellAIEngine;

    if (!engine || typeof engine.buildCorrelationCards !== 'function') return [];

    var cards = engine.buildCorrelationCards(logArr, 14);

    if (S.summarizeCorrelationStep) return S.summarizeCorrelationStep(cards);

    return (cards || []).slice(0, 3);

  }



  function digestFromLogs(logArr) {

    var engine = global.RianellAIEngine;

    if (!engine || typeof engine.runDeterministicAnalysis !== 'function') {

      return S.summarizeDigestStep ? S.summarizeDigestStep(null) : { headline: '', improvements: [], concerns: [], changes: [] };

    }

    var analysis = engine.runDeterministicAnalysis(logArr, 14, { goals: getSettings().goals });

    return S.summarizeDigestStep ? S.summarizeDigestStep(analysis && analysis.weeklyDigest) : { headline: '', improvements: [], concerns: [], changes: [] };

  }



  function correlationSummaryText(card) {

    var coef = card.coefficient != null ? Math.abs(card.coefficient).toFixed(2) : '';

    var confKey = card.confidence ? 'weeklyReview.correlation.confidence.' + card.confidence : 'weeklyReview.correlation.confidence.low';

    var dirKey = card.direction === 'positive' ? 'weeklyReview.correlation.positive' : 'weeklyReview.correlation.negative';

    return t('weeklyReview.correlation.lead', {

      label: card.label || '',

      direction: t(dirKey),

      confidence: t(confKey),

      coef: coef,

    });

  }



  function metricLabel(metric) {

    var key = 'weeklyReview.metric.' + metric;

    var val = t(key);

    return val === key ? (metric || '') : val;

  }



  function digestItemText(change) {

    if (!change) return '';

    return t('weeklyReview.digest.change', {

      metric: metricLabel(change.metric),

      prior: String(change.priorAvg),

      current: String(change.thisAvg),

      kind: change.kind === 'concern' ? t('weeklyReview.digest.kind.concern') : t('weeklyReview.digest.kind.improvement'),

    });

  }



  function renderWeeklyReviewEmptyState(messageKey) {
    return '<div class="weekly-review-empty-state">' +
      svgIcon('calendar', 'weekly-review-empty-icon') +
      '<h4 class="weekly-review-empty-title">' + escapeHTML(t('weeklyReview.empty.warm.title')) + '</h4>' +
      '<p class="weekly-review-empty-message">' + escapeHTML(t(messageKey)) + '</p></div>';
  }

  function renderCorrelationPane(logArr) {

    var cards = correlationCards(logArr);

    if (!cards.length) {

      return '<div class="weekly-review-pane-inner weekly-review-pane-inner--empty">'

        + renderWeeklyReviewEmptyState('weeklyReview.correlations.empty.warm') + '</div>';

    }

    var html = '<div class="weekly-review-pane-inner">';

    html += '<p class="weekly-review-pane-lede">' + escapeHTML(t('weeklyReview.correlations.lede')) + '</p>';

    cards.forEach(function (card) {

      var m1 = card.metric1 || 'mood';

      var m2 = card.metric2 || 'sleep';

      var s1 = metricSeries(logArr, m1, 14);

      var s2 = metricSeries(logArr, m2, 14);

      html += '<article class="weekly-review-data-row">';

      html += '<div class="weekly-review-data-copy">';

      html += '<h4 class="weekly-review-data-title">' + svgIcon('balance', 'weekly-review-row-icon') + '<span>' + escapeHTML(card.label) + '</span></h4>';

      html += '<p class="weekly-review-data-detail">' + escapeHTML(correlationSummaryText(card)) + '</p>';

      if (card.coefficient != null) {

        html += '<span class="weekly-review-badge">' + escapeHTML(t('weeklyReview.correlation.coef', { value: String(card.coefficient) })) + '</span>';

      }

      html += '</div>';

      html += '<div class="weekly-review-data-charts">';

      html += '<div class="weekly-review-dual-spark">';

      html += '<div class="weekly-review-spark-block"><span class="weekly-review-spark-label">' + escapeHTML(card.label1 || m1) + '</span>' + renderSparkline(s1, 'a') + '</div>';

      html += '<div class="weekly-review-spark-block"><span class="weekly-review-spark-label">' + escapeHTML(card.label2 || m2) + '</span>' + renderSparkline(s2, 'b') + '</div>';

      html += '</div></div></article>';

    });

    html += '</div>';

    return html;

  }



  function renderDigestPane(logArr) {

    var digest = digestFromLogs(logArr);

    var changes = digest.changes && digest.changes.length ? digest.changes : [];

    var html = '<div class="weekly-review-pane-inner">';

    html += '<p class="weekly-review-pane-headline">' + escapeHTML(digest.headline || t('weeklyReview.digest.empty')) + '</p>';

    if (!changes.length) {

      html += renderWeeklyReviewEmptyState('weeklyReview.digest.empty.warm');

    } else {

      html += '<p class="weekly-review-pane-lede">' + escapeHTML(t('weeklyReview.digest.lede')) + '</p>';

      changes.forEach(function (change) {

        var tone = change.kind === 'concern' ? 'concern' : 'positive';

        html += '<article class="weekly-review-data-row weekly-review-data-row--' + tone + '">';

        html += '<div class="weekly-review-data-copy">';

        html += '<h4 class="weekly-review-data-title">' + svgIcon(change.kind === 'concern' ? 'chart-down' : 'chart-up', 'weekly-review-row-icon') + '<span>' + escapeHTML(metricLabel(change.metric)) + '</span></h4>';

        html += '<p class="weekly-review-data-detail">' + escapeHTML(digestItemText(change)) + '</p>';

        html += '</div>';

        html += '<div class="weekly-review-data-charts">' + renderCompareBars(change.priorAvg, change.thisAvg, change.kind) + '</div>';

        html += '</article>';

      });

    }

    html += '</div>';

    return html;

  }



  function renderBriefPane() {

    return '<div class="weekly-review-pane-inner">'

      + '<p class="weekly-review-pane-lede">' + escapeHTML(t('weeklyReview.brief.lede')) + '</p>'

      + '<div class="weekly-review-brief-card">' + svgIcon('stethoscope', 'weekly-review-brief-icon') + '<p>' + escapeHTML(_briefText || t('weeklyReview.brief.fallback')) + '</p></div>'

      + '</div>';

  }



  function renderConfirmPane() {

    return '<div class="weekly-review-pane-inner weekly-review-pane-inner--center">'

      + svgIcon('document', 'weekly-review-confirm-icon')

      + '<p class="weekly-review-pane-headline">' + escapeHTML(t('weeklyReview.confirm.lead')) + '</p>'

      + '<p class="weekly-review-pane-lede">' + escapeHTML(t('weeklyReview.confirm.detail')) + '</p>'

      + '</div>';

  }



  function renderPdfPane() {

    return '<div class="weekly-review-pane-inner weekly-review-pane-inner--center">'

      + svgIcon('document', 'weekly-review-confirm-icon')

      + '<p class="weekly-review-pane-headline">' + escapeHTML(t('weeklyReview.pdf.lead')) + '</p>'

      + '<button type="button" class="action-btn weekly-review-pdf-btn" id="weeklyReviewPdfBtn">'

      + svgIcon('share', 'weekly-review-btn-icon') + '<span>' + escapeHTML(t('weeklyReview.pdf.action')) + '</span></button>'

      + '</div>';

  }



  function renderStepPane(step, logArr) {

    if (!step) return '';

    if (step.id === 'correlations') return renderCorrelationPane(logArr);

    if (step.id === 'digest') return renderDigestPane(logArr);

    if (step.id === 'brief') return renderBriefPane();

    if (step.id === 'confirm') return renderConfirmPane();

    if (step.id === 'pdf') return renderPdfPane();

    return '';

  }



  function weeklyReviewCarouselGo(i) {

    var steps = S.WEEKLY_REVIEW_STEPS || [];

    var n = steps.length;

    if (n < 1) return;

    if (i < 0) i = 0;

    if (i >= n) i = n - 1;

    _step = i;



    var track = document.getElementById('weeklyReviewCarouselTrack');

    var vp = document.getElementById('weeklyReviewCarouselViewport');

    var meta = document.getElementById('weeklyReviewCarouselMeta');

    var prev = document.getElementById('weeklyReviewCarouselPrev');

    var next = document.getElementById('weeklyReviewCarouselNext');

    if (!track || !vp) return;



    track.setAttribute('data-weekly-index', String(i));

    track.style.setProperty('--settings-pane-index', String(i));

    track.style.setProperty('--settings-pane-count', String(n));

    vp.style.setProperty('--settings-pane-count', String(n));



    var dotsWrap = document.getElementById('weeklyReviewCarouselDots');

    if (dotsWrap) dotsWrap.style.setProperty('--settings-pane-count', String(n));



    if (prev) {

      prev.disabled = i <= 0;

      prev.setAttribute('aria-disabled', i <= 0 ? 'true' : 'false');

    }

    if (next) {

      next.disabled = i >= n - 1;

      next.setAttribute('aria-disabled', i >= n - 1 ? 'true' : 'false');

    }



    var panes = track.querySelectorAll('.settings-carousel-pane');

    panes.forEach(function (p, idx) {

      var active = idx === i;

      p.classList.toggle('settings-carousel-pane--active', active);

      p.setAttribute('aria-hidden', active ? 'false' : 'true');

      if ('inert' in p) p.inert = !active;

    });



    var step = steps[i];

    var title = step ? t(step.i18n) : '';

    if (meta) meta.textContent = String(i + 1) + ' / ' + n + (title ? ' · ' + title : '');



    var dots = document.querySelectorAll('#weeklyReviewCarouselDots .settings-carousel-dot');

    for (var d = 0; d < dots.length; d++) {

      var dotActive = d === i;

      dots[d].classList.toggle('settings-carousel-dot--active', dotActive);

      dots[d].setAttribute('aria-current', dotActive ? 'true' : 'false');

    }



    if (step && step.id === 'brief' && !_briefText) {

      loadBriefText().then(function () {

        var pane = document.getElementById('weeklyReviewPane-brief');

        if (pane) pane.innerHTML = renderBriefPane();

      });

    }



    var pdfBtn = document.getElementById('weeklyReviewPdfBtn');

    if (pdfBtn) pdfBtn.onclick = finishWeeklyReviewPdf;

  }



  function weeklyReviewCarouselStep(delta) {

    weeklyReviewCarouselGo(_step + delta);

  }



  function ensureWeeklyReviewCarouselDots(steps) {

    var dotsWrap = document.getElementById('weeklyReviewCarouselDots');

    if (!dotsWrap || dotsWrap.childElementCount === steps.length) return;

    dotsWrap.innerHTML = '';

    steps.forEach(function (step, idx) {

      var dot = document.createElement('button');

      var paneTitle = t(step.i18n);

      var icon = STEP_ICONS[step.id] || 'document';

      dot.className = 'settings-carousel-dot';

      dot.type = 'button';

      dot.setAttribute('aria-label', t('weeklyReview.tab.goto', { index: String(idx + 1), title: paneTitle }));

      dot.setAttribute('title', paneTitle);

      dot.setAttribute('data-weekly-target', String(idx));

      dot.innerHTML = '<span class="settings-carousel-dot__icon" aria-hidden="true">' + svgIcon(icon) + '</span>';

      dot.addEventListener('click', function (e) {

        var target = parseInt(e.currentTarget.getAttribute('data-weekly-target') || '0', 10);

        weeklyReviewCarouselGo(target);

      });

      dotsWrap.appendChild(dot);

    });

  }



  function bindWeeklyReviewCarouselOnce() {

    if (_carouselBound) return;

    _carouselBound = true;

    var prev = document.getElementById('weeklyReviewCarouselPrev');

    var next = document.getElementById('weeklyReviewCarouselNext');

    if (prev) prev.onclick = function () { weeklyReviewCarouselStep(-1); };

    if (next) next.onclick = function () { weeklyReviewCarouselStep(1); };



    var vp = document.getElementById('weeklyReviewCarouselViewport');

    if (vp) {

      var touchStartX = null;

      vp.addEventListener('touchstart', function (e) {

        if (e.touches && e.touches.length === 1) touchStartX = e.touches[0].clientX;

      }, { passive: true });

      vp.addEventListener('touchend', function (e) {

        if (touchStartX == null || !e.changedTouches || !e.changedTouches.length) return;

        var dx = e.changedTouches[0].clientX - touchStartX;

        touchStartX = null;

        if (Math.abs(dx) < 48) return;

        if (dx > 0) weeklyReviewCarouselStep(-1);

        else weeklyReviewCarouselStep(1);

      }, { passive: true });

    }

  }



  function renderWeeklyReviewModalBody() {

    var body = document.getElementById('weeklyReviewModalBody');

    if (!body) return;

    var steps = S.WEEKLY_REVIEW_STEPS || [];

    var logArr = getLogs();

    var n = steps.length || 5;



    var html = '<div class="weekly-review-carousel settings-carousel">';

    html += '<button type="button" class="settings-carousel-side settings-carousel-side--prev" id="weeklyReviewCarouselPrev" aria-label="' + escapeHTML(t('common.back')) + '">‹</button>';

    html += '<div class="weekly-review-carousel-main">';

    html += '<p class="settings-carousel-meta" id="weeklyReviewCarouselMeta"></p>';

    html += '<div class="settings-carousel-dots" id="weeklyReviewCarouselDots" role="tablist" aria-label="' + escapeHTML(t('weeklyReview.carousel.sections')) + '"></div>';

    html += '<div class="settings-carousel-viewport weekly-review-carousel-viewport" id="weeklyReviewCarouselViewport">';

    html += '<div class="settings-carousel-track" id="weeklyReviewCarouselTrack" data-weekly-index="' + String(_step) + '">';

    steps.forEach(function (step) {

      html += '<section class="settings-carousel-pane" id="weeklyReviewPane-' + escapeHTML(step.id) + '" role="tabpanel">';

      html += renderStepPane(step, logArr);

      html += '</section>';

    });

    html += '</div></div></div>';

    html += '<button type="button" class="settings-carousel-side settings-carousel-side--next" id="weeklyReviewCarouselNext" aria-label="' + escapeHTML(t('common.next')) + '">›</button>';

    html += '</div>';



    body.innerHTML = html;

    body.classList.add('weekly-review-modal-body');

    ensureWeeklyReviewCarouselDots(steps);

    bindWeeklyReviewCarouselOnce();

    weeklyReviewCarouselGo(_step);

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

      modal.classList.remove('screening-modal-open');

      setWeeklyReviewModalTitle('weeklyReview.title');

      renderWeeklyReviewModalBody();

    });

  }



  var _weeklyReviewCompleted = false;

  function closeWeeklyReviewModal() {

    var wasCompleted = _weeklyReviewCompleted;
    var modal = document.getElementById('weeklyReviewModal');

    if (modal) {

      modal.style.display = 'none';

      modal.classList.remove('screening-modal-open');

    }

    var body = document.getElementById('weeklyReviewModalBody');

    if (body) body.classList.remove('weekly-review-modal-body');

    _modalMode = null;

    _screeningResult = false;

    _screeningResponses = {};

    _screeningPhase = 'initial';

    _initialScreeningResponses = {};

    _screeningMergedResponses = {};

    _screeningFullInstrument = false;

    setWeeklyReviewModalTitle('weeklyReview.title');

    if (wasCompleted && typeof global.showToast === 'function') {
      global.showToast(t('gamification.weeklyReview.complete'), { type: 'success' });
    }
    _weeklyReviewCompleted = false;

  }



  function finishWeeklyReviewPdf() {

    if (typeof global.printOrShareAppointmentReport === 'function') {

      global.printOrShareAppointmentReport({ briefText: _briefText, doctorQuestions: [] });

    }

    var today = new Date().toISOString().slice(0, 10);

    if (S.isoWeekMondayKey) {

      saveSettingsPatch({ weeklyReviewDismissedWeek: S.isoWeekMondayKey(today), weeklyReviewCompletedAt: new Date().toISOString() });

    }

    _weeklyReviewCompleted = true;

    closeWeeklyReviewModal();

    if (typeof global.applyHomeCardLayout === 'function') global.applyHomeCardLayout();

  }



  function isWeeklyReviewLlmReady() {

    var settings = getSettings();

    if (!settings || settings.aiEnabled === false) return false;

    var status = (typeof global.getAiModelStatus === 'function') ? global.getAiModelStatus() : null;

    return !!(status && status.state === 'ready');

  }



  function requestWeeklyReviewAi() {

    var settings = getSettings();

    if (settings && settings.aiEnabled === false) {

      if (global.appSettings) global.appSettings.aiEnabled = true;

      if (typeof global.saveSettings === 'function') global.saveSettings();

      if (typeof global.loadSettingsState === 'function') global.loadSettingsState();

      if (typeof global.applyAIFeatureVisibility === 'function') global.applyAIFeatureVisibility();

    }

    if (isWeeklyReviewLlmReady()) {

      openWeeklyReviewModal();

      return;

    }

    var ensure = (typeof global.ensureSummaryLlmLoadedForSettings === 'function')

      ? global.ensureSummaryLlmLoadedForSettings()

      : Promise.resolve();

    ensure.then(function () {

      if (isWeeklyReviewLlmReady()) {

        openWeeklyReviewModal();

        return;

      }

      if (typeof global.promptAiModelDownloadConsent === 'function') {

        global.promptAiModelDownloadConsent().then(function (granted) {

          if (granted && typeof global.preloadSummaryLLM === 'function') {

            global.preloadSummaryLLM().then(function () {

              if (typeof global.applyHomeCardLayout === 'function') global.applyHomeCardLayout();

              if (typeof global.renderHomeAiSuggestions === 'function') global.renderHomeAiSuggestions();

            }).catch(function () {});

          }

        });

      }

    });

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

    var aiReady = isWeeklyReviewLlmReady();

    var actionKey = aiReady ? 'weeklyReview.card.action' : 'weeklyReview.card.enableAi';

    var actionIcon = aiReady ? 'chart-bars' : 'brain';

    card.innerHTML =

      '<button type="button" class="home-inset-dismiss" aria-label="' + escapeHTML(t('common.close')) + '">&times;</button>' +

      '<div class="home-weekly-review-head">' +

      '<span class="home-weekly-review-icon" aria-hidden="true">' + svgIcon('calendar') + '</span>' +

      '<div class="home-weekly-review-copy">' +

      '<h4 class="home-inset-title">' + escapeHTML(t('weeklyReview.card.title')) + '</h4>' +

      '<p class="home-inset-body">' + escapeHTML(t('weeklyReview.card.lead')) + '</p>' +

      '</div></div>' +

      '<div class="home-inset-actions">' +

      '<button type="button" class="action-btn home-weekly-review-start" data-ripple>' +

      svgIcon(actionIcon, 'weekly-review-btn-icon') +

      '<span>' + escapeHTML(t(actionKey)) + '</span></button>' +

      '</div>';

    var startBtn = card.querySelector('.home-weekly-review-start');

    if (startBtn) startBtn.onclick = aiReady ? openWeeklyReviewModal : requestWeeklyReviewAi;

    var dismissBtn = card.querySelector('.home-inset-dismiss');

    if (dismissBtn) dismissBtn.onclick = function () {

      if (S.isoWeekMondayKey) saveSettingsPatch({ weeklyReviewDismissedWeek: S.isoWeekMondayKey(todayStr) });

      if (typeof global.applyHomeCardLayout === 'function') global.applyHomeCardLayout();

    };

    if (typeof global.initRipple === 'function') global.initRipple(card);

  }



  function bindWeeklyReviewModule() {

    var closeBtn = document.getElementById('weeklyReviewModalClose');

    if (closeBtn) closeBtn.onclick = closeWeeklyReviewModal;

    if (global.RianellI18n && typeof global.RianellI18n.onLocaleChange === 'function') {

      global.RianellI18n.onLocaleChange(function () { refreshOpenModalI18n(); });

    }

    withCatalogsReady(renderSettingsPerformanceLearn);

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



  global.RianellWeeklyReview = {

    openWeeklyReviewModal: openWeeklyReviewModal,

    openScreeningModal: openScreeningModal,

    renderHomeWeeklyReviewCard: renderHomeWeeklyReviewCard,

    bindWeeklyReviewModule: bindWeeklyReviewModule,

    renderSettingsPerformanceLearn: renderSettingsPerformanceLearn,

    /** @deprecated use renderSettingsPerformanceLearn */

    renderSettingsCrossCutting: renderSettingsPerformanceLearn,

    refreshOpenModalI18n: refreshOpenModalI18n,

  };

})(typeof window !== 'undefined' ? window : globalThis);


