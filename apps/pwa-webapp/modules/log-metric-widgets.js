/**
 * Log wizard metric sliders → animated SVG widgets (symptoms, energy, stress, lifestyle).
 * Keeps native range inputs for form compatibility; enhances visuals + steppers.
 */
(function (global) {
  'use strict';

  var METRIC_IDS = [
    'stiffness', 'jointPain', 'mobility', 'swelling',
    'fatigue', 'sleep', 'mood',
    'irritability', 'weatherSensitivity',
    'dailyFunction',
  ];

  var INVERTED = { sleep: 1, mobility: 1, dailyFunction: 1, mood: 1 };

  var VISUAL = {
    stiffness: 'stiffness',
    jointPain: 'jointPain',
    mobility: 'mobility',
    swelling: 'swelling',
    fatigue: 'fatigue',
    sleep: 'sleep',
    mood: 'mood',
    irritability: 'irritability',
    weatherSensitivity: 'weather',
    dailyFunction: 'dailyFunction',
  };

  function t(key, fallback) {
    if (typeof global.tUi === 'function') {
      var v = global.tUi(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function ratio(val, min, max) {
    if (max <= min) return 0;
    return clamp((val - min) / (max - min), 0, 1);
  }

  function classifyZone(id, value) {
    var inv = !!INVERTED[id];
    var v = parseInt(value, 10);
    if (isNaN(v)) v = 5;
    if (inv) {
      if (v >= 8) return { id: 'good', color: '#7bdf8c', label: t('common.good', 'Good') };
      if (v >= 4) return { id: 'moderate', color: '#ffb74d', label: t('wizard.lifestyle.steps.moderate', 'Moderate') };
      return { id: 'low', color: '#ff8a65', label: t('common.bad', 'Bad') };
    }
    if (v <= 3) return { id: 'good', color: '#7bdf8c', label: t('common.good', 'Good') };
    if (v <= 7) return { id: 'moderate', color: '#ffb74d', label: t('wizard.lifestyle.steps.moderate', 'Moderate') };
    return { id: 'bad', color: '#ff8a65', label: t('common.bad', 'Bad') };
  }

  function visualHtml(kind) {
    switch (kind) {
      case 'stiffness':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<circle class="metric-stiffness-hub" cx="32" cy="32" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' +
          '<g class="metric-stiffness-gear"><path d="M32 10v6M32 48v6M10 32h6M48 32h6M16.8 16.8l4.2 4.2M43 43l4.2 4.2M16.8 47.2l4.2-4.2M43 21l4.2-4.2" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M32 14a18 18 0 1 1 0 36a18 18 0 0 1 0-36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 5"/></g></svg>';
      case 'jointPain':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<path class="metric-pain-bone" d="M22 44 Q32 28 42 44" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4" stroke-linecap="round"/>' +
          '<circle class="metric-pain-ring metric-pain-ring--2" cx="32" cy="36" r="20" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
          '<circle class="metric-pain-ring metric-pain-ring--1" cx="32" cy="36" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
          '<circle class="metric-pain-core" cx="32" cy="36" r="9" fill="currentColor" opacity="0.35"/></svg>';
      case 'mobility':
        return '<svg class="metric-svg metric-svg--mobility" viewBox="0 0 64 80" focusable="false" aria-hidden="true">' +
          '<path class="metric-mobility-path" d="M32 8 C38 22 26 36 38 50 C30 64 34 72" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5" stroke-dasharray="3 4"/>' +
          '<g class="metric-mobility-step metric-mobility-step--1" transform="translate(26 6)"><use href="#icon-footprint" width="12" height="12"/></g>' +
          '<g class="metric-mobility-step metric-mobility-step--2" transform="translate(36 20)"><use href="#icon-footprint" width="12" height="12"/></g>' +
          '<g class="metric-mobility-step metric-mobility-step--3" transform="translate(24 34)"><use href="#icon-footprint" width="12" height="12"/></g>' +
          '<g class="metric-mobility-step metric-mobility-step--4" transform="translate(36 48)"><use href="#icon-footprint" width="12" height="12"/></g>' +
          '<g class="metric-mobility-step metric-mobility-step--5" transform="translate(26 62)"><use href="#icon-footprint" width="12" height="12"/></g></svg>';
      case 'swelling':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<ellipse class="metric-swell-outline" cx="32" cy="38" rx="14" ry="18" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>' +
          '<ellipse class="metric-swell-blob" cx="32" cy="38" rx="10" ry="12" fill="currentColor" opacity="0.5"/></svg>';
      case 'fatigue':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<rect class="metric-battery-cap" x="28" y="14" width="8" height="4" rx="1" fill="rgba(255,255,255,0.35)"/>' +
          '<rect class="metric-battery-body" x="18" y="18" width="28" height="40" rx="5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>' +
          '<rect class="metric-battery-fill" x="22" y="22" width="20" height="32" rx="3" fill="currentColor"/></svg>';
      case 'sleep':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<rect class="metric-sleep-sky" x="8" y="8" width="48" height="48" rx="12" fill="rgba(255,255,255,0.04)"/>' +
          '<path class="metric-sleep-moon" d="M38 18a16 16 0 1 0 8 26a12 12 0 1 1 0-26" fill="currentColor" opacity="0.85"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--1" cx="20" cy="22" r="1.8" fill="currentColor"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--2" cx="26" cy="14" r="1.2" fill="currentColor"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--3" cx="16" cy="32" r="1.4" fill="currentColor"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--4" cx="22" cy="40" r="1" fill="currentColor"/></svg>';
      case 'mood':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<circle class="metric-mood-sun" cx="24" cy="26" r="14" fill="currentColor" opacity="0.9"/>' +
          '<g class="metric-mood-rays" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
          '<line x1="24" y1="6" x2="24" y2="10"/><line x1="24" y1="42" x2="24" y2="46"/>' +
          '<line x1="4" y1="26" x2="8" y2="26"/><line x1="40" y1="26" x2="44" y2="26"/>' +
          '<line x1="10" y1="12" x2="13" y2="15"/><line x1="35" y1="37" x2="38" y2="40"/>' +
          '<line x1="38" y1="12" x2="35" y2="15"/><line x1="13" y1="37" x2="10" y2="40"/></g>' +
          '<path class="metric-mood-cloud" d="M44 38h-4a10 10 0 1 0-2-18a8 8 0 0 1 14 6a6 6 0 0 1 1 12z" fill="rgba(255,255,255,0.2)" stroke="currentColor" stroke-width="1.5"/></svg>';
      case 'irritability':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<rect class="metric-steam-gauge-bg" x="24" y="16" width="16" height="36" rx="4" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>' +
          '<rect class="metric-steam-gauge-fill" x="27" y="42" width="10" height="0" rx="2" fill="currentColor"/>' +
          '<path class="metric-steam-line metric-steam-line--1" d="M28 12 Q26 6 28 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path class="metric-steam-line metric-steam-line--2" d="M32 10 Q32 4 32 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path class="metric-steam-line metric-steam-line--3" d="M36 12 Q38 6 36 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      case 'weather':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<path class="metric-weather-cloud" d="M46 30h-3a12 12 0 1 0-4-22a10 10 0 0 0-18 4a8 8 0 0 0 2 15h23z" fill="rgba(255,255,255,0.08)" stroke="currentColor" stroke-width="1.5"/>' +
          '<line class="metric-rain metric-rain--1" x1="24" y1="36" x2="22" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--2" x1="32" y1="36" x2="30" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--3" x1="40" y1="36" x2="38" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--4" x1="28" y1="40" x2="26" y2="50" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--5" x1="36" y1="40" x2="34" y2="52" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      case 'dailyFunction':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<circle class="metric-ring-track" cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="5"/>' +
          '<circle class="metric-ring-progress" cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" transform="rotate(-90 32 32)"/>' +
          '<path class="metric-ring-check" d="M24 32l6 6 12-14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg>';
      default:
        return '';
    }
  }

  function applyVisualState(widget, id, value) {
    var v = parseInt(value, 10);
    if (isNaN(v)) v = 5;
    var r = ratio(v, 1, 10);
    var kind = VISUAL[id];
    var visual = widget.querySelector('.metric-widget__visual');
    if (!visual) return;

    if (kind === 'stiffness') {
      var gear = visual.querySelector('.metric-stiffness-gear');
      if (gear) {
        var dur = (0.6 + r * 2.8).toFixed(2);
        gear.style.animationDuration = dur + 's';
        widget.style.setProperty('--metric-stiffness-speed', dur + 's');
      }
    } else if (kind === 'jointPain') {
      var sev = r;
      visual.querySelectorAll('.metric-pain-ring').forEach(function (ring, i) {
        ring.style.opacity = String(clamp(sev * 1.2 - i * 0.25, 0, 1));
      });
      var core = visual.querySelector('.metric-pain-core');
      if (core) core.setAttribute('opacity', String(0.2 + sev * 0.75));
    } else if (kind === 'mobility') {
      var lit = Math.ceil(r * 5);
      visual.querySelectorAll('.metric-mobility-step').forEach(function (step, i) {
        step.classList.toggle('metric-mobility-step--lit', i < lit);
      });
    } else if (kind === 'swelling') {
      var blob = visual.querySelector('.metric-swell-blob');
      if (blob) {
        var sx = 0.55 + r * 0.55;
        var sy = 0.55 + r * 0.65;
        blob.setAttribute('transform', 'scale(' + sx.toFixed(2) + ' ' + sy.toFixed(2) + ')');
        blob.setAttribute('transform-origin', '32px 38px');
      }
    } else if (kind === 'fatigue') {
      var fill = visual.querySelector('.metric-battery-fill');
      if (fill) {
        var h = Math.max(2, (1 - r) * 32);
        fill.setAttribute('y', String(54 - h));
        fill.setAttribute('height', String(h));
      }
    } else if (kind === 'sleep') {
      var moon = visual.querySelector('.metric-sleep-moon');
      if (moon) moon.setAttribute('opacity', String(0.35 + r * 0.65));
      visual.querySelectorAll('.metric-sleep-star').forEach(function (star, i) {
        star.style.opacity = r >= (i + 1) * 0.22 ? '1' : '0.15';
      });
    } else if (kind === 'mood') {
      var sunOp = 0.15 + r * 0.85;
      var cloudOp = 0.85 - r * 0.7;
      var sun = visual.querySelector('.metric-mood-sun');
      var rays = visual.querySelector('.metric-mood-rays');
      var cloud = visual.querySelector('.metric-mood-cloud');
      if (sun) sun.setAttribute('opacity', String(sunOp));
      if (rays) rays.style.opacity = String(sunOp);
      if (cloud) cloud.setAttribute('opacity', String(cloudOp));
    } else if (kind === 'irritability') {
      var gauge = visual.querySelector('.metric-steam-gauge-fill');
      if (gauge) {
        var gh = Math.max(1, r * 30);
        gauge.setAttribute('y', String(49 - gh));
        gauge.setAttribute('height', String(gh));
      }
      visual.querySelectorAll('.metric-steam-line').forEach(function (line, i) {
        line.style.opacity = r >= 0.25 + i * 0.2 ? '1' : '0.12';
      });
    } else if (kind === 'weather') {
      var drops = Math.ceil(r * 5);
      visual.querySelectorAll('.metric-rain').forEach(function (drop, i) {
        drop.classList.toggle('metric-rain--on', i < drops);
      });
    } else if (kind === 'dailyFunction') {
      var prog = visual.querySelector('.metric-ring-progress');
      var check = visual.querySelector('.metric-ring-check');
      var circ = 2 * Math.PI * 22;
      if (prog) prog.style.strokeDasharray = circ.toFixed(1);
      if (prog) prog.style.strokeDashoffset = String(circ * (1 - r));
      if (check) check.setAttribute('opacity', r >= 0.65 ? '1' : String(r * 0.5));
    }
  }

  function refreshSlider(slider) {
    if (!slider || !slider.id) return;
    var widget = slider.closest('.metric-widget');
    if (!widget) return;
    var value = parseInt(slider.value, 10);
    if (isNaN(value)) value = 5;
    var zone = classifyZone(slider.id, value);
    widget.setAttribute('data-metric-zone', zone.id);
    widget.style.setProperty('--metric-color', zone.color);
    widget.setAttribute('data-metric-active', 'true');
    var display = widget.querySelector('.metric-readout__value');
    if (display) {
      display.textContent = String(value);
      display.classList.add('metric-readout--pulse');
      global.setTimeout(function () { display.classList.remove('metric-readout--pulse'); }, 220);
    }
    var badge = widget.querySelector('.metric-zone-badge');
    if (badge) badge.textContent = zone.label;
    var pct = ratio(value, parseInt(slider.min, 10) || 1, parseInt(slider.max, 10) || 10) * 100;
    slider.style.setProperty('--metric-fill-pct', pct.toFixed(1) + '%');
    slider.style.setProperty('--metric-fill-color', zone.color);
    applyVisualState(widget, slider.id, value);
  }

  function nudgeSlider(id, delta) {
    var slider = document.getElementById(id);
    if (!slider) return;
    var min = parseInt(slider.min, 10) || 1;
    var max = parseInt(slider.max, 10) || 10;
    slider.value = String(clamp(parseInt(slider.value, 10) + delta, min, max));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof global.updateSliderColor === 'function') global.updateSliderColor(slider);
    else refreshSlider(slider);
  }

  function buildWidget(slider) {
    if (!slider || slider.dataset.metricBuilt === '1') return;
    var container = slider.closest('.slider-container');
    if (!container) return;
    slider.dataset.metricBuilt = '1';
    var id = slider.id;
    var kind = VISUAL[id] || 'dailyFunction';

    container.classList.add('metric-widget', 'metric-widget--' + id);
    container.setAttribute('data-metric-id', id);
    container.setAttribute('data-metric-active', 'false');

    var label = container.querySelector('label[for="' + id + '"]');
    var goodBad = container.querySelector('.slider-good-bad');

    var body = document.createElement('div');
    body.className = 'metric-widget__body';

    var visualWrap = document.createElement('div');
    visualWrap.className = 'metric-widget__visual';
    visualWrap.innerHTML = visualHtml(kind);
    body.appendChild(visualWrap);

    var controls = document.createElement('div');
    controls.className = 'metric-widget__controls';

    var readout = document.createElement('div');
    readout.className = 'metric-readout';
    readout.setAttribute('aria-live', 'polite');
    readout.innerHTML = '<span class="metric-readout__value">5</span><span class="metric-readout__scale">/10</span>';
    controls.appendChild(readout);

    var badge = document.createElement('span');
    badge.className = 'metric-zone-badge';
    controls.appendChild(badge);

    slider.classList.add('metric-slider');
    slider.parentNode.removeChild(slider);
    controls.appendChild(slider);

    var stepper = document.createElement('div');
    stepper.className = 'metric-stepper-row';
    stepper.innerHTML =
      '<button type="button" class="metric-stepper-btn" data-metric-nudge="' + id + '" data-delta="-1" aria-label="Decrease">−</button>' +
      '<button type="button" class="metric-stepper-btn" data-metric-nudge="' + id + '" data-delta="1" aria-label="Increase">+</button>';
    controls.appendChild(stepper);

    if (goodBad) controls.appendChild(goodBad);
    body.appendChild(controls);

    if (label) {
      label.classList.add('metric-widget__label');
      container.insertBefore(label, container.firstChild);
    }
    container.appendChild(body);

    slider.addEventListener('focus', function () {
      container.classList.add('metric-widget--focused');
    });
    slider.addEventListener('blur', function () {
      container.classList.remove('metric-widget--focused');
    });
  }

  function bindSteppers(root) {
    (root || document).querySelectorAll('[data-metric-nudge]').forEach(function (btn) {
      if (btn.dataset.metricBound === '1') return;
      btn.dataset.metricBound = '1';
      btn.addEventListener('click', function () {
        nudgeSlider(btn.getAttribute('data-metric-nudge'), parseInt(btn.getAttribute('data-delta'), 10));
      });
    });
  }

  function buildAll() {
    METRIC_IDS.forEach(function (id) {
      var slider = document.getElementById(id);
      if (slider) buildWidget(slider);
    });
    bindSteppers(document);
  }

  function refreshAll() {
    METRIC_IDS.forEach(function (id) {
      var slider = document.getElementById(id);
      if (slider) refreshSlider(slider);
    });
  }

  global.RianellLogMetrics = {
    buildAll: buildAll,
    refreshSlider: refreshSlider,
    refreshAll: refreshAll,
    classifyZone: classifyZone,
    METRIC_IDS: METRIC_IDS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
