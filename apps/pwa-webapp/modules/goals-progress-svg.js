/**
 * Animated SVG seven-day pillar charts for goals progress rows.
 * Always renders (no WebGL); used as primary visual with optional 3D overlay.
 */
(function (global) {
  'use strict';

  var activeCharts = [];

  function isReducedMotion() {
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (document.body && document.body.classList.contains('reduce-motion')) return true;
    var prefs = global.RianellPrefs && typeof global.RianellPrefs.get === 'function'
      ? global.RianellPrefs.get('reducedMotion') : false;
    return prefs === true || prefs === 'true';
  }

  function accentColor() {
    try {
      return getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#7bdf8c';
    } catch (e) {
      return '#7bdf8c';
    }
  }

  function metricTheme(metric) {
    switch (metric) {
      case 'hydration':
        return { fill: '#6ec8ff', glow: 'rgba(110,200,255,0.45)', empty: 'rgba(110,200,255,0.22)', decor: 'hydration' };
      case 'sleep':
        return { fill: '#b8a0ff', glow: 'rgba(184,160,255,0.45)', empty: 'rgba(184,160,255,0.22)', decor: 'sleep' };
      case 'goodDays':
        return { fill: '#ffc76b', glow: 'rgba(255,199,107,0.45)', empty: 'rgba(255,199,107,0.22)', decor: 'goodDays' };
      default:
        return { fill: accentColor(), glow: 'color-mix(in srgb, var(--primary-color) 40%, transparent)', empty: 'color-mix(in srgb, var(--primary-color) 18%, transparent)', decor: 'steps' };
    }
  }

  function decorSvg(kind) {
    switch (kind) {
      case 'hydration':
        return '<g class="goals-svg-decor goals-svg-decor--hydration" aria-hidden="true">' +
          '<path class="goals-svg-drop" d="M98 10 C98 10 92 16 92 20 a6 6 0 0 0 12 0 c0-4-6-10-6-10z" fill="currentColor"/>' +
          '<circle class="goals-svg-ripple goals-svg-ripple--1" cx="98" cy="22" r="4" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
          '<circle class="goals-svg-ripple goals-svg-ripple--2" cx="98" cy="22" r="7" fill="none" stroke="currentColor" stroke-width="0.9"/>' +
          '</g>';
      case 'sleep':
        return '<g class="goals-svg-decor goals-svg-decor--sleep" aria-hidden="true">' +
          '<path class="goals-svg-moon" d="M94 8 a7 7 0 1 0 4 12 a5.5 5.5 0 1 1 0-11" fill="currentColor"/>' +
          '<circle class="goals-svg-star goals-svg-star--1" cx="106" cy="10" r="1.1" fill="currentColor"/>' +
          '<circle class="goals-svg-star goals-svg-star--2" cx="110" cy="16" r="0.8" fill="currentColor"/>' +
          '</g>';
      case 'goodDays':
        return '<g class="goals-svg-decor goals-svg-decor--goodDays" aria-hidden="true">' +
          '<circle class="goals-svg-smile-head" cx="100" cy="16" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
          '<path class="goals-svg-smile-mouth" d="M96 17 Q100 21 104 17" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' +
          '<circle cx="97.5" cy="14.5" r="0.9" fill="currentColor"/>' +
          '<circle cx="102.5" cy="14.5" r="0.9" fill="currentColor"/>' +
          '</g>';
      default:
        return '<g class="goals-svg-decor goals-svg-decor--steps" aria-hidden="true">' +
          '<path class="goals-svg-foot goals-svg-foot--1" d="M90 20 c-2-4 2-7 5-5 c2 1 2 4 0 6 c-2 2-5 1-5-1z" fill="currentColor"/>' +
          '<path class="goals-svg-foot goals-svg-foot--2" d="M102 14 c-2-4 2-7 5-5 c2 1 2 4 0 6 c-2 2-5 1-5-1z" fill="currentColor" opacity="0.7"/>' +
          '</g>';
    }
  }

  function buildChartSvg(metric, pcts, rowPct) {
    var theme = metricTheme(metric);
    var values = Array.isArray(pcts) ? pcts.slice(0, 7) : [];
    while (values.length < 7) values.push(0);

    var sum = 0;
    for (var s = 0; s < values.length; s++) sum += Math.max(0, Math.min(100, Number(values[s]) || 0));
    var avgPct = Number.isFinite(rowPct) ? Math.max(0, Math.min(100, rowPct)) : Math.round(sum / 7);
    var panelMix = Math.round(4 + (avgPct / 100) * 26);
    var panelStroke = Math.round(12 + (avgPct / 100) * 28);
    var decorOpacity = (0.35 + (avgPct / 100) * 0.55).toFixed(2);

    var barW = 11;
    var gap = 4.5;
    var startX = 6;
    var baseY = 46;
    var maxH = 34;
    var bars = '';

    for (var i = 0; i < 7; i++) {
      var pct = Math.max(0, Math.min(100, Number(values[i]) || 0));
      /* Empty stubs stay short; progress height scales with that day's % of target. */
      var h = pct <= 0 ? 2.4 : Math.max(4, (pct / 100) * maxH);
      var x = startX + i * (barW + gap);
      var filled = pct > 0;
      var met = pct >= 100;
      var fillOpacity = pct <= 0 ? 0.22 : Math.max(0.4, pct / 100);
      var finalOpacity = pct <= 0 ? 0.4 : 1;
      bars += '<g class="goals-svg-bar-wrap' + (filled ? ' goals-svg-bar-wrap--filled' : '') + (met ? ' goals-svg-bar-wrap--met' : '') + '" ' +
        'transform="translate(' + x.toFixed(1) + ' ' + baseY + ')" style="--goals-bar-h:' + h.toFixed(1) +
        ';--goals-bar-delay:' + (i * 0.07).toFixed(2) + 's;--goals-bar-pct:' + pct +
        ';--goals-bar-fill-opacity:' + fillOpacity.toFixed(2) +
        ';--goals-bar-final-opacity:' + finalOpacity + '">' +
        '<rect class="goals-svg-bar" x="0" y="' + (-h).toFixed(1) + '" width="' + barW + '" height="' + h.toFixed(1) + '" rx="2.2"/>' +
        '</g>';
    }

    return '<svg class="goals-svg-chart" data-metric="' + metric + '" data-progress-pct="' + avgPct +
      '" viewBox="0 0 120 52" focusable="false" aria-hidden="true" ' +
      'style="--goals-fill:' + theme.fill + ';--goals-empty:' + theme.empty + ';--goals-glow:' + theme.glow +
      ';--goals-row-pct:' + avgPct + ';--goals-panel-mix:' + panelMix + '%;--goals-panel-stroke:' + panelStroke +
      '%;--goals-decor-opacity:' + decorOpacity + '">' +
      '<rect class="goals-svg-panel" x="1" y="1" width="118" height="50" rx="6"/>' +
      decorSvg(theme.decor) +
      '<line class="goals-svg-baseline" x1="4" y1="' + baseY + '" x2="116" y2="' + baseY + '" stroke="color-mix(in srgb, var(--goals-fill) 28%, transparent)" stroke-width="1" stroke-linecap="round"/>' +
      bars +
      '</svg>';
  }

  function mountChart(slot, metric, pcts, rowPct) {
    if (!slot) return null;
    slot.innerHTML = buildChartSvg(metric, pcts, rowPct);
    if (Number.isFinite(rowPct)) {
      slot.style.setProperty('--goals-row-pct', String(Math.max(0, Math.min(100, rowPct))));
    }
    var svg = slot.querySelector('.goals-svg-chart');
    if (!svg) return null;

    var visible = false;
    var io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visible = true;
            svg.classList.add('goals-svg-chart--visible');
          } else {
            visible = false;
          }
        });
      }, { threshold: 0.15 })
      : null;

    if (io) {
      io.observe(slot);
    } else {
      svg.classList.add('goals-svg-chart--visible');
    }

    if (!isReducedMotion()) {
      slot.classList.add('goals-chart-slot--animated');
    }

    function dispose() {
      if (io) io.disconnect();
      slot.innerHTML = '';
      slot.classList.remove('goals-chart-slot--animated');
    }

    return { dispose: dispose, get visible() { return visible; } };
  }

  function disposeAll() {
    activeCharts.forEach(function (c) {
      if (c && typeof c.dispose === 'function') c.dispose();
    });
    activeCharts = [];
  }

  function enhanceBlock(block) {
    if (!block || !block.isConnected) return [];
    disposeAll();
    block.classList.add('goals-progress-block--svg');
    var rows = block.querySelectorAll('.goals-metric-row');
    rows.forEach(function (row) {
      var slot = row.querySelector('.goals-3d-slot');
      if (!slot) return;
      var metric = row.getAttribute('data-metric') || 'steps';
      var raw = row.getAttribute('data-daily-pcts') || '[]';
      var pcts;
      try { pcts = JSON.parse(raw); } catch (e) { pcts = []; }
      var rowPct = Number(row.getAttribute('data-progress-pct'));
      if (!Number.isFinite(rowPct)) rowPct = undefined;
      var ctrl = mountChart(slot, metric, pcts, rowPct);
      if (ctrl) activeCharts.push(ctrl);
    });
    return activeCharts;
  }

  global.RianellGoalsProgressSvg = {
    enhanceBlock: enhanceBlock,
    disposeAll: disposeAll,
    buildChartSvg: buildChartSvg,
  };
})(typeof window !== 'undefined' ? window : globalThis);
