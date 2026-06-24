(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var _moodRangeDays = 14;

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
    var doneLabel = t('home.checkin.done');
    var html = '<section class="mood-checkin-section"><h3 class="mood-section-title">' + escapeHTML(t('mood.checkin.title')) + '</h3><div class="mood-checkin-periods">';
    periods.forEach(function (period) {
      var labelKey = period === 'AM' ? 'home.checkin.am' : period === 'PM' ? 'home.checkin.pm' : 'home.checkin.midday';
      var label = t(labelKey);
      var isDone = done.has(period);
      html += '<button type="button" class="action-btn mood-checkin-btn' + (isDone ? ' is-done' : '') + '" data-mood-checkin-period="' + escapeHTML(period) + '"' + (isDone ? ' disabled' : '') + '>';
      html += svgIcon(checkinPeriodIconName(period), 'mood-checkin-icon');
      html += '<span class="mood-checkin-label">' + escapeHTML(label) + '</span>';
      if (isDone) html += '<span class="mood-checkin-done">' + escapeHTML(doneLabel) + '</span>';
      html += '</button>';
    });
    html += '</div></section>';
    return html;
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

      html += '<section class="mood-recent-section"><h3 class="mood-section-title">' + escapeHTML(t('mood.recent.title')) + '</h3><ul class="mood-reading-list">';
      summary.readings.forEach(function (r) {
        var src = r.source === 'checkin' ? t('mood.source.checkin') : t('mood.source.daily');
        var period = r.period ? periodLabel(r.period) : '';
        var meta = period ? src + ' · ' + period : src;
        var qk = S && typeof S.moodQualitativeKey === 'function' ? S.moodQualitativeKey(r.mood) : '';
        html += '<li class="mood-reading-item"><span class="mood-reading-score">' + escapeHTML(String(r.mood)) + '/10</span>';
        html += '<span class="mood-reading-meta">' + escapeHTML(r.date) + ' · ' + escapeHTML(meta);
        if (qk) html += ' · ' + escapeHTML(t(qk));
        html += '</span></li>';
      });
      html += '</ul></section>';
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

    root.querySelectorAll('[data-mood-checkin-period]').forEach(function (btn) {
      if (btn.disabled) return;
      btn.onclick = function () {
        var period = btn.getAttribute('data-mood-checkin-period');
        if (typeof global.openMicroCheckinModal === 'function') global.openMicroCheckinModal(period);
      };
    });

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

  function setMoodDateRange(days) {
    _moodRangeDays = days;
    document.querySelectorAll('#moodTab .date-range-btn').forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.getAttribute('data-mood-days')) === days);
    });
    withCatalogsReady(renderMoodTab);
  }

  function bindMoodTabModule() {
    document.querySelectorAll('#moodTab .date-range-btn').forEach(function (btn) {
      btn.onclick = function () {
        var days = Number(btn.getAttribute('data-mood-days'));
        if (Number.isFinite(days)) setMoodDateRange(days);
      };
    });
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
