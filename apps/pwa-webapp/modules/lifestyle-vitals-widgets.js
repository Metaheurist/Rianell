/**
 * Animated lifestyle inputs: steps (footprint trail + runner) and hydration (glass fill).
 * Steps and hydration use SpO2-style drum pickers.
 */
(function (global) {
  'use strict';

  var STEPS = { min: 0, max: 30000, step: 500, default: 0 };
  var HYDRATION = { min: 0, max: 20, step: 0.5, default: 0 };
  var HYDRATION_GLASS = { top: 6, bottom: 79, left: 14, width: 28, idlePuddle: 0.05 };

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

  function dispatchInput(id) {
    var el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof global.scheduleLogDraftPersist === 'function') global.scheduleLogDraftPersist();
    if (typeof global.updateGoalsProgressBlock === 'function') global.updateGoalsProgressBlock();
  }

  function setHidden(id, value, active) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = active && value != null && !isNaN(value) && Number(value) > 0 ? String(value) : '';
  }

  function applyZone(widget, zone, pulseSec) {
    if (!widget) return;
    widget.setAttribute('data-vital-zone', zone.id);
    widget.style.setProperty('--vital-color', zone.color);
    if (pulseSec != null) widget.style.setProperty('--vital-pulse-rate', pulseSec + 's');
  }

  function classifySteps(val) {
    if (val == null || isNaN(val) || val <= 0) return { id: 'idle', label: '-', color: '#8aa89a' };
    if (val >= 10000) return { id: 'active', label: t('wizard.lifestyle.steps.active', 'Very active'), color: '#64b5f6' };
    if (val >= 6000) return { id: 'moderate', label: t('wizard.lifestyle.steps.moderate', 'Moderate'), color: '#7bdf8c' };
    if (val >= 3000) return { id: 'light', label: t('wizard.lifestyle.steps.light', 'Light activity'), color: '#ffd54f' };
    return { id: 'low', label: t('wizard.lifestyle.steps.low', 'Low'), color: '#ffb74d' };
  }

  function classifyHydration(val) {
    if (val == null || isNaN(val) || val <= 0) return { id: 'idle', label: '-', color: '#8aa89a' };
    if (val >= 8) return { id: 'great', label: t('wizard.lifestyle.hydration.great', 'Well hydrated'), color: '#4dd0e1' };
    if (val >= 5) return { id: 'good', label: t('wizard.lifestyle.hydration.good', 'Good'), color: '#7bdf8c' };
    if (val >= 2) return { id: 'low', label: t('wizard.lifestyle.hydration.low', 'Could drink more'), color: '#ffb74d' };
    return { id: 'veryLow', label: t('wizard.lifestyle.hydration.veryLow', 'Low intake'), color: '#ff8a65' };
  }

  function formatSteps(n) {
    return Math.round(n).toLocaleString();
  }

  function formatHydration(n) {
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  }

  function buildDrum(scrollEl, cfg) {
    if (!scrollEl || scrollEl.dataset.vitalDrumBuilt === '1') return;
    scrollEl.dataset.vitalDrumBuilt = '1';
    scrollEl.innerHTML = '';
    var spacer = document.createElement('div');
    spacer.className = 'vital-drum-spacer';
    scrollEl.appendChild(spacer);
    var step = cfg.step || 1;
    for (var v = cfg.min; v <= cfg.max + 0.0001; v += step) {
      var rounded = step < 1 ? Math.round(v * 10) / 10 : Math.round(v);
      var item = document.createElement('div');
      item.className = 'vital-drum-item';
      item.setAttribute('data-value', String(rounded));
      item.setAttribute('role', 'option');
      item.textContent = cfg.format ? cfg.format(rounded) : String(rounded);
      scrollEl.appendChild(item);
    }
    scrollEl.appendChild(spacer.cloneNode(true));
  }

  function drumValueAtCenter(scrollEl) {
    if (global.RianellDrumPicker && typeof global.RianellDrumPicker.valueAtCenter === 'function') {
      return global.RianellDrumPicker.valueAtCenter(scrollEl);
    }
    if (!scrollEl) return null;
    var rect = scrollEl.getBoundingClientRect();
    var centerY = rect.top + rect.height / 2;
    var best = null;
    var bestDist = Infinity;
    scrollEl.querySelectorAll('.vital-drum-item').forEach(function (item) {
      var ir = item.getBoundingClientRect();
      var dist = Math.abs(ir.top + ir.height / 2 - centerY);
      if (dist < bestDist) {
        bestDist = dist;
        best = parseFloat(item.getAttribute('data-value'));
      }
    });
    return best;
  }

  function scrollDrumToValue(scrollEl, value, smooth) {
    if (global.RianellDrumPicker && typeof global.RianellDrumPicker.scrollToValue === 'function') {
      global.RianellDrumPicker.scrollToValue(scrollEl, value, smooth);
      return;
    }
    if (!scrollEl) return;
    var item = scrollEl.querySelector('.vital-drum-item[data-value="' + value + '"]');
    if (!item) {
      var items = scrollEl.querySelectorAll('.vital-drum-item');
      var closest = null;
      var diff = Infinity;
      items.forEach(function (el) {
        var v = parseFloat(el.getAttribute('data-value'));
        var d = Math.abs(v - value);
        if (d < diff) { diff = d; closest = el; }
      });
      item = closest;
    }
    if (item) item.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  }

  function bindDrumScroll(scrollEl, onChange) {
    if (!scrollEl || scrollEl.dataset.vitalBound === '1') return;
    scrollEl.dataset.vitalBound = '1';
    if (global.RianellDrumPicker && typeof global.RianellDrumPicker.bind === 'function') {
      global.RianellDrumPicker.bind(scrollEl, {
        onScroll: function () { onChange(false); },
        onSnap: function () { onChange(true); },
      });
      return;
    }
    var ticking = false;
    var scrollEndTimer = null;
    scrollEl.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        global.requestAnimationFrame(function () {
          ticking = false;
          onChange(false);
        });
      }
      if (scrollEndTimer) global.clearTimeout(scrollEndTimer);
      scrollEndTimer = global.setTimeout(function () {
        scrollEndTimer = null;
        onChange(true);
      }, 120);
    }, { passive: true });
    scrollEl.addEventListener('click', function (e) {
      var item = e.target.closest('.vital-drum-item');
      if (!item) return;
      scrollDrumToValue(scrollEl, parseFloat(item.getAttribute('data-value')), true);
      onChange(true);
    });
  }

  function buildHydrationMiniGlasses() {
    var row = document.getElementById('hydrationGlassesRow');
    if (!row || row.dataset.built === '1') return;
    row.dataset.built = '1';
    row.innerHTML = '';
    for (var i = 0; i < 8; i++) {
      var glass = document.createElement('span');
      glass.className = 'hydration-mini-glass';
      glass.innerHTML = '<svg class="ui-svg-icon" aria-hidden="true"><use href="#icon-glass-water"></use></svg>';
      row.appendChild(glass);
    }
  }

  function hydrationFillRatio(active, val) {
    if (!active) return HYDRATION_GLASS.idlePuddle;
    return 0.06 + ratio(val, 0, HYDRATION.max) * 0.94;
  }

  function updateHydrationLiquid(active, val, rising) {
    var fill = document.getElementById('hydrationGlassFill');
    var surface = document.getElementById('hydrationLiquidSurface');
    var widget = document.getElementById('hydrationWidget');
    var fillRatio = hydrationFillRatio(active, val);
    var innerH = HYDRATION_GLASS.bottom - HYDRATION_GLASS.top;
    var height = innerH * fillRatio;
    var top = HYDRATION_GLASS.bottom - height;
    if (fill) {
      fill.setAttribute('y', String(top));
      fill.setAttribute('height', String(height));
    }
    if (surface) {
      surface.setAttribute('transform', 'translate(' + HYDRATION_GLASS.left + ' ' + top + ')');
      surface.style.opacity = active && height > 2 ? '1' : '0';
    }
    if (widget && rising) {
      widget.classList.add('hydration-widget--pouring');
      global.setTimeout(function () {
        widget.classList.remove('hydration-widget--pouring');
      }, 620);
    }
  }

  function stampFootprints(widget, prevLit, nextLit) {
    if (!widget || nextLit <= prevLit) return;
    widget.querySelectorAll('.steps-footprint').forEach(function (fp, i) {
      if (i >= prevLit && i < nextLit) {
        fp.classList.remove('steps-footprint--stamping');
        void fp.offsetWidth;
        fp.classList.add('steps-footprint--stamping');
        global.setTimeout(function () {
          fp.classList.remove('steps-footprint--stamping');
        }, 480);
      }
    });
  }

  function updateSteps(markActive) {
    var widget = document.getElementById('stepsWidget');
    var drum = document.getElementById('stepsDrum');
    var display = document.getElementById('stepsValueDisplay');
    var badge = document.getElementById('stepsZoneBadge');
    if (!widget || !drum) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var val = drumValueAtCenter(drum);
    if (active) val = clamp(val != null ? val : STEPS.default, STEPS.min, STEPS.max);
    else if (val == null || isNaN(val)) val = STEPS.default;
    setHidden('steps', val, active && val > 0);
    var zone = classifySteps(active ? val : null);
    applyZone(widget, zone, 1.3 - ratio(val, 0, 10000) * 0.5);
    if (display) {
      display.textContent = active && val > 0 ? formatSteps(val) : '-';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active && val > 0 ? zone.label : t('wizard.lifestyle.steps.hint', 'Slide drum to set steps');
    drum.querySelectorAll('.vital-drum-item').forEach(function (item) {
      item.classList.toggle('vital-drum-item--center', active && parseInt(item.getAttribute('data-value'), 10) === Math.round(val));
    });
    var lit = active ? Math.ceil(ratio(val, 0, 10000) * 5) : 0;
    var prevLit = parseInt(widget.dataset.stepsLit || '0', 10);
    if (markActive) stampFootprints(widget, prevLit, lit);
    widget.dataset.stepsLit = String(lit);
    widget.querySelectorAll('.steps-footprint').forEach(function (fp, i) {
      fp.classList.toggle('steps-footprint--lit', i < lit);
    });
  }

  function updateHydration(markActive) {
    var widget = document.getElementById('hydrationWidget');
    var drum = document.getElementById('hydrationDrum');
    var display = document.getElementById('hydrationValueDisplay');
    var badge = document.getElementById('hydrationZoneBadge');
    if (!widget || !drum) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var val = drumValueAtCenter(drum);
    if (active) val = clamp(val != null ? val : HYDRATION.default, HYDRATION.min, HYDRATION.max);
    else if (val == null || isNaN(val)) val = HYDRATION.default;
    var prevVal = parseFloat(widget.dataset.hydrationPrev || '0');
    var rising = markActive && active && val > prevVal;
    setHidden('hydration', val, active && val > 0);
    var zone = classifyHydration(active ? val : null);
    applyZone(widget, zone, 1.4 - ratio(val, 0, HYDRATION.max) * 0.6);
    if (display) {
      display.textContent = active && val > 0 ? formatHydration(val) : '-';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active && val > 0 ? zone.label : t('wizard.lifestyle.hydration.hint', 'Slide drum to set hydration');
    drum.querySelectorAll('.vital-drum-item').forEach(function (item) {
      var itemVal = parseFloat(item.getAttribute('data-value'));
      item.classList.toggle('vital-drum-item--center', active && Math.abs(itemVal - val) < 0.001);
    });
    updateHydrationLiquid(active, val, rising);
    widget.dataset.hydrationPrev = String(active ? val : 0);
    var row = document.getElementById('hydrationGlassesRow');
    if (row) {
      var filled = Math.min(8, Math.ceil(ratio(val, 0, 8) * 8));
      row.querySelectorAll('.hydration-mini-glass').forEach(function (g, i) {
        var shouldFill = active && i < filled;
        var wasFilled = g.classList.contains('hydration-mini-glass--filled');
        g.classList.toggle('hydration-mini-glass--filled', shouldFill);
        if (shouldFill && !wasFilled) {
          g.classList.add('hydration-mini-glass--just-filled');
          global.setTimeout(function () {
            g.classList.remove('hydration-mini-glass--just-filled');
          }, 520);
        }
      });
    }
  }

  function nudge(kind, delta) {
    if (kind === 'steps') {
      var drum = document.getElementById('stepsDrum');
      if (!drum) return;
      var cur = drumValueAtCenter(drum);
      if (cur == null || isNaN(cur)) cur = STEPS.default;
      scrollDrumToValue(drum, clamp(cur + delta, STEPS.min, STEPS.max), true);
      updateSteps(true);
      dispatchInput('steps');
    } else if (kind === 'hydration') {
      var hDrum = document.getElementById('hydrationDrum');
      if (!hDrum) return;
      var hCur = drumValueAtCenter(hDrum);
      if (hCur == null || isNaN(hCur)) hCur = HYDRATION.default;
      scrollDrumToValue(hDrum, clamp(hCur + delta, HYDRATION.min, HYDRATION.max), true);
      updateHydration(true);
      dispatchInput('hydration');
    }
  }

  function resetLifestyleVitalsWidgets() {
    var stepsWidget = document.getElementById('stepsWidget');
    var hydrationWidget = document.getElementById('hydrationWidget');
    if (stepsWidget) stepsWidget.setAttribute('data-vital-active', 'false');
    if (hydrationWidget) {
      hydrationWidget.setAttribute('data-vital-active', 'false');
      hydrationWidget.dataset.hydrationPrev = '0';
    }
    if (stepsWidget) stepsWidget.dataset.stepsLit = '0';
    scrollDrumToValue(document.getElementById('stepsDrum'), STEPS.default, false);
    scrollDrumToValue(document.getElementById('hydrationDrum'), HYDRATION.default, false);
    setHidden('steps', null, false);
    setHidden('hydration', null, false);
    updateSteps(false);
    updateHydration(false);
  }

  function restoreFromHiddenInputs() {
    var stepsVal = document.getElementById('steps');
    if (stepsVal && stepsVal.value) {
      scrollDrumToValue(document.getElementById('stepsDrum'), parseInt(stepsVal.value, 10), false);
      updateSteps(true);
    }
    var hydVal = document.getElementById('hydration');
    if (hydVal && hydVal.value) {
      scrollDrumToValue(document.getElementById('hydrationDrum'), parseFloat(hydVal.value), false);
      updateHydration(true);
    }
  }

  function initLifestyleVitalsWidgets() {
    var root = document.getElementById('lifestyleFactors');
    if (!root || root.dataset.lifestyleWidgetsInit === '1') return;
    root.dataset.lifestyleWidgetsInit = '1';

    buildHydrationMiniGlasses();

    var stepsDrum = document.getElementById('stepsDrum');
    var hydrationDrum = document.getElementById('hydrationDrum');
    buildDrum(stepsDrum, {
      min: STEPS.min,
      max: STEPS.max,
      step: STEPS.step,
      format: formatSteps,
    });
    buildDrum(hydrationDrum, {
      min: HYDRATION.min,
      max: HYDRATION.max,
      step: HYDRATION.step,
      format: formatHydration,
    });
    scrollDrumToValue(stepsDrum, STEPS.default, false);
    scrollDrumToValue(hydrationDrum, HYDRATION.default, false);
    bindDrumScroll(stepsDrum, function (commit) {
      updateSteps(true);
      if (commit) dispatchInput('steps');
    });
    bindDrumScroll(hydrationDrum, function (commit) {
      updateHydration(true);
      if (commit) dispatchInput('hydration');
    });

    root.querySelectorAll('[data-lifestyle-nudge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        nudge(btn.getAttribute('data-lifestyle-nudge'), parseFloat(btn.getAttribute('data-delta')));
      });
    });

    restoreFromHiddenInputs();
    updateSteps(false);
    updateHydration(false);
    if (global.RianellGraphicsPortfolio && typeof global.RianellGraphicsPortfolio.decorateLifestyleVitals === 'function') {
      global.RianellGraphicsPortfolio.decorateLifestyleVitals();
    }
  }

  global.RianellLifestyleVitals = {
    init: initLifestyleVitalsWidgets,
    reset: resetLifestyleVitalsWidgets,
    restoreFromHiddenInputs: restoreFromHiddenInputs,
  };
  global.initLifestyleVitalsWidgets = initLifestyleVitalsWidgets;
  global.resetLifestyleVitalsWidgets = resetLifestyleVitalsWidgets;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLifestyleVitalsWidgets);
  } else {
    initLifestyleVitalsWidgets();
  }
})(typeof window !== 'undefined' ? window : globalThis);
