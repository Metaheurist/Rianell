/**
 * Animated blood pressure input (systolic / diastolic drum pickers + heartbeat visual).
 */
(function (global) {
  'use strict';

  var SYS = { min: 60, max: 250, default: 120 };
  var DIA = { min: 40, max: 150, default: 80 };

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

  function classifyBp(sys, dia) {
    if (sys == null || dia == null || isNaN(sys) || isNaN(dia)) return { id: 'idle', label: '—', color: '#8aa89a' };
    if (sys >= 180 || dia >= 120) {
      return { id: 'crisis', label: t('wizard.vitals.bp.zone.crisis', 'Crisis'), color: '#ff5252' };
    }
    if (sys >= 140 || dia >= 90) {
      return { id: 'high2', label: t('wizard.vitals.bp.zone.high2', 'High (stage 2)'), color: '#ff7043' };
    }
    if (sys >= 130 || dia >= 80) {
      return { id: 'high1', label: t('wizard.vitals.bp.zone.high1', 'High (stage 1)'), color: '#ffb74d' };
    }
    if (sys >= 120 && dia < 80) {
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
    if (!scrollEl) return;
    var item = scrollEl.querySelector('.bp-drum-item[data-value="' + value + '"]');
    if (!item) return;
    item.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  }

  function syncHiddenInputs(sys, dia, active) {
    var sysEl = document.getElementById('bloodPressureSystolic');
    var diaEl = document.getElementById('bloodPressureDiastolic');
    if (sysEl) sysEl.value = active && sys != null ? String(sys) : '';
    if (diaEl) diaEl.value = active && dia != null ? String(dia) : '';
  }

  function dispatchInputEvent() {
    ['bloodPressureSystolic', 'bloodPressureDiastolic'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    if (typeof global.scheduleLogDraftPersist === 'function') global.scheduleLogDraftPersist();
  }

  function updateBloodPressureWidget(markActive) {
    var widget = document.getElementById('bpDialWidget');
    var sysScroll = document.getElementById('bpSystolicDrum');
    var diaScroll = document.getElementById('bpDiastolicDrum');
    var sysDisplay = document.getElementById('bpSysDisplay');
    var diaDisplay = document.getElementById('bpDiaDisplay');
    var zoneBadge = document.getElementById('bpZoneBadge');
    var warnEl = document.getElementById('bpValidationHint');
    if (!widget || !sysScroll || !diaScroll) return;

    if (markActive) widget.setAttribute('data-bp-active', 'true');

    var active = widget.getAttribute('data-bp-active') === 'true';
    var sys = drumValueAtCenter(sysScroll);
    var dia = drumValueAtCenter(diaScroll);

    if (active) {
      sys = clamp(sys != null ? sys : SYS.default, SYS.min, SYS.max);
      dia = clamp(dia != null ? dia : DIA.default, DIA.min, DIA.max);
    }

    syncHiddenInputs(active ? sys : null, active ? dia : null, active);

    if (sysDisplay) {
      sysDisplay.textContent = active && sys != null ? String(sys) : '—';
      if (markActive) {
        sysDisplay.classList.add('bp-dial-value--pulse');
        global.setTimeout(function () { sysDisplay.classList.remove('bp-dial-value--pulse'); }, 320);
      }
    }
    if (diaDisplay) {
      diaDisplay.textContent = active && dia != null ? String(dia) : '—';
      if (markActive) {
        diaDisplay.classList.add('bp-dial-value--pulse');
        global.setTimeout(function () { diaDisplay.classList.remove('bp-dial-value--pulse'); }, 320);
      }
    }

    var zone = classifyBp(active ? sys : null, active ? dia : null);
    widget.setAttribute('data-bp-zone', zone.id);
    widget.style.setProperty('--bp-zone-color', zone.color);
    widget.style.setProperty('--bp-pulse-rate', String(pulseRateForZone(zone.id)) + 's');

    if (zoneBadge) {
      zoneBadge.textContent = active ? zone.label : t('wizard.vitals.bp.slideHint', 'Slide drums to set');
      zoneBadge.style.color = zone.color;
    }

    if (warnEl) {
      var invalid = active && sys != null && dia != null && dia >= sys;
      warnEl.hidden = !invalid;
      if (invalid) {
        warnEl.textContent = t('wizard.vitals.bp.invalid', 'Diastolic should be lower than systolic.');
      }
    }

    sysScroll.querySelectorAll('.bp-drum-item').forEach(function (item) {
      item.classList.toggle('bp-drum-item--center', active && parseInt(item.getAttribute('data-value'), 10) === sys);
    });
    diaScroll.querySelectorAll('.bp-drum-item').forEach(function (item) {
      item.classList.toggle('bp-drum-item--center', active && parseInt(item.getAttribute('data-value'), 10) === dia);
    });
  }

  function resetBloodPressureWidget() {
    var widget = document.getElementById('bpDialWidget');
    var sysScroll = document.getElementById('bpSystolicDrum');
    var diaScroll = document.getElementById('bpDiastolicDrum');
    if (widget) widget.setAttribute('data-bp-active', 'false');
    scrollDrumToValue(sysScroll, SYS.default, false);
    scrollDrumToValue(diaScroll, DIA.default, false);
    syncHiddenInputs(null, null, false);
    updateBloodPressureWidget(false);
  }

  function setBloodPressureWidgetValues(sys, dia, activate) {
    var widget = document.getElementById('bpDialWidget');
    var sysScroll = document.getElementById('bpSystolicDrum');
    var diaScroll = document.getElementById('bpDiastolicDrum');
    if (!widget) return;
    if (activate !== false) widget.setAttribute('data-bp-active', 'true');
    if (sys != null && !isNaN(sys)) scrollDrumToValue(sysScroll, clamp(parseInt(sys, 10), SYS.min, SYS.max), false);
    if (dia != null && !isNaN(dia)) scrollDrumToValue(diaScroll, clamp(parseInt(dia, 10), DIA.min, DIA.max), false);
    updateBloodPressureWidget(false);
  }

  function nudgeDrum(kind, delta) {
    var scroll = document.getElementById(kind === 'sys' ? 'bpSystolicDrum' : 'bpDiastolicDrum');
    var cfg = kind === 'sys' ? SYS : DIA;
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
    var diaScroll = document.getElementById('bpDiastolicDrum');
    buildDrum(sysScroll, SYS);
    buildDrum(diaScroll, DIA);
    scrollDrumToValue(sysScroll, SYS.default, false);
    scrollDrumToValue(diaScroll, DIA.default, false);
    bindDrumScroll(sysScroll);
    bindDrumScroll(diaScroll);

    widget.querySelectorAll('[data-bp-nudge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        nudgeDrum(btn.getAttribute('data-bp-nudge'), parseInt(btn.getAttribute('data-delta'), 10));
      });
    });

    var sysEl = document.getElementById('bloodPressureSystolic');
    var diaEl = document.getElementById('bloodPressureDiastolic');
    if (sysEl && sysEl.value && diaEl && diaEl.value) {
      setBloodPressureWidgetValues(parseInt(sysEl.value, 10), parseInt(diaEl.value, 10), true);
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
