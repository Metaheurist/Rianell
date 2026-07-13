(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var _moodRangeDays = 14;
  var _moodSelectedPeriod = null;
  var _moodPeriodUserPick = false;

  function resetCheckinSelection() {
    _moodPeriodUserPick = false;
    _moodSelectedPeriod = null;
  }

  function t(key, params) {
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

  function escapeAttr(s) {
    return escapeHTML(s);
  }

  function checkinPeriodLabelKey(period) {
    if (period === 'AM') return 'home.checkin.am';
    if (period === 'PM') return 'home.checkin.pm';
    return 'home.checkin.midday';
  }

  function getLogs() {
    return global.logs && Array.isArray(global.logs) ? global.logs : [];
  }

  function getSettings() {
    return global.appSettings || {};
  }

  function getTodayStr() {
    if (typeof global.getTodayDateStr === 'function') return global.getTodayDateStr();
    return new Date().toISOString().slice(0, 10);
  }

  function moodTarget() {
    var g = getSettings().goals || {};
    var n = Number(g.moodTarget);
    return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : 7;
  }

  function withCatalogsReady(fn) {
    var I = global.RianellI18n;
    if (I && typeof I.ensureCatalogs === 'function') {
      var loc = typeof I.getLocale === 'function' ? I.getLocale() : 'en-GB';
      return I.ensureCatalogs(loc).then(fn).catch(fn);
    }
    fn();
  }

  function periodLabel(period) {
    if (period === 'AM') return t('mood.period.am');
    if (period === 'PM') return t('mood.period.pm');
    if (period === 'midday') return t('mood.period.midday');
    return '';
  }

  function checkinPeriodIconName(period) {
    if (period === 'AM') return 'checkin-am';
    if (period === 'PM') return 'checkin-pm';
    return 'checkin-midday';
  }

  function svgIcon(name, className) {
    if (typeof global.svgIcon === 'function') return global.svgIcon(name, className);
    var safeName = String(name || '').replace(/[^a-z0-9-]/gi, '');
    var cls = className || 'ui-svg-icon';
    return '<svg class="' + cls + '" aria-hidden="true"><use href="#icon-' + safeName + '"></use></svg>';
  }

  function moodToneFromScore(score) {
    var n = Number(score);
    if (!Number.isFinite(n)) return 'neutral';
    if (n <= 3) return 'low';
    if (n <= 5) return 'moderate';
    if (n <= 7) return 'okay';
    return 'good';
  }

  function formatMoodTimelineDate(dateStr) {
    if (!dateStr || dateStr.length < 10) return dateStr || '';
    var m = parseInt(dateStr.slice(5, 7), 10);
    var d = parseInt(dateStr.slice(8, 10), 10);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!Number.isFinite(m) || m < 1 || m > 12) return dateStr.slice(5);
    return months[m - 1] + ' ' + d;
  }

  function readingSourceLabel(r) {
    if (r.source === 'checkin') {
      if (r.period) return periodLabel(r.period);
      return t('mood.source.checkin');
    }
    return t('mood.source.daily');
  }

  function renderMoodRing(score, tone, size) {
    var s = Number(score);
    var pct = Math.min(100, Math.max(0, (s / 10) * 100));
    var r = (size - 8) / 2;
    var cx = size / 2;
    var cy = size / 2;
    var circ = 2 * Math.PI * r;
    var offset = circ * (1 - pct / 100);
    return '<svg class="mood-ring mood-ring--' + tone + '" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
      '<circle class="mood-ring-bg" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
      '<circle class="mood-ring-fill" cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
      'transform="rotate(-90 ' + cx + ' ' + cy + ')" ' +
      'stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + circ.toFixed(2) + '" ' +
      'style="--mood-ring-circ:' + circ.toFixed(2) + ';--mood-ring-offset:' + offset.toFixed(2) + '"/>' +
      '<text class="mood-ring-score" x="' + cx + '" y="' + cy + '" dominant-baseline="central" text-anchor="middle">' +
      escapeHTML(String(s)) + '</text></svg>';
  }

  function renderMoodTargetProgressRing(pct, size) {
    var p = Math.min(100, Math.max(0, Number(pct) || 0));
    var tone = p >= 80 ? 'good' : p >= 50 ? 'okay' : p > 0 ? 'moderate' : 'neutral';
    var r = (size - 8) / 2;
    var cx = size / 2;
    var cy = size / 2;
    var circ = 2 * Math.PI * r;
    var offset = circ * (1 - p / 100);
    return '<svg class="mood-readings-ring mood-ring mood-ring--' + tone + '" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
      '<circle class="mood-ring-bg" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
      '<circle class="mood-ring-fill" cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
      'transform="rotate(-90 ' + cx + ' ' + cy + ')" ' +
      'stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + circ.toFixed(2) + '" ' +
      'style="--mood-ring-circ:' + circ.toFixed(2) + ';--mood-ring-offset:' + offset.toFixed(2) + '"/>' +
      '<text class="mood-readings-ring-pct" x="' + cx + '" y="' + cy + '" dominant-baseline="central" text-anchor="middle">' +
      escapeHTML(String(Math.round(p))) + '%</text></svg>';
  }

  function renderMoodReadingsSummaryCard(summary) {
    var count = summary.count || 0;
    var atTarget = summary.atTargetCount || 0;
    var below = summary.belowTargetCount || 0;
    var target = summary.moodTarget != null ? summary.moodTarget : moodTarget();
    var pct = count > 0 ? Math.round((atTarget / count) * 100) : 0;
    var allHit = count > 0 && below === 0;
    var cardClass = 'mood-metric-card mood-metric-card--readings' + (allHit ? ' mood-metric-card--readings-success' : '');
    var html = '<div class="' + cardClass + '">';
    html += '<span class="mood-metric-label">' + escapeHTML(t('mood.readings.title')) + '</span>';
    html += '<div class="mood-readings-summary" aria-label="' + escapeHTML(t('mood.readings.summaryAria', {
      count: String(count),
      pct: String(pct),
      target: String(target),
      atTarget: String(atTarget),
      below: String(below),
    })) + '">';
    html += '<div class="mood-readings-hero">';
    html += '<div class="mood-readings-count-wrap">';
    html += '<span class="mood-readings-count">' + escapeHTML(String(count)) + '</span>';
    html += '<span class="mood-readings-count-caption">' + escapeHTML(t('mood.readings.inPeriod')) + '</span>';
    html += '</div>';
    html += renderMoodTargetProgressRing(pct, 54);
    html += '</div>';
    html += '<p class="mood-readings-goal">' + svgIcon('target', 'mood-readings-goal-icon') +
      '<span>' + escapeHTML(t('mood.readings.goal', { target: String(target) })) + '</span></p>';
    html += '<div class="mood-readings-bar" role="presentation" aria-hidden="true">' +
      '<div class="mood-readings-bar-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="mood-readings-stats">';
    html += '<div class="mood-readings-stat mood-readings-stat--hit">';
    html += '<span class="mood-readings-stat-icon" aria-hidden="true">' + svgIcon('check', 'mood-readings-stat-svg') + '</span>';
    html += '<span class="mood-readings-stat-value">' + escapeHTML(String(atTarget)) + '</span>';
    html += '<span class="mood-readings-stat-label">' + escapeHTML(t('mood.readings.onTargetShort')) + '</span>';
    html += '</div>';
    html += '<div class="mood-readings-stat mood-readings-stat--miss' + (below === 0 ? ' mood-readings-stat--zero' : '') + '">';
    html += '<span class="mood-readings-stat-icon" aria-hidden="true">' + svgIcon('chart-down', 'mood-readings-stat-svg') + '</span>';
    html += '<span class="mood-readings-stat-value">' + escapeHTML(String(below)) + '</span>';
    html += '<span class="mood-readings-stat-label">' + escapeHTML(t('mood.readings.belowTargetShort')) + '</span>';
    html += '</div>';
    html += '</div>';
    if (allHit) {
      html += '<p class="mood-readings-kudos">' + escapeHTML(t('mood.readings.allOnTarget')) + '</p>';
    } else if (count > 0) {
      html += '<p class="mood-readings-pct-label">' + escapeHTML(t('mood.readings.pctOnTarget', { pct: String(pct) })) + '</p>';
    }
    html += '</div></div>';
    return html;
  }

  function renderMoodReadingWave(readings, cardW) {
    if (!readings || readings.length < 2) return '';
    var h = 88;
    var padTop = 12;
    var padBottom = 10;
    var innerH = h - padTop - padBottom;
    var w = readings.length * cardW;
    var ordered = readings.slice().reverse();
    var pts = ordered.map(function (r, i) {
      var cx = cardW * i + cardW / 2;
      var cy = padTop + innerH - (r.mood / 10) * innerH;
      return { x: cx, y: cy };
    });
    var pathD = pts.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');
    var areaD = pathD + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (h - padBottom).toFixed(1) +
      ' L' + pts[0].x.toFixed(1) + ',' + (h - padBottom).toFixed(1) + ' Z';
    return '<svg class="mood-reading-wave" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="moodReadingWaveFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="currentColor" stop-opacity="0.2"/>' +
      '<stop offset="100%" stop-color="currentColor" stop-opacity="0.02"/>' +
      '</linearGradient></defs>' +
      '<path class="mood-reading-wave-area" d="' + areaD + '" fill="url(#moodReadingWaveFill)"/>' +
      '<path class="mood-reading-wave-path" d="' + pathD + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function readingsAreUniform(readings) {
    if (!readings || readings.length < 3) return false;
    var score = readings[0].mood;
    return readings.every(function (r) { return r.mood === score; });
  }

  function renderMoodUniformStreak(readings) {
    if (!readingsAreUniform(readings)) return '';
    var score = readings[0].mood;
    var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(score) : '';
    var qual = qk ? t(qk) : '';
    var text = t('mood.recent.uniformStreak', {
      count: String(readings.length),
      score: String(score),
      qual: qual ? ' - ' + qual : '',
    });
    if (text === 'mood.recent.uniformStreak') {
      text = readings.length + ' readings in a row at ' + score + '/10' + (qual ? ' - ' + qual : '');
    }
    return '<p class="mood-reading-streak" role="status">' + escapeHTML(text) + '</p>';
  }

  function renderMoodReadingCard(r, i, opts) {
    var tone = moodToneFromScore(r.mood);
    var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(r.mood) : '';
    var qual = qk ? t(qk) : '';
    var compact = opts && opts.compact;
    var srcIcon = r.source === 'checkin'
      ? checkinPeriodIconName(r.period || 'midday')
      : 'chart-bars';
    var aria = r.mood + '/10, ' + r.date + ', ' + readingSourceLabel(r) + (qual ? ', ' + qual : '');
    var html = '<button type="button" class="mood-reading-card mood-reading-card--' + tone +
      (compact ? ' mood-reading-card--compact' : '') + '" data-reading-i="' + i + '" style="--card-i:' + i + '" ' +
      'aria-label="' + escapeHTML(aria) + '">';
    if (compact) {
      html += '<span class="mood-reading-card__badge" aria-hidden="true">' + escapeHTML(String(r.mood)) + '</span>';
    } else {
      html += '<span class="mood-reading-card__ring">' + renderMoodRing(r.mood, tone, 44) + '</span>';
    }
    html += '<span class="mood-reading-card__date">' + escapeHTML(formatMoodTimelineDate(r.date)) + '</span>';
    html += '<span class="mood-reading-card__source">' + svgIcon(srcIcon, 'mood-reading-card__source-icon') +
      '<span>' + escapeHTML(readingSourceLabel(r)) + '</span></span>';
    if (!compact && qual) {
      html += '<span class="mood-reading-card__qual mood-reading-card__qual--' + tone + '">' + escapeHTML(qual) + '</span>';
    }
    html += '</button>';
    return html;
  }

  function moodReadingFocusHtml(r) {
    if (!r) return '';
    var tone = moodToneFromScore(r.mood);
    var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(r.mood) : '';
    var qual = qk ? t(qk) : '';
    return '<div class="mood-reading-focus mood-reading-focus--' + tone + '">' +
      '<div class="mood-reading-focus__ring">' + renderMoodRing(r.mood, tone, 52) + '</div>' +
      '<div class="mood-reading-focus__copy">' +
      '<span class="mood-reading-focus__score">' + escapeHTML(String(r.mood)) + '<span class="mood-reading-focus__suffix">/10</span></span>' +
      '<span class="mood-reading-focus__meta">' + escapeHTML(r.date) + ' · ' + escapeHTML(readingSourceLabel(r)) +
      (qual ? ' · ' + escapeHTML(qual) : '') + '</span>' +
      '</div></div>';
  }

  function renderMoodReadingRibbon(readings) {
    if (!readings || !readings.length) return '';
    var ordered = readings.slice().reverse();
    var latest = ordered[ordered.length - 1];
    var history = ordered.length > 1 ? ordered.slice(0, -1) : [];
    var uniform = readingsAreUniform(readings);
    var compact = history.length >= 2;
    var cardW = compact ? 54 : 76;
    var cardsHtml = history.map(function (r, i) {
      return renderMoodReadingCard(r, i, { compact: compact });
    }).join('');
    var html = '<div class="mood-reading-ribbon' + (uniform ? ' mood-reading-ribbon--uniform' : '') + '" data-reading-count="' + ordered.length + '">';
    html += moodReadingFocusHtml(latest);
    if (uniform) html += renderMoodUniformStreak(readings);
    if (history.length) {
      html += '<div class="mood-reading-ribbon-scroll mood-timeline-scroll" role="list" aria-label="' + escapeHTML(t('mood.recent.history')) + '">';
      html += '<div class="mood-reading-ribbon-inner" style="--mood-card-count:' + history.length + ';--mood-card-w:' + cardW + 'px">';
      if (history.length >= 2) html += renderMoodReadingWave(history, cardW);
      html += '<div class="mood-reading-ribbon-track' + (compact ? ' mood-reading-ribbon-track--compact' : '') + '">' + cardsHtml + '</div>';
      html += '</div></div>';
    }
    html += '</div>';
    return html;
  }

  function updateMoodReadingFocusEl(el, r) {
    if (!el || !r) return;
    var tone = moodToneFromScore(r.mood);
    var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(r.mood) : '';
    var qual = qk ? t(qk) : '';
    el.className = 'mood-reading-focus mood-reading-focus--' + tone;
    el.innerHTML =
      '<div class="mood-reading-focus__ring">' + renderMoodRing(r.mood, tone, 52) + '</div>' +
      '<div class="mood-reading-focus__copy">' +
      '<span class="mood-reading-focus__score">' + escapeHTML(String(r.mood)) + '<span class="mood-reading-focus__suffix">/10</span></span>' +
      '<span class="mood-reading-focus__meta">' + escapeHTML(r.date) + ' · ' + escapeHTML(readingSourceLabel(r)) +
      (qual ? ' · ' + escapeHTML(qual) : '') + '</span></div>';
  }

  function formatMoodFullDate(dateStr) {
    if (!dateStr || dateStr.length < 10) return dateStr || '';
    try {
      var d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_err) {
      return dateStr;
    }
  }

  function getLogForDate(dateStr) {
    return getLogs().find(function (l) { return l && l.date === dateStr; }) || null;
  }

  function collectReadingsForDate(dateStr) {
    if (S && typeof S.collectMoodReadings === 'function') {
      return S.collectMoodReadings(getLogs(), 366, getTodayStr()).filter(function (r) {
        return r.date === dateStr;
      });
    }
    return [];
  }

  function clampScore(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function renderMoodDayMetricRow(labelKey, score) {
    var n = clampScore(score);
    if (n == null) return '';
    var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(n) : '';
    var qual = qk ? t(qk) : '';
    var tone = moodToneFromScore(n);
    return '<div class="mood-day-metric mood-day-metric--' + tone + '">' +
      '<span class="mood-day-metric__label">' + escapeHTML(t(labelKey)) + '</span>' +
      '<span class="mood-day-metric__value">' + escapeHTML(String(n)) + '<span class="mood-day-metric__suffix">/10</span></span>' +
      (qual ? '<span class="mood-day-metric__qual">' + escapeHTML(qual) + '</span>' : '') +
      '</div>';
  }

  function renderMoodDayCheckinCard(sub) {
    if (!sub || typeof sub !== 'object') return '';
    var period = typeof sub.period === 'string' ? sub.period : '';
    var title = period ? periodLabel(period) : t('mood.source.checkin');
    var metrics = renderMoodDayMetricRow('wizard.mood.1.10', sub.mood) +
      renderMoodDayMetricRow('wizard.sleep.1.10', sub.sleep) +
      renderMoodDayMetricRow('wizard.fatigue.1.10', sub.fatigue);
    if (!metrics) return '';
    return '<article class="mood-day-checkin">' +
      '<header class="mood-day-checkin__head">' +
      svgIcon(checkinPeriodIconName(period || 'midday'), 'mood-day-checkin__icon') +
      '<h4 class="mood-day-checkin__title">' + escapeHTML(title) + '</h4>' +
      '</header>' +
      '<div class="mood-day-metrics">' + metrics + '</div>' +
      '</article>';
  }

  function sortSubEntries(subs) {
    var order = { AM: 0, midday: 1, PM: 2 };
    return subs.slice().sort(function (a, b) {
      var pa = order[a && a.period] != null ? order[a.period] : 9;
      var pb = order[b && b.period] != null ? order[b.period] : 9;
      return pa - pb;
    });
  }

  function buildMoodDayDetailHtml(dateStr) {
    var log = getLogForDate(dateStr);
    var readings = collectReadingsForDate(dateStr);
    var html = '<div class="mood-day-detail">';
    html += '<p class="mood-day-detail__date">' + escapeHTML(formatMoodFullDate(dateStr)) + '</p>';

    if (readings.length > 1) {
      var avg = Math.round((readings.reduce(function (s, r) { return s + r.mood; }, 0) / readings.length) * 10) / 10;
      html += '<p class="mood-day-detail__average">' + escapeHTML(t('mood.dayDetail.dayAverage', { score: String(avg) })) + '</p>';
    }

    var fullLogMetrics = '';
    if (log) {
      fullLogMetrics = renderMoodDayMetricRow('wizard.mood.1.10', log.mood) +
        renderMoodDayMetricRow('wizard.sleep.1.10', log.sleep) +
        renderMoodDayMetricRow('wizard.fatigue.1.10', log.fatigue);
    }

    if (fullLogMetrics) {
      html += '<section class="mood-day-section"><h4 class="mood-day-section__title">' + escapeHTML(t('mood.dayDetail.fullLog')) + '</h4>';
      html += '<div class="mood-day-metrics">' + fullLogMetrics + '</div></section>';
    }

    var subs = log && Array.isArray(log.subEntries) ? sortSubEntries(log.subEntries) : [];
    var checkinHtml = subs.map(renderMoodDayCheckinCard).filter(Boolean).join('');
    if (checkinHtml) {
      html += '<section class="mood-day-section"><h4 class="mood-day-section__title">' + escapeHTML(t('mood.dayDetail.checkins')) + '</h4>';
      html += '<div class="mood-day-checkins">' + checkinHtml + '</div></section>';
    } else if (!fullLogMetrics) {
      html += '<p class="mood-day-detail__empty">' + escapeHTML(t('mood.dayDetail.noData')) + '</p>';
    } else {
      html += '<p class="mood-day-detail__hint">' + escapeHTML(t('mood.dayDetail.noCheckins')) + '</p>';
    }

    html += '</div>';
    return html;
  }

  var _moodDayModalEscape = null;

  function closeMoodDayDetailModal() {
    var overlay = document.getElementById('moodDayModalOverlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
    if (_moodDayModalEscape) {
      document.removeEventListener('keydown', _moodDayModalEscape);
      _moodDayModalEscape = null;
    }
  }

  function openMoodDayDetailModal(dateStr) {
    if (!dateStr) return;
    var overlay = document.getElementById('moodDayModalOverlay');
    var bodyEl = document.getElementById('moodDayModalBody');
    var titleEl = document.getElementById('moodDayModalTitle');
    if (!overlay || !bodyEl) return;

    if (titleEl) {
      titleEl.textContent = t('mood.dayDetail.title');
    }
    bodyEl.innerHTML = buildMoodDayDetailHtml(dateStr);

    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.classList.add('modal-active');
    document.body.style.overflow = 'hidden';

    if (!_moodDayModalEscape) {
      _moodDayModalEscape = function (e) {
        if (e.key === 'Escape') closeMoodDayDetailModal();
      };
      document.addEventListener('keydown', _moodDayModalEscape);
    }

    overlay.onclick = function (e) {
      if (e.target === overlay) closeMoodDayDetailModal();
    };

    var closeBtn = document.getElementById('moodDayModalClose');
    if (closeBtn) closeBtn.onclick = closeMoodDayDetailModal;

    var panel = overlay.querySelector('.mood-day-modal-content');
    if (panel && typeof panel.focus === 'function') panel.focus();
  }

  function wireMoodReadingRibbon(root) {
    if (!root) return;
    var ribbon = root.querySelector('.mood-reading-ribbon');
    if (!ribbon || ribbon.dataset.moodRibbonBound === '1') return;
    ribbon.dataset.moodRibbonBound = '1';
    var scrollEl = ribbon.querySelector('.mood-reading-ribbon-scroll');
    if (scrollEl) wireMoodTimelineScroll(scrollEl);
    var focusEl = ribbon.querySelector('.mood-reading-focus');
    var cards = ribbon.querySelectorAll('.mood-reading-card');
    if (focusEl && focusEl.dataset.moodFocusBound !== '1') {
      focusEl.dataset.moodFocusBound = '1';
      focusEl.setAttribute('role', 'button');
      focusEl.tabIndex = 0;
      focusEl.setAttribute('aria-label', t('mood.dayDetail.title'));
      var openLatestDay = function () {
        var readings = ribbon._moodReadings;
        if (readings && readings.length) openMoodDayDetailModal(readings[readings.length - 1].date);
      };
      focusEl.addEventListener('click', openLatestDay);
      focusEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLatestDay();
        }
      });
    }
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        cards.forEach(function (c) { c.classList.remove('mood-reading-card--active'); });
        card.classList.add('mood-reading-card--active');
        var i = parseInt(card.getAttribute('data-reading-i') || '0', 10);
        var readings = ribbon._moodReadings;
        if (readings && readings[i]) {
          updateMoodReadingFocusEl(focusEl, readings[i]);
          openMoodDayDetailModal(readings[i].date);
        }
      });
    });
  }

  function attachMoodReadingData(root, readings) {
    var ribbon = root && root.querySelector('.mood-reading-ribbon');
    if (ribbon) ribbon._moodReadings = readings.slice().reverse();
  }

  function renderMoodTimelineWave(dailyAverages, moodTarget) {
    if (!dailyAverages || !dailyAverages.length) return '';
    var nodeW = 56;
    var h = 96;
    var padTop = 14;
    var padBottom = 8;
    var innerH = h - padTop - padBottom;
    var max = 10;
    var w = Math.max(nodeW, dailyAverages.length * nodeW);
    var pts = dailyAverages.map(function (d, i) {
      var cx = nodeW * i + nodeW / 2;
      var cy = padTop + innerH - (d.average / max) * innerH;
      return { x: cx, y: cy };
    });
    var pathD = pts.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');
    var targetY = padTop + innerH - (moodTarget / max) * innerH;
    var areaD = pathD + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (h - padBottom).toFixed(1) +
      ' L' + pts[0].x.toFixed(1) + ',' + (h - padBottom).toFixed(1) + ' Z';
    return '<svg class="mood-timeline-wave" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="moodWaveFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="currentColor" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="currentColor" stop-opacity="0.02"/>' +
      '</linearGradient></defs>' +
      '<line class="mood-timeline-target" x1="0" y1="' + targetY.toFixed(1) + '" x2="' + w + '" y2="' + targetY.toFixed(1) + '"/>' +
      '<path class="mood-timeline-area" d="' + areaD + '" fill="url(#moodWaveFill)"/>' +
      '<path class="mood-timeline-path" d="' + pathD + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function renderMoodTimeline(dailyAverages, readings, moodTarget) {
    if (!dailyAverages || !dailyAverages.length) return '';
    var byDate = {};
    (readings || []).forEach(function (r) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });
    var nodesHtml = dailyAverages.map(function (d, i) {
      var tone = moodToneFromScore(d.average);
      var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(Math.round(d.average)) : '';
      var qual = qk ? t(qk) : '';
      var dayReadings = byDate[d.date] || [];
      var tip = d.date + ' · ' + d.average + '/10';
      if (qual) tip += ' · ' + qual;
      if (d.count > 1) tip += ' · ' + t('mood.count', { count: String(d.count) });
      var isLatest = i === dailyAverages.length - 1;
      var pipsHtml = '';
      if (dayReadings.length > 1) {
        pipsHtml = '<span class="mood-timeline-pips" aria-hidden="true">';
        dayReadings.slice(0, 4).forEach(function (r) {
          pipsHtml += '<span class="mood-timeline-pip mood-timeline-pip--' + moodToneFromScore(r.mood) + '"></span>';
        });
        if (dayReadings.length > 4) {
          pipsHtml += '<span class="mood-timeline-pip-more">+' + (dayReadings.length - 4) + '</span>';
        }
        pipsHtml += '</span>';
      }
      return '<div class="mood-timeline-node mood-timeline-node--' + tone + (isLatest ? ' mood-timeline-node--latest' : '') + '" role="listitem" style="--node-i:' + i + ';--mood-score:' + d.average + '" title="' + escapeHTML(tip) + '">' +
        '<div class="mood-timeline-orb-wrap">' +
        (isLatest ? '<span class="mood-timeline-pulse" aria-hidden="true"></span>' : '') +
        '<span class="mood-timeline-orb" aria-hidden="true"></span>' +
        pipsHtml +
        '</div>' +
        '<span class="mood-timeline-score">' + escapeHTML(String(d.average)) + '</span>' +
        '<span class="mood-timeline-date">' + escapeHTML(formatMoodTimelineDate(d.date)) + '</span>' +
        '</div>';
    }).join('');
    return '<div class="mood-timeline-scroll" role="list" aria-label="' + escapeHTML(t('mood.recent.title')) + '">' +
      '<div class="mood-timeline-inner" style="--mood-node-count:' + dailyAverages.length + '">' +
      renderMoodTimelineWave(dailyAverages, moodTarget) +
      '<div class="mood-timeline-nodes">' + nodesHtml + '</div></div></div>';
  }

  function wireMoodTimelineScroll(el) {
    if (!el || el.dataset.moodTimelineBound === '1') return;
    el.dataset.moodTimelineBound = '1';
    var startX = 0;
    var startScroll = 0;
    var dragging = false;

    el.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });

    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add('mood-timeline-scroll--dragging');
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('mood-timeline-scroll--dragging');
      if (el.releasePointerCapture) {
        try { el.releasePointerCapture(e.pointerId); } catch (_err) { /* noop */ }
      }
    });
    el.addEventListener('pointercancel', function () {
      dragging = false;
      el.classList.remove('mood-timeline-scroll--dragging');
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.pageX - startX);
    });

    requestAnimationFrame(function () {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    });
  }

  function renderMoodSparkline(dailyAverages, targetScore) {
    if (!dailyAverages || !dailyAverages.length) return '';
    var max = 10;
    var w = 200;
    var h = 52;
    var padX = 6;
    var padY = 6;
    var innerW = w - padX * 2;
    var innerH = h - padY * 2;
    var step = dailyAverages.length > 1 ? innerW / (dailyAverages.length - 1) : 0;
    var pts = dailyAverages.map(function (d, i) {
      var x = dailyAverages.length > 1 ? padX + i * step : w / 2;
      var y = padY + innerH - (d.average / max) * innerH;
      return { x: x, y: y };
    });
    var pathD = pts.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');
    var areaD = pathD + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (h - padY).toFixed(1) +
      ' L' + pts[0].x.toFixed(1) + ',' + (h - padY).toFixed(1) + ' Z';
    var target = Number.isFinite(Number(targetScore)) ? Number(targetScore) : 7;
    var targetY = padY + innerH - (target / max) * innerH;
    return '<div class="mood-sparkline-wrap" aria-hidden="true">' +
      '<svg class="mood-sparkline" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="moodMetricSparkFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="currentColor" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="currentColor" stop-opacity="0.02"/>' +
      '</linearGradient></defs>' +
      '<line class="mood-sparkline-target" x1="' + padX + '" y1="' + targetY.toFixed(1) + '" x2="' + (w - padX) + '" y2="' + targetY.toFixed(1) + '"/>' +
      '<path class="mood-sparkline-area" d="' + areaD + '" fill="url(#moodMetricSparkFill)"/>' +
      '<path class="mood-sparkline-path" d="' + pathD + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></div>';
  }

  function resolveMoodDeckCheckinState(todayStr) {
    var logArr = getLogs();
    var todayLog = logArr.find(function (l) { return l && l.date === todayStr; });
    var done = S && typeof S.completedCheckinPeriods === 'function'
      ? S.completedCheckinPeriods(todayLog)
      : new Set();
    var periods = S && Array.isArray(S.HOME_CHECKIN_PERIODS) ? S.HOME_CHECKIN_PERIODS : ['AM', 'midday', 'PM'];
    var defaultPeriod = typeof global.defaultCheckinPeriod === 'function'
      ? global.defaultCheckinPeriod()
      : 'AM';
    if (!_moodPeriodUserPick || done.has(_moodSelectedPeriod)) {
      _moodSelectedPeriod = defaultPeriod;
      if (done.has(_moodSelectedPeriod)) {
        var openPeriod = periods.find(function (p) { return !done.has(p); });
        if (openPeriod) _moodSelectedPeriod = openPeriod;
      }
    }
    return { done: done, periods: periods };
  }

  function renderMoodDeckAmbientSvg() {
    return '<svg class="mood-deck-ambient__svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="moodDeckAuroraA" cx="22%" cy="38%" r="55%">' +
      '<stop offset="0%" stop-color="var(--primary-color)" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="var(--primary-color)" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="moodDeckAuroraB" cx="78%" cy="62%" r="50%">' +
      '<stop offset="0%" stop-color="var(--primary-color)" stop-opacity="0.18"/>' +
      '<stop offset="100%" stop-color="var(--primary-color)" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<ellipse class="mood-deck-aurora mood-deck-aurora--a" cx="72" cy="68" rx="92" ry="58" fill="url(#moodDeckAuroraA)"/>' +
      '<ellipse class="mood-deck-aurora mood-deck-aurora--b" cx="248" cy="112" rx="78" ry="48" fill="url(#moodDeckAuroraB)"/>' +
      '</svg>';
  }

  function renderMoodDeckDaypartTrack(periods, done, selectedPeriod, ctaLabel) {
    var html = '<div class="checkin-slider-wrap mood-deck-orbs-wrap"><div class="checkin-slider-track mood-deck-track">';
    periods.forEach(function (period, idx) {
      if (idx > 0) html += '<div class="checkin-slider-line mood-deck-track-line" aria-hidden="true"></div>';
      var label = t(checkinPeriodLabelKey(period));
      var isDone = done.has(period);
      var isSelected = period === selectedPeriod;
      html += '<button type="button" class="checkin-slider-stop mood-deck-orb' + (isDone ? ' is-done' : '') + '" data-period="' + escapeHTML(period) + '" data-selected="' + (isSelected ? 'true' : 'false') + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '"' + (isDone ? ' data-checkin-done="true"' : '') + ' aria-label="' + escapeAttr(label) + (isDone ? ' (' + escapeAttr(t('home.checkin.done')) + ')' : '') + '">';
      html += '<span class="checkin-slider-icon-slot mood-deck-orb-icon-slot" aria-hidden="true">';
      html += svgIcon(checkinPeriodIconName(period), 'checkin-slider-stop-icon mood-deck-orb-icon');
      html += '</span>';
      html += '<span class="checkin-slider-stop-label mood-deck-orb-label">' + escapeHTML(label) + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += '<button type="button" class="checkin-cta-btn mood-deck-cta" data-checkin-cta aria-label="' + escapeAttr(ctaLabel) + '">' + escapeHTML(ctaLabel) + '</button>';
    html += '</div>';
    return html;
  }

  function renderMoodDeckActionTile(id, label, iconName, extraClass) {
    var cls = 'mood-deck-tile' + (extraClass ? ' ' + extraClass : '');
    return '<button type="button" class="' + cls + '" id="' + escapeHTML(id) + '" aria-label="' + escapeAttr(label) + '">' +
      '<span class="mood-deck-tile-icon" aria-hidden="true">' + svgIcon(iconName, 'mood-deck-tile-icon-svg') + '</span>' +
      '<span class="mood-deck-tile-label">' + escapeHTML(label) + '</span>' +
      '</button>';
  }

  function renderMoodControlDeck(todayStr, simpleMode) {
    var title = t('mood.checkin.title');
    var html = '<section class="mood-control-deck" aria-labelledby="mood-deck-title">';
    html += '<div class="mood-deck-tilt">';
    html += '<div class="mood-deck-ambient" aria-hidden="true">' + renderMoodDeckAmbientSvg() + '</div>';
    html += '<div class="mood-deck-surface">';
    html += '<h3 id="mood-deck-title" class="mood-deck-title">' + escapeHTML(title) + '</h3>';

    if (!simpleMode) {
      var checkin = resolveMoodDeckCheckinState(todayStr);
      var ctaLabel = t('home.checkin.cta');
      html += '<div class="mood-deck-orbs">' + renderMoodDeckDaypartTrack(checkin.periods, checkin.done, _moodSelectedPeriod, ctaLabel) + '</div>';
    }

    html += '<div class="mood-deck-tiles">';
    html += renderMoodDeckActionTile('moodViewChartsBtn', t('mood.viewCharts'), 'chart-bars', 'mood-deck-tile--chart action-btn');
    if (!simpleMode) {
      html += renderMoodDeckActionTile('moodPhq2Btn', t('mentalHealth.phq2.action'), 'heart-pulse', 'mood-deck-tile--mood settings-data-btn');
      html += renderMoodDeckActionTile('moodGad2Btn', t('mentalHealth.gad2.action'), 'brain-wave', 'mood-deck-tile--anxiety settings-data-btn');
    }
    html += '</div>';
    html += '</div></div></section>';
    return html;
  }

  function wireMoodDeckParallax(deck) {
    if (!deck) return;
    var reduceMotion = global.RianellGraphicsPortfolio &&
      typeof global.RianellGraphicsPortfolio.shouldReduceAnimations === 'function' &&
      global.RianellGraphicsPortfolio.shouldReduceAnimations();
    if (reduceMotion) return;
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(pointer: fine)').matches) return;

    var tilt = deck.querySelector('.mood-deck-tilt');
    if (!tilt) return;

    // Keep interactive check-in / tiles flat - rotating the parent breaks button hit-testing.
    deck.addEventListener('pointermove', function (e) {
      if (e.target && e.target.closest && e.target.closest('.mood-deck-orb, .mood-deck-cta, .mood-deck-tile')) {
        return;
      }
      var rect = deck.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      tilt.style.setProperty('--deck-rx', (y * -3).toFixed(2) + 'deg');
      tilt.style.setProperty('--deck-ry', (x * 4).toFixed(2) + 'deg');
    });
    deck.addEventListener('pointerleave', function () {
      tilt.style.setProperty('--deck-rx', '0deg');
      tilt.style.setProperty('--deck-ry', '0deg');
    });
  }

  function renderMoodTab() {
    var root = document.getElementById('moodTabContent');
    if (!root) return;
    var settings = getSettings();
    var simpleMode = settings.simpleMode === true;
    var todayStr = getTodayStr();
    var summary = S && typeof S.summarizeMoodMetrics === 'function'
      ? S.summarizeMoodMetrics(getLogs(), { days: _moodRangeDays, todayStr: todayStr, moodTarget: moodTarget() })
      : { count: 0, readings: [], dailyAverages: [] };

    var html = '<p class="mood-lead">' + escapeHTML(t('mood.lead')) + '</p>';

    if (!summary.count) {
      html += '<div class="mood-empty-state">';
      html += '<div class="mood-empty-icon" aria-hidden="true">' + svgIcon('chart-bars', 'mood-empty-icon-svg') + '</div>';
      html += '<h3 class="mood-empty-title">' + escapeHTML(t('mood.empty.warm.title')) + '</h3>';
      html += '<p class="mood-empty-message">' + escapeHTML(t('mood.empty.warm.message')) + '</p>';
      html += '</div>';
    } else {
      var trendKey = summary.trend === 'up' ? 'mood.trend.up' : summary.trend === 'down' ? 'mood.trend.down' : 'mood.trend.stable';
      var latest = summary.latest;
      var qualKey = S && typeof S.moodQualitativeKey === 'function' && latest
        ? S.moodQualitativeKey(latest.mood)
        : 'mood.qualitative.none';
      var latestTone = latest ? moodToneFromScore(latest.mood) : 'neutral';
      html += '<div class="mood-metrics-grid">';
      html += '<div class="mood-metric-card mood-metric-card--avg"><span class="mood-metric-label">' + escapeHTML(t('mood.avg')) + '</span>';
      html += '<span class="mood-metric-value">' + escapeHTML(String(summary.average)) + '<span class="mood-metric-suffix">/10</span></span></div>';
      html += '<div class="mood-metric-card mood-metric-card--latest mood-metric-card--tone-' + latestTone + '"><span class="mood-metric-label">' + escapeHTML(t('mood.latest')) + '</span>';
      html += '<span class="mood-metric-value">' + escapeHTML(String(latest ? latest.mood : '-')) + '<span class="mood-metric-suffix">/10</span></span>';
      html += '<span class="mood-metric-hint">' + escapeHTML(t(qualKey)) + '</span></div>';
      html += '<div class="mood-metric-card mood-metric-card--trend mood-metric-card--trend-' + escapeHTML(summary.trend) + '"><span class="mood-metric-label">' + escapeHTML(t(trendKey)) + '</span>';
      html += renderMoodSparkline(summary.dailyAverages, summary.moodTarget != null ? summary.moodTarget : moodTarget()) + '</div>';
      html += renderMoodReadingsSummaryCard(summary);
      html += '</div>';

      html += '<section class="mood-recent-section"><h3 class="mood-section-title">' + escapeHTML(t('mood.recent.title')) + '</h3>';
      html += renderMoodReadingRibbon(summary.readings);
      html += '</section>';
    }

    html += renderMoodControlDeck(todayStr, simpleMode);

    root.innerHTML = html;

    if (global.RianellGraphicsPortfolio && typeof global.RianellGraphicsPortfolio.decorateMoodTab === 'function') {
      global.RianellGraphicsPortfolio.decorateMoodTab();
    }

    attachMoodReadingData(root, summary.readings || []);
    wireMoodReadingRibbon(root);
    var activeCard = root.querySelector('.mood-reading-card[data-reading-i]:last-child') ||
      root.querySelector('.mood-reading-card[data-reading-i]');
    if (activeCard) activeCard.classList.add('mood-reading-card--active');

    var moodTimelineScroll = root.querySelector('.mood-timeline-scroll:not(.mood-reading-ribbon-scroll)');
    if (moodTimelineScroll) wireMoodTimelineScroll(moodTimelineScroll);

    var moodControlDeck = root.querySelector('.mood-control-deck');
    if (moodControlDeck && typeof global.wireCheckinSliderEvents === 'function') {
      global.wireCheckinSliderEvents(moodControlDeck, function () { return _moodSelectedPeriod; }, function (period) {
        _moodSelectedPeriod = period;
        _moodPeriodUserPick = true;
      });
    }
    wireMoodDeckParallax(moodControlDeck);

    var chartsBtn = document.getElementById('moodViewChartsBtn');
    if (chartsBtn) {
      chartsBtn.onclick = function () {
        if (typeof global.switchTab === 'function') global.switchTab('charts');
        setTimeout(function () {
          if (typeof global.toggleChartView === 'function') global.toggleChartView('individual');
          var moodChart = document.getElementById('moodChart');
          if (moodChart && moodChart.scrollIntoView) moodChart.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      };
    }

    var phqBtn = document.getElementById('moodPhq2Btn');
    if (phqBtn && global.RianellWeeklyReview && typeof global.RianellWeeklyReview.openScreeningModal === 'function') {
      phqBtn.onclick = function () { global.RianellWeeklyReview.openScreeningModal('phq2'); };
    }
    var gadBtn = document.getElementById('moodGad2Btn');
    if (gadBtn && global.RianellWeeklyReview && typeof global.RianellWeeklyReview.openScreeningModal === 'function') {
      gadBtn.onclick = function () { global.RianellWeeklyReview.openScreeningModal('gad2'); };
    }

    if (typeof global.initRipple === 'function') global.initRipple(root);
  }

  var MOOD_RANGE_VALUES = [7, 14, 30];

  function setMoodDateRange(days) {
    _moodRangeDays = days;
    var pos = MOOD_RANGE_VALUES.indexOf(days);
    if (pos === -1) pos = 1;
    if (typeof global.updateRangeSlider === 'function') {
      global.updateRangeSlider('moodRangeSlider', pos);
    }
    withCatalogsReady(renderMoodTab);
  }

  function bindMoodTabModule() {
    var moodSlider = document.getElementById('moodRangeSlider');
    if (moodSlider) {
      moodSlider.addEventListener('input', function () {
        var days = MOOD_RANGE_VALUES[parseInt(this.value, 10)];
        if (days) setMoodDateRange(days);
      });
      if (typeof global.updateRangeSlider === 'function') {
        global.updateRangeSlider('moodRangeSlider', parseInt(moodSlider.value, 10));
      }
    }
    if (global.RianellI18n && typeof global.RianellI18n.onLocaleChange === 'function') {
      global.RianellI18n.onLocaleChange(function () {
        var panel = document.getElementById('moodTab');
        if (panel && panel.classList.contains('active')) withCatalogsReady(renderMoodTab);
      });
    }
  }

  global.RianellMoodTab = {
    renderMoodTab: function () { withCatalogsReady(renderMoodTab); },
    bindMoodTabModule: bindMoodTabModule,
    setMoodDateRange: setMoodDateRange,
    resetCheckinSelection: resetCheckinSelection,
    openMoodDayDetailModal: openMoodDayDetailModal,
    closeMoodDayDetailModal: closeMoodDayDetailModal,
  };
  global.openMoodDayDetailModal = openMoodDayDetailModal;
  global.closeMoodDayDetailModal = closeMoodDayDetailModal;
})(typeof window !== 'undefined' ? window : globalThis);
