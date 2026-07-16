/**
 * Animated advanced vitals: glucose (droplet + drum), SpO2 (ring + drum),
 * HRV (waveform + drum), body weight (balance + drum).
 */
(function (global) {
  'use strict';

  var SPO2 = { min: 70, max: 100, default: 98 };
  var HRV = { min: 0, max: 300, step: 1, default: 55 };
  var WEIGHT_KG = { min: 20, max: 300, default: 70, step: 0.1 };
  var WEIGHT_LBS = { min: 44, max: 661, default: 154, step: 0.1 };
  var GLUCOSE_DROPLET = { left: 8, width: 48, top: 8, bottom: 92, idlePuddle: 0.05 };

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

  function weightDrumCfg() {
    var range = weightRange();
    var step = settings().bodyWeightUnit === 'lbs' ? 1 : 0.5;
    return {
      min: range.min,
      max: range.max,
      default: range.default,
      step: step,
      format: function (v) {
        return step === 0.5 ? Number(v).toFixed(1) : String(Math.round(v));
      },
    };
  }

  function glucoseDrumCfg() {
    var range = glucoseRange();
    return {
      min: range.min,
      max: range.max,
      step: range.step,
      default: range.default,
      format: function (v) {
        return formatGlucose(v, range.unit);
      },
    };
  }

  function classifyGlucose(val, unit) {
    if (val == null || isNaN(val)) return { id: 'idle', label: '-', color: '#8aa89a', urgent: false };
    if (unit === 'mgdl') {
      if (val < 54) return { id: 'critical', label: t('wizard.vitals.glucose.criticalLow', 'Critical (low)'), color: '#ff5252', urgent: true };
      if (val < 70) return { id: 'low', label: t('wizard.vitals.glucose.low', 'Low'), color: '#64b5f6', urgent: false };
      if (val <= 140) return { id: 'normal', label: t('wizard.vitals.glucose.normal', 'In range'), color: '#7bdf8c', urgent: false };
      if (val <= 200) return { id: 'high', label: t('wizard.vitals.glucose.high', 'High'), color: '#ffb74d', urgent: false };
      if (val <= 250) return { id: 'veryHigh', label: t('wizard.vitals.glucose.veryHigh', 'Very high'), color: '#ff7043', urgent: true };
      return { id: 'critical', label: t('wizard.vitals.glucose.criticalHigh', 'Critical (high)'), color: '#ff1744', urgent: true };
    }
    if (val < 3.0) return { id: 'critical', label: t('wizard.vitals.glucose.criticalLow', 'Critical (low)'), color: '#ff5252', urgent: true };
    if (val < 3.9) return { id: 'low', label: t('wizard.vitals.glucose.low', 'Low'), color: '#64b5f6', urgent: false };
    if (val <= 7.8) return { id: 'normal', label: t('wizard.vitals.glucose.normal', 'In range'), color: '#7bdf8c', urgent: false };
    if (val <= 11.1) return { id: 'high', label: t('wizard.vitals.glucose.high', 'High'), color: '#ffb74d', urgent: false };
    if (val <= 20) return { id: 'veryHigh', label: t('wizard.vitals.glucose.veryHigh', 'Very high'), color: '#ff7043', urgent: val > 15 };
    return { id: 'critical', label: t('wizard.vitals.glucose.criticalHigh', 'Critical (high)'), color: '#ff1744', urgent: true };
  }

  function classifySpO2(val) {
    if (val == null || isNaN(val)) return { id: 'idle', label: '-', color: '#8aa89a', urgent: false };
    if (val >= 95) return { id: 'normal', label: t('wizard.vitals.spo2.normal', 'Normal'), color: '#4dd0e1', urgent: false };
    if (val >= 90) return { id: 'low', label: t('wizard.vitals.spo2.low', 'Low'), color: '#ffb74d', urgent: false };
    return { id: 'critical', label: t('wizard.vitals.spo2.critical', 'Critical'), color: '#ff5252', urgent: true };
  }

  function classifyHrv(val) {
    if (val == null || isNaN(val)) return { id: 'idle', label: '-', color: '#8aa89a' };
    if (val >= 50) return { id: 'good', label: t('wizard.vitals.hrv.good', 'Good variability'), color: '#ba68c8' };
    if (val >= 25) return { id: 'moderate', label: t('wizard.vitals.hrv.moderate', 'Moderate'), color: '#9575cd' };
    return { id: 'low', label: t('wizard.vitals.hrv.low', 'Low'), color: '#7986cb' };
  }

  function applyZone(widget, zone, pulseSec) {
    if (!widget) return;
    widget.setAttribute('data-vital-zone', zone.id);
    widget.setAttribute('data-vital-urgent', zone.urgent ? 'true' : 'false');
    widget.style.setProperty('--vital-color', zone.color);
    if (pulseSec != null) widget.style.setProperty('--vital-pulse-rate', pulseSec + 's');
  }

  function updateVitalBadge(badge, zone, idleLabel) {
    if (!badge) return;
    badge.classList.toggle('vital-zone-badge--urgent', !!(zone && zone.urgent));
    badge.textContent = zone && zone.id !== 'idle' ? zone.label : idleLabel;
  }

  function deriveVitalStatus(zoneId) {
    if (zoneId === 'normal' || zoneId === 'good') return 'improving';
    if (zoneId === 'idle' || zoneId === 'set' || zoneId === 'moderate') return 'stable';
    return 'declining';
  }

  function applyOasisVitalFeedback(widget, display, zone) {
    if (!global.OasisCanvas || !widget || !zone) return;
    global.OasisCanvas.applyMetricStatus(widget, deriveVitalStatus(zone.id));
    if (display) global.OasisCanvas.triggerCountFlip(display);
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

  function rebuildDrum(scrollEl, cfg) {
    if (!scrollEl) return;
    delete scrollEl.dataset.vitalDrumBuilt;
    buildDrum(scrollEl, cfg);
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

  function markDrumCenter(scrollEl, active, val, compare) {
    if (!scrollEl) return;
    scrollEl.querySelectorAll('.vital-drum-item').forEach(function (item) {
      var itemVal = parseFloat(item.getAttribute('data-value'));
      item.classList.toggle('vital-drum-item--center', active && compare(itemVal, val));
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

  function formatWeightDisplay(val, step) {
    return step === 0.5 ? Number(val).toFixed(1) : String(Math.round(val));
  }

  function glucoseFillRatio(active, val, range) {
    if (!active) return GLUCOSE_DROPLET.idlePuddle;
    return 0.08 + ratio(val, range.min, range.max) * 0.92;
  }

  function updateGlucoseDroplet(active, val, range, rising) {
    var fill = document.getElementById('glucoseDropletFill');
    var surface = document.getElementById('glucoseLiquidSurface');
    var widget = document.getElementById('glucoseWidget');
    var fillRatio = glucoseFillRatio(active, val, range);
    var innerH = GLUCOSE_DROPLET.bottom - GLUCOSE_DROPLET.top;
    var height = innerH * fillRatio;
    var top = GLUCOSE_DROPLET.bottom - height;
    if (fill) {
      fill.setAttribute('y', String(top));
      fill.setAttribute('height', String(height));
    }
    if (surface) {
      surface.setAttribute('transform', 'translate(' + GLUCOSE_DROPLET.left + ' ' + top + ')');
      surface.style.opacity = active && height > 2 ? '1' : '0';
    }
    if (widget && rising) {
      widget.classList.add('glucose-widget--filling');
      global.setTimeout(function () {
        widget.classList.remove('glucose-widget--filling');
      }, 620);
    }
  }

  function updateGlucose(markActive) {
    var widget = document.getElementById('glucoseWidget');
    var drum = document.getElementById('glucoseDrum');
    var display = document.getElementById('glucoseValueDisplay');
    var badge = document.getElementById('glucoseZoneBadge');
    if (!widget || !drum) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var range = glucoseRange();
    var val = drumValueAtCenter(drum);
    var prevVal = parseFloat(widget.dataset.glucosePrev || String(range.default));
    if (active) {
      val = clamp(val != null && !isNaN(val) ? val : range.default, range.min, range.max);
      setHidden('bloodGlucose', formatGlucose(val, range.unit), true);
    } else {
      setHidden('bloodGlucose', null, false);
    }
    var zone = classifyGlucose(active ? val : null, range.unit);
    applyZone(widget, zone, 1.4 - ratio(active ? val : range.default, range.min, range.max) * 0.5);
    if (display) {
      display.textContent = active ? formatGlucose(val, range.unit) : '-';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    updateVitalBadge(badge, active ? zone : null, t('wizard.vitals.glucose.hint', 'Slide to set glucose'));
    applyOasisVitalFeedback(widget, display, zone);
    updateGlucoseDroplet(active, val, range, active && markActive && val > prevVal + 0.001);
    widget.dataset.glucosePrev = String(active ? val : range.default);
    markDrumCenter(drum, active, val, function (itemVal, centerVal) {
      return Math.abs(itemVal - centerVal) < 0.0001;
    });
  }

  function syncGlucoseDrumRange(preserve) {
    var drum = document.getElementById('glucoseDrum');
    var hidden = document.getElementById('bloodGlucose');
    if (!drum) return;
    var range = glucoseRange();
    var prev = preserve && hidden && hidden.value ? parseFloat(hidden.value) : range.default;
    var value = clamp(isNaN(prev) ? range.default : prev, range.min, range.max);
    rebuildDrum(drum, glucoseDrumCfg());
    scrollDrumToValue(drum, value, false);
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
      display.textContent = active ? String(Math.round(val)) : '-';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    updateVitalBadge(badge, active ? zone : null, t('wizard.vitals.spo2.hint', 'Slide drum to set SpO₂'));
    applyOasisVitalFeedback(widget, display, zone);
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
    var drum = document.getElementById('hrvDrum');
    var display = document.getElementById('hrvValueDisplay');
    var badge = document.getElementById('hrvZoneBadge');
    if (!widget || !drum) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var val = drumValueAtCenter(drum);
    if (active) val = clamp(val != null && !isNaN(val) ? val : HRV.default, HRV.min, HRV.max);
    setHidden('hrv', active ? Math.round(val) : null, active);
    var zone = classifyHrv(active ? val : null);
    var waveRate = active ? Math.max(0.45, 1.8 - ratio(val, HRV.min, HRV.max) * 1.2) : 1.2;
    applyZone(widget, zone, waveRate);
    if (display) {
      display.textContent = active ? String(Math.round(val)) : '-';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active ? zone.label : t('wizard.vitals.hrv.hint', 'Slide to set HRV');
    applyOasisVitalFeedback(widget, display, zone);
    markDrumCenter(drum, active, Math.round(val), function (itemVal, centerVal) {
      return Math.round(itemVal) === centerVal;
    });
  }

  function updateBodyWeight(markActive) {
    var widget = document.getElementById('bodyWeightWidget');
    var drum = document.getElementById('bodyWeightDrum');
    var display = document.getElementById('bodyWeightValueDisplay');
    var badge = document.getElementById('bodyWeightZoneBadge');
    var beam = document.getElementById('bodyWeightBeam');
    if (!widget || !drum) return;
    if (markActive) widget.setAttribute('data-vital-active', 'true');
    var active = widget.getAttribute('data-vital-active') === 'true';
    var range = weightRange();
    var drumCfg = weightDrumCfg();
    var val = drumValueAtCenter(drum);
    if (active) val = clamp(val != null && !isNaN(val) ? val : range.default, range.min, range.max);
    var unit = settings().bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
    setHidden('bodyWeight', active ? Number(val).toFixed(1) : null, active);
    applyZone(widget, { id: active ? 'set' : 'idle', label: active ? unit : '-', color: '#a5d6a7' }, 1.1);
    if (display) {
      display.textContent = active ? formatWeightDisplay(val, drumCfg.step) : '-';
      if (markActive) display.classList.add('vital-readout--pulse');
      if (markActive) global.setTimeout(function () { display.classList.remove('vital-readout--pulse'); }, 280);
    }
    if (badge) badge.textContent = active ? unit : t('wizard.vitals.weight.hint', 'Slide to set weight');
    if (beam) {
      var tilt = (ratio(val, range.min, range.max) - 0.5) * 14;
      beam.style.transform = 'rotate(' + tilt.toFixed(2) + 'deg)';
    }
    markDrumCenter(drum, active, val, function (itemVal, centerVal) {
      return Math.abs(itemVal - centerVal) < 0.0001;
    });
    if (typeof global.updateBmiReadout === 'function') global.updateBmiReadout();
  }

  function syncBodyWeightDrumRange(preserve) {
    var drum = document.getElementById('bodyWeightDrum');
    var hidden = document.getElementById('bodyWeight');
    if (!drum) return;
    var range = weightRange();
    var prev = preserve && hidden && hidden.value ? parseFloat(hidden.value) : range.default;
    var value = clamp(isNaN(prev) ? range.default : prev, range.min, range.max);
    rebuildDrum(drum, weightDrumCfg());
    scrollDrumToValue(drum, value, false);
    var display = document.getElementById('bodyWeightUnitDisplay');
    if (display) display.textContent = settings().bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
    var suffix = document.getElementById('bodyWeightUnitSuffix');
    if (suffix) suffix.textContent = settings().bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
    updateBodyWeight(!!(hidden && hidden.value));
  }

  function nudge(kind, delta) {
    if (kind === 'glucose') {
      var glucoseDrum = document.getElementById('glucoseDrum');
      var gRange = glucoseRange();
      if (!glucoseDrum) return;
      var gCur = drumValueAtCenter(glucoseDrum);
      if (gCur == null || isNaN(gCur)) gCur = gRange.default;
      var gStep = gRange.step || 0.1;
      var gDelta = delta >= 0 ? gStep : -gStep;
      scrollDrumToValue(glucoseDrum, clamp(gCur + gDelta, gRange.min, gRange.max), true);
      updateGlucose(true);
      dispatchInput('bloodGlucose');
    } else if (kind === 'spo2') {
      var drum = document.getElementById('spo2Drum');
      var cur = drumValueAtCenter(drum) || SPO2.default;
      scrollDrumToValue(drum, clamp(cur + delta, SPO2.min, SPO2.max), true);
      updateSpO2(true);
      dispatchInput('spO2');
    } else if (kind === 'hrv') {
      var hrvDrum = document.getElementById('hrvDrum');
      if (!hrvDrum) return;
      var hrvCur = drumValueAtCenter(hrvDrum);
      if (hrvCur == null || isNaN(hrvCur)) hrvCur = HRV.default;
      scrollDrumToValue(hrvDrum, clamp(hrvCur + delta, HRV.min, HRV.max), true);
      updateHrv(true);
      dispatchInput('hrv');
    } else if (kind === 'bodyWeight') {
      var wDrum = document.getElementById('bodyWeightDrum');
      var wRange = weightRange();
      if (!wDrum) return;
      var wCur = drumValueAtCenter(wDrum);
      if (wCur == null || isNaN(wCur)) wCur = wRange.default;
      scrollDrumToValue(wDrum, clamp(wCur + delta, wRange.min, wRange.max), true);
      updateBodyWeight(true);
      dispatchInput('bodyWeight');
    }
  }

  function resetAdvancedVitals() {
    ['glucoseWidget', 'spo2Widget', 'hrvWidget', 'bodyWeightWidget'].forEach(function (id) {
      var w = document.getElementById(id);
      if (w) {
        w.setAttribute('data-vital-active', 'false');
        if (id === 'glucoseWidget') w.dataset.glucosePrev = '0';
      }
    });
    syncGlucoseDrumRange(false);
    scrollDrumToValue(document.getElementById('spo2Drum'), SPO2.default, false);
    scrollDrumToValue(document.getElementById('hrvDrum'), HRV.default, false);
    syncBodyWeightDrumRange(false);
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
      scrollDrumToValue(document.getElementById('glucoseDrum'), parseHidden('bloodGlucose'), false);
      updateGlucose(true);
    }
    if (parseHidden('spO2') != null) {
      scrollDrumToValue(document.getElementById('spo2Drum'), parseHidden('spO2'), false);
      updateSpO2(true);
    }
    if (parseHidden('hrv') != null) {
      scrollDrumToValue(document.getElementById('hrvDrum'), parseHidden('hrv'), false);
      updateHrv(true);
    }
    if (parseHidden('bodyWeight') != null) {
      scrollDrumToValue(document.getElementById('bodyWeightDrum'), parseHidden('bodyWeight'), false);
      updateBodyWeight(true);
    }
  }

  function setVitalValues(fieldId, value) {
    if (fieldId === 'bloodGlucose' && value != null) {
      scrollDrumToValue(document.getElementById('glucoseDrum'), value, false);
      updateGlucose(true);
    } else if (fieldId === 'spO2' && value != null) {
      scrollDrumToValue(document.getElementById('spo2Drum'), value, false);
      updateSpO2(true);
    } else if (fieldId === 'hrv' && value != null) {
      scrollDrumToValue(document.getElementById('hrvDrum'), value, false);
      updateHrv(true);
    } else if (fieldId === 'bodyWeight' && value != null) {
      scrollDrumToValue(document.getElementById('bodyWeightDrum'), value, false);
      updateBodyWeight(true);
    }
  }

  function initAdvancedVitalsWidgets() {
    var root = document.getElementById('vitalsAdvancedDetails');
    if (!root || root.dataset.vitalWidgetsInit === '1') return;
    root.dataset.vitalWidgetsInit = '1';

    syncGlucoseDrumRange(false);
    bindDrumScroll(document.getElementById('glucoseDrum'), function (commit) {
      updateGlucose(true);
      if (commit) dispatchInput('bloodGlucose');
    });

    buildDrum(document.getElementById('spo2Drum'), SPO2);
    scrollDrumToValue(document.getElementById('spo2Drum'), SPO2.default, false);
    bindDrumScroll(document.getElementById('spo2Drum'), function (commit) {
      updateSpO2(true);
      if (commit) dispatchInput('spO2');
    });

    buildDrum(document.getElementById('hrvDrum'), HRV);
    scrollDrumToValue(document.getElementById('hrvDrum'), HRV.default, false);
    bindDrumScroll(document.getElementById('hrvDrum'), function (commit) {
      updateHrv(true);
      if (commit) dispatchInput('hrv');
    });

    syncBodyWeightDrumRange(false);
    bindDrumScroll(document.getElementById('bodyWeightDrum'), function (commit) {
      updateBodyWeight(true);
      if (commit) dispatchInput('bodyWeight');
    });

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
    syncGlucoseUnit: syncGlucoseDrumRange,
    syncBodyWeightUnit: syncBodyWeightDrumRange,
  };
  global.initAdvancedVitalsWidgets = initAdvancedVitalsWidgets;
  global.resetAdvancedVitalsWidgets = resetAdvancedVitals;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedVitalsWidgets);
  } else {
    initAdvancedVitalsWidgets();
  }
})(typeof window !== 'undefined' ? window : globalThis);
