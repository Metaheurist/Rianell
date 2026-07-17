/**
 * Animated blood pressure + resting BPM input (dual drum pickers + heartbeat visual).
 */
(function (global) {
  'use strict';

  var SYS = { min: 60, max: 250, default: 120 };
  var BPM = { min: 30, max: 120, default: 72 };

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

  function classifyBp(sys) {
    if (sys == null || isNaN(sys)) return { id: 'idle', label: '-', color: '#8aa89a' };
    if (sys >= 180) {
      return { id: 'crisis', label: t('wizard.vitals.bp.zone.crisis', 'Crisis'), color: '#ff5252' };
    }
    if (sys >= 140) {
      return { id: 'high2', label: t('wizard.vitals.bp.zone.high2', 'High (stage 2)'), color: '#ff7043' };
    }
    if (sys >= 130) {
      return { id: 'high1', label: t('wizard.vitals.bp.zone.high1', 'High (stage 1)'), color: '#ffb74d' };
    }
    if (sys >= 120) {
      return { id: 'elevated', label: t('wizard.vitals.bp.zone.elevated', 'Elevated'), color: '#ffd54f' };
    }
    return { id: 'normal', label: t('wizard.vitals.bp.zone.normal', 'Normal'), color: '#7bdf8c' };
  }

  function pulseRateForZone(zoneId) {
    if (zoneId === 'crisis') return 0.55;
    if (zoneId === 'high2') return 0.72;
    if (zoneId === 'high1') return 0.88;
    if (zoneId === 'elevated') return 1.05;
    if (zoneId === 'normal') return 1.25;
    return 1.1;
  }

  function buildDrum(scrollEl, cfg) {
    if (!scrollEl || scrollEl.dataset.bpDrumBuilt === '1') return;
    scrollEl.dataset.bpDrumBuilt = '1';
    scrollEl.innerHTML = '';
    var spacer = document.createElement('div');
    spacer.className = 'bp-drum-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    scrollEl.appendChild(spacer);
    for (var v = cfg.min; v <= cfg.max; v++) {
      var item = document.createElement('div');
      item.className = 'bp-drum-item';
      item.setAttribute('data-value', String(v));
      item.setAttribute('role', 'option');
      item.textContent = String(v);
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
    var items = scrollEl.querySelectorAll('.bp-drum-item');
    var best = null;
    var bestDist = Infinity;
    items.forEach(function (item) {
      var ir = item.getBoundingClientRect();
      var dist = Math.abs(ir.top + ir.height / 2 - centerY);
      if (dist < bestDist) {
        bestDist = dist;
        best = parseInt(item.getAttribute('data-value'), 10);
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
    var item = scrollEl.querySelector('.bp-drum-item[data-value="' + value + '"]');
    if (!item) return;
    item.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  }

  function syncHiddenInputs(sys, bpm, active) {
    var sysEl = document.getElementById('bloodPressureSystolic');
    var bpmEl = document.getElementById('bpm');
    if (sysEl) sysEl.value = active && sys != null ? String(sys) : '';
    if (bpmEl) bpmEl.value = active && bpm != null ? String(bpm) : '';
  }

  function dispatchInputEvent() {
    ['bloodPressureSystolic', 'bpm'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    if (typeof global.scheduleLogDraftPersist === 'function') global.scheduleLogDraftPersist();
  }

  function updateBloodPressureWidget(markActive) {
    var widget = document.getElementById('bpDialWidget');
    var sysScroll = document.getElementById('bpSystolicDrum');
    var bpmScroll = document.getElementById('bpBpmDrum');
    var sysDisplay = document.getElementById('bpSysDisplay');
    var bpmDisplay = document.getElementById('bpBpmDisplay');
    var zoneBadge = document.getElementById('bpZoneBadge');
    var warnEl = document.getElementById('bpValidationHint');
    if (!widget || !sysScroll || !bpmScroll) return;

    if (markActive) widget.setAttribute('data-bp-active', 'true');

    var active = widget.getAttribute('data-bp-active') === 'true';
    var sys = drumValueAtCenter(sysScroll);
    var bpm = drumValueAtCenter(bpmScroll);

    if (active) {
      sys = clamp(sys != null ? sys : SYS.default, SYS.min, SYS.max);
      bpm = clamp(bpm != null ? bpm : BPM.default, BPM.min, BPM.max);
    }

    syncHiddenInputs(active ? sys : null, active ? bpm : null, active);

    if (sysDisplay) {
      sysDisplay.textContent = active && sys != null ? String(sys) : '-';
      if (markActive) {
        sysDisplay.classList.add('bp-dial-value--pulse');
        global.setTimeout(function () { sysDisplay.classList.remove('bp-dial-value--pulse'); }, 320);
      }
    }
    if (bpmDisplay) {
      bpmDisplay.textContent = active && bpm != null ? String(bpm) : '-';
      if (markActive) {
        bpmDisplay.classList.add('bp-dial-value--pulse');
        global.setTimeout(function () { bpmDisplay.classList.remove('bp-dial-value--pulse'); }, 320);
      }
    }

    var zone = classifyBp(active ? sys : null);
    widget.setAttribute('data-bp-zone', zone.id);
    widget.style.setProperty('--bp-zone-color', zone.color);
    widget.style.setProperty('--bp-pulse-rate', String(pulseRateForZone(zone.id)) + 's');

    if (zoneBadge) {
      zoneBadge.textContent = active ? zone.label : t('wizard.vitals.bp.slideHint', 'Slide drums to set blood pressure and heart rate');
      zoneBadge.style.color = zone.color;
    }

    if (warnEl) warnEl.hidden = true;

    sysScroll.querySelectorAll('.bp-drum-item').forEach(function (item) {
      item.classList.toggle('bp-drum-item--center', active && parseInt(item.getAttribute('data-value'), 10) === sys);
    });
    bpmScroll.querySelectorAll('.bp-drum-item').forEach(function (item) {
      item.classList.toggle('bp-drum-item--center', active && parseInt(item.getAttribute('data-value'), 10) === bpm);
    });
  }

  function resetBloodPressureWidget() {
    var widget = document.getElementById('bpDialWidget');
    var sysScroll = document.getElementById('bpSystolicDrum');
    var bpmScroll = document.getElementById('bpBpmDrum');
    if (widget) widget.setAttribute('data-bp-active', 'false');
    scrollDrumToValue(sysScroll, SYS.default, false);
    scrollDrumToValue(bpmScroll, BPM.default, false);
    syncHiddenInputs(null, null, false);
    updateBloodPressureWidget(false);
  }

  function setBloodPressureWidgetValues(sys, bpm, activate) {
    var widget = document.getElementById('bpDialWidget');
    var sysScroll = document.getElementById('bpSystolicDrum');
    var bpmScroll = document.getElementById('bpBpmDrum');
    if (!widget) return;
    if (activate !== false) widget.setAttribute('data-bp-active', 'true');
    if (sys != null && !isNaN(sys)) scrollDrumToValue(sysScroll, clamp(parseInt(sys, 10), SYS.min, SYS.max), false);
    if (bpm != null && !isNaN(bpm)) scrollDrumToValue(bpmScroll, clamp(parseInt(bpm, 10), BPM.min, BPM.max), false);
    updateBloodPressureWidget(false);
  }

  function nudgeDrum(kind, delta) {
    var scroll = document.getElementById(kind === 'sys' ? 'bpSystolicDrum' : 'bpBpmDrum');
    var cfg = kind === 'sys' ? SYS : BPM;
    if (!scroll) return;
    var cur = drumValueAtCenter(scroll);
    if (cur == null) cur = cfg.default;
    scrollDrumToValue(scroll, clamp(cur + delta, cfg.min, cfg.max), true);
    updateBloodPressureWidget(true);
    dispatchInputEvent();
  }

  function bindDrumScroll(scrollEl) {
    if (!scrollEl || scrollEl.dataset.bpBound === '1') return;
    scrollEl.dataset.bpBound = '1';
    if (global.RianellDrumPicker && typeof global.RianellDrumPicker.bind === 'function') {
      global.RianellDrumPicker.bind(scrollEl, {
        onScroll: function () { updateBloodPressureWidget(true); },
        onSnap: function () {
          updateBloodPressureWidget(true);
          dispatchInputEvent();
        },
      });
      return;
    }
    var ticking = false;
    var scrollEndTimer = null;
    scrollEl.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      global.requestAnimationFrame(function () {
        ticking = false;
        updateBloodPressureWidget(true);
      });
      if (scrollEndTimer) global.clearTimeout(scrollEndTimer);
      scrollEndTimer = global.setTimeout(function () {
        scrollEndTimer = null;
        updateBloodPressureWidget(true);
        dispatchInputEvent();
      }, 120);
    }, { passive: true });
    if ('onscrollend' in global) {
      scrollEl.addEventListener('scrollend', function () {
        if (scrollEndTimer) {
          global.clearTimeout(scrollEndTimer);
          scrollEndTimer = null;
        }
        updateBloodPressureWidget(true);
        dispatchInputEvent();
      });
    }
    scrollEl.addEventListener('click', function (e) {
      var item = e.target.closest('.bp-drum-item');
      if (!item) return;
      scrollDrumToValue(scrollEl, parseInt(item.getAttribute('data-value'), 10), true);
      updateBloodPressureWidget(true);
      dispatchInputEvent();
    });
  }

  function initBloodPressureWidget() {
    var widget = document.getElementById('bpDialWidget');
    if (!widget || widget.dataset.bpInit === '1') return;
    widget.dataset.bpInit = '1';

    var sysScroll = document.getElementById('bpSystolicDrum');
    var bpmScroll = document.getElementById('bpBpmDrum');
    buildDrum(sysScroll, SYS);
    buildDrum(bpmScroll, BPM);
    scrollDrumToValue(sysScroll, SYS.default, false);
    scrollDrumToValue(bpmScroll, BPM.default, false);
    bindDrumScroll(sysScroll);
    bindDrumScroll(bpmScroll);

    if (global.RianellHoldRepeat) {
      global.RianellHoldRepeat.bindAll(widget, '[data-bp-nudge]', function (btn) {
        nudgeDrum(btn.getAttribute('data-bp-nudge'), parseInt(btn.getAttribute('data-delta'), 10));
      });
    } else {
      widget.querySelectorAll('[data-bp-nudge]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          nudgeDrum(btn.getAttribute('data-bp-nudge'), parseInt(btn.getAttribute('data-delta'), 10));
        });
      });
    }

    var sysEl = document.getElementById('bloodPressureSystolic');
    var bpmEl = document.getElementById('bpm');
    if (sysEl && sysEl.value && bpmEl && bpmEl.value) {
      setBloodPressureWidgetValues(parseInt(sysEl.value, 10), parseInt(bpmEl.value, 10), true);
    } else {
      updateBloodPressureWidget(false);
    }
  }

  global.RianellBpInput = {
    init: initBloodPressureWidget,
    reset: resetBloodPressureWidget,
    setValues: setBloodPressureWidgetValues,
    update: updateBloodPressureWidget,
  };
  global.initBloodPressureWidget = initBloodPressureWidget;
  global.resetBloodPressureWidget = resetBloodPressureWidget;
  global.setBloodPressureWidgetValues = setBloodPressureWidgetValues;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBloodPressureWidget);
  } else {
    initBloodPressureWidget();
  }
})(typeof window !== 'undefined' ? window : globalThis);
