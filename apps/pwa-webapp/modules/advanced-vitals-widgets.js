/**
 * Animated advanced vitals: glucose (droplet slider), SpO2 (ring + drum),
 * HRV (waveform slider), body weight (balance slider).
 */
(function (global) {
  'use strict';

  var SPO2 = { min: 70, max: 100, default: 98 };
  var HRV = { min: 0, max: 300, default: 55 };
  var WEIGHT_KG = { min: 20, max: 300, default: 70, step: 0.1 };
  var WEIGHT_LBS = { min: 44, max: 661, default: 154, step: 0.1 };

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

  function settings() {
    return global.appSettings || {};
  }

  function dispatchInput(id) {
    var el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof global.scheduleLogDraftPersist === 'function') global.scheduleLogDraftPersist();
  }

  function setHidden(id, value, active) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = active && value != null && value !== '' && !isNaN(value) ? String(value) : '';
  }

  function parseHidden(id) {
    var el = document.getElementById(id);
    if (!el || !el.value) return null;
    var n = parseFloat(el.value);
    return isNaN(n) ? null : n;
  }

  function glucoseRange() {
    var unit = settings().glucoseUnit === 'mgdl' ? 'mgdl' : 'mmol';
    if (unit === 'mgdl') return { min: 18, max: 600, step: 1, default: 100, unit: 'mgdl' };
    return { min: 1, max: 35, step: 0.1, default: 5.5, unit: 'mmol' };
  }

  function weightRange() {
    if (settings().bodyWeightUnit === 'lbs') return WEIGHT_LBS;
    return WEIGHT_KG;
  }

  function classifyGlucose(val, unit) {
    if (val == null || isNaN(val)) return { id: 'idle', label: '—', color: '#8aa89a' };
    if (unit === 'mgdl') {
      if (val < 70) return { id: 'low', label: t('wizard.vitals.glucose.low', 'Low'), color: '#64b5f6' };
      if (val <= 140) return { id: 'normal', label: t('wizard.vitals.glucose.normal', 'In range'), color: '#7bdf8c' };
      if (val <= 200) return { id: 'high', label: t('wizard.vitals.glucose.high', 'High'), color: '#ffb74d' };
      return { id: 'veryHigh', label: t('wizard.vitals.glucose.veryHigh', 'Very high'), color: '#ff7043' };
    }
    if (val < 3.9) return { id: 'low', label: t('wizard.vitals.glucose.low', 'Low'), color: '#64b5f6' };
    if (val <= 7.8) return { id: 'normal', label: t('wizard.vitals.glucose.normal', 'In range'), color: '#7bdf8c' };
    if (val <= 11.1) return { id: 'high', label: t('wizard.vitals.glucose.high', 'High'), color: '#ffb74d' };
    return { id: 'veryHigh', label: t('wizard.vitals.glucose.veryHigh', 'Very high'), color: '#ff7043' };
  }

  function classifySpO2(val) {
    if (val == null || isNaN(val)) return { id: 'idle', label: '—', color: '#8aa89a' };
    if (val >= 95) return { id: 'normal', label: t('wizard.vitals.spo2.normal', 'Normal'), color: '#4dd0e1' };
    if (val >= 90) return { id: 'low', label: t('wizard.vitals.spo2.low', 'Low'), color: '#ffb74d' };
    return { id: 'critical', label: t('wizard.vitals.spo2.critical', 'Critical'), color: '#ff5252' };
  }

  function classifyHrv(val) {
    if (val == null || isNaN(val)) return { id: 'idle', label: '—', color: '#8aa89a' };
    if (val >= 50) return { id: 'good', label: t('wizard.vitals.hrv.good', 'Good variability'), color: '#ba68c8' };
    if (val >= 25) return { id: 'moderate', label: t('wizard.vitals.hrv.moderate', 'Moderate'), color: '#9575cd' };
    return { id: 'low', label: t('wizard.vitals.hrv.low', 'Low'), color: '#7986cb' };
  }

  function applyZone(widget, zone, pulseSec) {
    if (!widget) return;
    widget.setAttribute('data-vital-zone', zone.id);
    widget.style.setProperty('--vital-color', zone.color);
    if (pulseSec != null) widget.style.setProperty('--vital-pulse-rate', pulseSec + 's');
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

  function ratio(val, min, max) {
    if (max <= min) return 0;
    return clamp((val - min) / (max - min), 0, 1);
  }

  function formatGlucose(val, unit) {
    if (unit === 'mgdl') return String(Math.round(val));
    return val.toFixed(1);
  }

  function updateGlucose(markActive) {
    var widget = document.getElementById('glucoseWidget');
    var slider = document.getElementById('glucoseSlider');
    var display = document.getElementById('glucoseValueDisplay');
    var badge = document.getElementById('glucoseZoneBadge');
    var fill = document.getElementById('glucoseDropletFill');
    if (!widget || !slider) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var range = glucoseRange();
    var val = parseFloat(slider.value);
    if (active) {
      val = clamp(isNaN(val) ? range.default : val, range.min, range.max);
      setHidden('bloodGlucose', formatGlucose(val, range.unit), true);
    } else {
      setHidden('bloodGlucose', null, false);
    }
    var zone = classifyGlucose(active ? val : null, range.unit);
    applyZone(widget, zone, 1.4 - ratio(active ? val : range.default, range.min, range.max) * 0.5);
    if (display) {
      display.textContent = active ? formatGlucose(val, range.unit) : '—';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active ? zone.label : t('wizard.vitals.glucose.hint', 'Slide to set glucose');
    if (fill) fill.style.transform = 'scaleY(' + (active ? 0.12 + ratio(val, range.min, range.max) * 0.88 : 0.08).toFixed(3) + ')';
    slider.style.setProperty('--vital-fill-pct', (ratio(val, range.min, range.max) * 100).toFixed(1) + '%');
  }

  function syncGlucoseSliderRange(preserve) {
    var slider = document.getElementById('glucoseSlider');
    var hidden = document.getElementById('bloodGlucose');
    if (!slider) return;
    var range = glucoseRange();
    var prev = preserve && hidden && hidden.value ? parseFloat(hidden.value) : range.default;
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    slider.value = String(clamp(isNaN(prev) ? range.default : prev, range.min, range.max));
    var suffix = document.getElementById('glucoseUnitDisplay');
    if (suffix) suffix.textContent = range.unit === 'mgdl' ? 'mg/dL' : 'mmol/L';
    var suffix2 = document.getElementById('glucoseUnitSuffix');
    if (suffix2) suffix2.textContent = range.unit === 'mgdl' ? 'mg/dL' : 'mmol/L';
    updateGlucose(!!(hidden && hidden.value));
  }

  function updateSpO2(markActive) {
    var widget = document.getElementById('spo2Widget');
    var drum = document.getElementById('spo2Drum');
    var display = document.getElementById('spo2ValueDisplay');
    var badge = document.getElementById('spo2ZoneBadge');
    var ring = document.getElementById('spo2RingProgress');
    if (!widget || !drum) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var val = drumValueAtCenter(drum);
    if (active) val = clamp(val != null ? val : SPO2.default, SPO2.min, SPO2.max);
    setHidden('spO2', active ? Math.round(val) : null, active);
    var zone = classifySpO2(active ? val : null);
    applyZone(widget, zone, 1.6 - ratio(active ? val : SPO2.default, SPO2.min, SPO2.max) * 0.6);
    if (display) {
      display.textContent = active ? String(Math.round(val)) : '—';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active ? zone.label : t('wizard.vitals.spo2.hint', 'Slide drum to set SpO₂');
    if (ring) {
      var pct = active ? ratio(val, SPO2.min, SPO2.max) : 0;
      ring.style.strokeDashoffset = String(283 * (1 - pct));
    }
    drum.querySelectorAll('.vital-drum-item').forEach(function (item) {
      item.classList.toggle('vital-drum-item--center', active && parseInt(item.getAttribute('data-value'), 10) === Math.round(val));
    });
  }

  function updateHrv(markActive) {
    var widget = document.getElementById('hrvWidget');
    var slider = document.getElementById('hrvSlider');
    var display = document.getElementById('hrvValueDisplay');
    var badge = document.getElementById('hrvZoneBadge');
    if (!widget || !slider) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var val = parseInt(slider.value, 10);
    if (active) val = clamp(isNaN(val) ? HRV.default : val, HRV.min, HRV.max);
    setHidden('hrv', active ? val : null, active);
    var zone = classifyHrv(active ? val : null);
    var waveRate = active ? Math.max(0.45, 1.8 - ratio(val, HRV.min, HRV.max) * 1.2) : 1.2;
    applyZone(widget, zone, waveRate);
    if (display) {
      display.textContent = active ? String(val) : '—';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active ? zone.label : t('wizard.vitals.hrv.hint', 'Slide to set HRV');
    slider.style.setProperty('--vital-fill-pct', (ratio(val, HRV.min, HRV.max) * 100).toFixed(1) + '%');
  }

  function updateBodyWeight(markActive) {
    var widget = document.getElementById('bodyWeightWidget');
    var slider = document.getElementById('bodyWeightSlider');
    var display = document.getElementById('bodyWeightValueDisplay');
    var badge = document.getElementById('bodyWeightZoneBadge');
    var beam = document.getElementById('bodyWeightBeam');
    if (!widget || !slider) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var range = weightRange();
    var val = parseFloat(slider.value);
    if (active) val = clamp(isNaN(val) ? range.default : val, range.min, range.max);
    var unit = settings().bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
    setHidden('bodyWeight', active ? val.toFixed(1) : null, active);
    applyZone(widget, { id: active ? 'set' : 'idle', label: active ? unit : '—', color: '#a5d6a7' }, 1.1);
    if (display) {
      display.textContent = active ? val.toFixed(1) : '—';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active ? unit : t('wizard.vitals.weight.hint', 'Slide to set weight');
    if (beam) {
      var tilt = (ratio(val, range.min, range.max) - 0.5) * 14;
      beam.style.transform = 'rotate(' + tilt.toFixed(2) + 'deg)';
    }
    slider.style.setProperty('--vital-fill-pct', (ratio(val, range.min, range.max) * 100).toFixed(1) + '%');
    if (typeof global.updateBmiReadout === 'function') global.updateBmiReadout();
  }

  function syncBodyWeightSliderRange(preserve) {
    var slider = document.getElementById('bodyWeightSlider');
    var hidden = document.getElementById('bodyWeight');
    if (!slider) return;
    var range = weightRange();
    var prev = preserve && hidden && hidden.value ? parseFloat(hidden.value) : range.default;
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    slider.value = String(clamp(isNaN(prev) ? range.default : prev, range.min, range.max));
    var display = document.getElementById('bodyWeightUnitDisplay');
    if (display) display.textContent = settings().bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
    var suffix = document.getElementById('bodyWeightUnitSuffix');
    if (suffix) suffix.textContent = settings().bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
    updateBodyWeight(!!(hidden && hidden.value));
  }

  function nudge(kind, delta) {
    if (kind === 'glucose') {
      var slider = document.getElementById('glucoseSlider');
      var range = glucoseRange();
      if (!slider) return;
      var step = range.step;
      var dir = delta >= 0 ? step : -step;
      slider.value = String(clamp(parseFloat(slider.value) + dir, range.min, range.max));
      updateGlucose(true);
      dispatchInput('bloodGlucose');
    } else if (kind === 'spo2') {
      var drum = document.getElementById('spo2Drum');
      var cur = drumValueAtCenter(drum) || SPO2.default;
      scrollDrumToValue(drum, clamp(cur + delta, SPO2.min, SPO2.max), true);
      updateSpO2(true);
      dispatchInput('spO2');
    } else if (kind === 'hrv') {
      var hrvSlider = document.getElementById('hrvSlider');
      if (!hrvSlider) return;
      hrvSlider.value = String(clamp(parseInt(hrvSlider.value, 10) + delta, HRV.min, HRV.max));
      updateHrv(true);
      dispatchInput('hrv');
    } else if (kind === 'bodyWeight') {
      var wSlider = document.getElementById('bodyWeightSlider');
      var wRange = weightRange();
      if (!wSlider) return;
      wSlider.value = String(clamp(parseFloat(wSlider.value) + delta, wRange.min, wRange.max));
      updateBodyWeight(true);
      dispatchInput('bodyWeight');
    }
  }

  function resetAdvancedVitals() {
    ['glucoseWidget', 'spo2Widget', 'hrvWidget', 'bodyWeightWidget'].forEach(function (id) {
      var w = document.getElementById(id);
      if (w) w.setAttribute('data-vital-active', 'false');
    });
    syncGlucoseSliderRange(false);
    scrollDrumToValue(document.getElementById('spo2Drum'), SPO2.default, false);
    var hrvSlider = document.getElementById('hrvSlider');
    if (hrvSlider) hrvSlider.value = String(HRV.default);
    syncBodyWeightSliderRange(false);
    setHidden('bloodGlucose', null, false);
    setHidden('spO2', null, false);
    setHidden('hrv', null, false);
    setHidden('bodyWeight', null, false);
    updateGlucose(false);
    updateSpO2(false);
    updateHrv(false);
    updateBodyWeight(false);
  }

  function restoreFromHiddenInputs() {
    if (parseHidden('bloodGlucose') != null) {
      var gSlider = document.getElementById('glucoseSlider');
      if (gSlider) gSlider.value = String(parseHidden('bloodGlucose'));
      updateGlucose(true);
    }
    if (parseHidden('spO2') != null) {
      scrollDrumToValue(document.getElementById('spo2Drum'), parseHidden('spO2'), false);
      updateSpO2(true);
    }
    if (parseHidden('hrv') != null) {
      var hrvSlider = document.getElementById('hrvSlider');
      if (hrvSlider) hrvSlider.value = String(parseHidden('hrv'));
      updateHrv(true);
    }
    if (parseHidden('bodyWeight') != null) {
      var wSlider = document.getElementById('bodyWeightSlider');
      if (wSlider) wSlider.value = String(parseHidden('bodyWeight'));
      updateBodyWeight(true);
    }
  }

  function setVitalValues(fieldId, value) {
    if (fieldId === 'bloodGlucose' && value != null) {
      var gSlider = document.getElementById('glucoseSlider');
      if (gSlider) gSlider.value = String(value);
      updateGlucose(true);
    } else if (fieldId === 'spO2' && value != null) {
      scrollDrumToValue(document.getElementById('spo2Drum'), value, false);
      updateSpO2(true);
    } else if (fieldId === 'hrv' && value != null) {
      var hrvSlider = document.getElementById('hrvSlider');
      if (hrvSlider) hrvSlider.value = String(value);
      updateHrv(true);
    } else if (fieldId === 'bodyWeight' && value != null) {
      var wSlider = document.getElementById('bodyWeightSlider');
      if (wSlider) wSlider.value = String(value);
      updateBodyWeight(true);
    }
  }

  function initAdvancedVitalsWidgets() {
    var root = document.getElementById('vitalsAdvancedDetails');
    if (!root || root.dataset.vitalWidgetsInit === '1') return;
    root.dataset.vitalWidgetsInit = '1';

    buildDrum(document.getElementById('spo2Drum'), SPO2);
    scrollDrumToValue(document.getElementById('spo2Drum'), SPO2.default, false);
    bindDrumScroll(document.getElementById('spo2Drum'), function (commit) {
      updateSpO2(true);
      if (commit) dispatchInput('spO2');
    });

    syncGlucoseSliderRange(false);
    syncBodyWeightSliderRange(false);

    var glucoseSlider = document.getElementById('glucoseSlider');
    if (glucoseSlider) {
      glucoseSlider.addEventListener('input', function () { updateGlucose(true); dispatchInput('bloodGlucose'); });
    }
    var hrvSlider = document.getElementById('hrvSlider');
    if (hrvSlider) {
      hrvSlider.min = String(HRV.min);
      hrvSlider.max = String(HRV.max);
      hrvSlider.step = '1';
      hrvSlider.value = String(HRV.default);
      hrvSlider.addEventListener('input', function () { updateHrv(true); dispatchInput('hrv'); });
    }
    var bodyWeightSlider = document.getElementById('bodyWeightSlider');
    if (bodyWeightSlider) {
      bodyWeightSlider.addEventListener('input', function () { updateBodyWeight(true); dispatchInput('bodyWeight'); });
    }

    root.querySelectorAll('[data-vital-nudge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        nudge(btn.getAttribute('data-vital-nudge'), parseFloat(btn.getAttribute('data-delta')));
      });
    });

    restoreFromHiddenInputs();
    updateGlucose(false);
    updateSpO2(false);
    updateHrv(false);
    updateBodyWeight(false);
  }

  global.RianellAdvancedVitals = {
    init: initAdvancedVitalsWidgets,
    reset: resetAdvancedVitals,
    restoreFromHiddenInputs: restoreFromHiddenInputs,
    setVitalValues: setVitalValues,
    syncGlucoseUnit: syncGlucoseSliderRange,
    syncBodyWeightUnit: syncBodyWeightSliderRange,
  };
  global.initAdvancedVitalsWidgets = initAdvancedVitalsWidgets;
  global.resetAdvancedVitalsWidgets = resetAdvancedVitals;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedVitalsWidgets);
  } else {
    initAdvancedVitalsWidgets();
  }
})(typeof window !== 'undefined' ? window : globalThis);
