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

  function renderMoodSparkline(dailyAverages) {
    if (!dailyAverages || !dailyAverages.length) return '';
    var max = 10;
    var w = 200;
    var h = 48;
    var padX = 4;
    var padY = 4;
    var innerW = w - padX * 2;
    var step = dailyAverages.length > 1 ? innerW / (dailyAverages.length - 1) : 0;
    var pts = dailyAverages.map(function (d, i) {
      var x = dailyAverages.length > 1 ? padX + i * step : w / 2;
      var y = h - padY - (d.average / max) * (h - padY * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<div class="mood-sparkline-wrap" aria-hidden="true">' +
      '<svg class="mood-sparkline" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<polyline fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="' + pts + '"/></svg></div>';
  }

  function renderMoodCheckinSection(todayStr, simpleMode) {
    if (simpleMode) return '';
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
    var ctaLabel = t('home.checkin.cta');
    var sliderHtml = typeof global.renderCheckinSliderHtml === 'function'
      ? global.renderCheckinSliderHtml(periods, done, _moodSelectedPeriod, function (key) { return t(key); }, ctaLabel)
      : '';
    return '<section class="mood-checkin-section"><h3 class="mood-section-title">' + escapeHTML(t('mood.checkin.title')) + '</h3>' + sliderHtml + '</section>';
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
      html += '<div class="mood-metrics-grid">';
      html += '<div class="mood-metric-card"><span class="mood-metric-label">' + escapeHTML(t('mood.avg')) + '</span>';
      html += '<span class="mood-metric-value">' + escapeHTML(String(summary.average)) + '<span class="mood-metric-suffix">/10</span></span></div>';
      html += '<div class="mood-metric-card"><span class="mood-metric-label">' + escapeHTML(t('mood.latest')) + '</span>';
      html += '<span class="mood-metric-value">' + escapeHTML(String(latest ? latest.mood : '-')) + '<span class="mood-metric-suffix">/10</span></span>';
      html += '<span class="mood-metric-hint">' + escapeHTML(t(qualKey)) + '</span></div>';
      html += '<div class="mood-metric-card"><span class="mood-metric-label">' + escapeHTML(t(trendKey)) + '</span>';
      html += renderMoodSparkline(summary.dailyAverages) + '</div>';
      html += '<div class="mood-metric-card"><span class="mood-metric-label">' + escapeHTML(t('mood.count', { count: String(summary.count) })) + '</span>';
      html += '<span class="mood-metric-hint">' + escapeHTML(t('mood.atTarget', { target: String(summary.moodTarget) })) + ': ' + summary.atTargetCount + '</span>';
      html += '<span class="mood-metric-hint">' + escapeHTML(t('mood.belowTarget', { target: String(summary.moodTarget) })) + ': ' + summary.belowTargetCount + '</span></div>';
      html += '</div>';

      html += '<section class="mood-recent-section"><h3 class="mood-section-title">' + escapeHTML(t('mood.recent.title')) + '</h3>';
      html += renderMoodTimeline(summary.dailyAverages, summary.readings, summary.moodTarget);
      html += '</section>';
    }

    html += renderMoodCheckinSection(todayStr, simpleMode);

    html += '<div class="mood-actions">';
    html += '<button type="button" class="action-btn" id="moodViewChartsBtn">' + escapeHTML(t('mood.viewCharts')) + '</button>';
    if (!simpleMode) {
      html += '<button type="button" class="settings-data-btn" id="moodPhq2Btn">' + escapeHTML(t('mentalHealth.phq2.action')) + '</button>';
      html += '<button type="button" class="settings-data-btn" id="moodGad2Btn">' + escapeHTML(t('mentalHealth.gad2.action')) + '</button>';
    }
    html += '</div>';

    root.innerHTML = html;

    var moodTimelineScroll = root.querySelector('.mood-timeline-scroll');
    if (moodTimelineScroll) wireMoodTimelineScroll(moodTimelineScroll);

    var moodCheckinSection = root.querySelector('.mood-checkin-section');
    if (moodCheckinSection && typeof global.wireCheckinSliderEvents === 'function') {
      global.wireCheckinSliderEvents(moodCheckinSection, function () { return _moodSelectedPeriod; }, function (period) {
        _moodSelectedPeriod = period;
        _moodPeriodUserPick = true;
      });
    }

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
  };
})(typeof window !== 'undefined' ? window : globalThis);
