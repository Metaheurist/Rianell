(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var PHASES = S.CYCLE_PHASES || [
    { id: 'menstrual', i18n: 'wizard.cycle.phase.menstrual', tone: 'menstrual' },
    { id: 'follicular', i18n: 'wizard.cycle.phase.follicular', tone: 'follicular' },
    { id: 'ovulation', i18n: 'wizard.cycle.phase.ovulation', tone: 'ovulation' },
    { id: 'luteal', i18n: 'wizard.cycle.phase.luteal', tone: 'luteal' },
  ];
  var FLOWS = S.CYCLE_FLOW_LEVELS || [
    { id: 'none', i18n: 'wizard.cycle.flow.none', drops: 0 },
    { id: 'light', i18n: 'wizard.cycle.flow.light', drops: 1 },
    { id: 'medium', i18n: 'wizard.cycle.flow.medium', drops: 2 },
    { id: 'heavy', i18n: 'wizard.cycle.flow.heavy', drops: 3 },
  ];
  var DAY_MAX = S.CYCLE_DAY_MAX || 45;
  var suggestPhase = S.suggestCyclePhaseForDay || function (day) {
    var n = parseInt(day, 10);
    if (!Number.isFinite(n) || n < 1) return '';
    if (n <= 5) return 'menstrual';
    if (n <= 13) return 'follicular';
    if (n <= 16) return 'ovulation';
    return 'luteal';
  };

  var phaseManual = false;
  var built = false;

  function t(key, params) {
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      return global.RianellI18n.t(key, params);
    }
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return key;
  }

  function hidden(id) {
    return document.getElementById(id);
  }

  function syncHidden() {
    var dayEl = hidden('logCycleDay');
    var phaseEl = hidden('logCyclePhase');
    var flowEl = hidden('logCycleFlow');
    return {
      day: dayEl ? dayEl.value : '',
      phase: phaseEl ? phaseEl.value : '',
      flow: flowEl ? flowEl.value : '',
    };
  }

  function setHidden(day, phase, flow) {
    var dayEl = hidden('logCycleDay');
    var phaseEl = hidden('logCyclePhase');
    var flowEl = hidden('logCycleFlow');
    if (dayEl) dayEl.value = day != null && day !== '' ? String(day) : '';
    if (phaseEl) phaseEl.value = phase || '';
    if (flowEl) flowEl.value = flow || '';
  }

  function updateReadout() {
    var readout = document.getElementById('logCycleDayReadout');
    if (!readout) return;
    var vals = syncHidden();
    if (!vals.day) {
      readout.textContent = '';
      return;
    }
    readout.textContent = t('wizard.cycle.dayHint', { day: vals.day });
  }

  function refreshActiveStates() {
    var vals = syncHidden();
    var dayScroll = document.getElementById('logCycleDayScroll');
    if (dayScroll) {
      dayScroll.querySelectorAll('.cycle-day-pill').forEach(function (btn) {
        var active = btn.getAttribute('data-day') === vals.day;
        btn.classList.toggle('cycle-day-pill--active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    var phaseGrid = document.getElementById('logCyclePhaseGrid');
    if (phaseGrid) {
      phaseGrid.querySelectorAll('.cycle-phase-tile').forEach(function (btn) {
        var active = btn.getAttribute('data-phase') === vals.phase;
        btn.classList.toggle('cycle-phase-tile--active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    var flowRow = document.getElementById('logCycleFlowRow');
    if (flowRow) {
      flowRow.querySelectorAll('.cycle-flow-btn').forEach(function (btn) {
        var active = btn.getAttribute('data-flow') === vals.flow;
        btn.classList.toggle('cycle-flow-btn--active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    updateReadout();
  }

  function selectDay(day) {
    var vals = syncHidden();
    var nextDay = vals.day === String(day) ? '' : String(day);
    var nextPhase = vals.phase;
    if (nextDay && !phaseManual) {
      nextPhase = suggestPhase(nextDay) || '';
    }
    if (!nextDay) phaseManual = false;
    setHidden(nextDay, nextPhase, vals.flow);
    refreshActiveStates();
  }

  function selectPhase(phaseId) {
    var vals = syncHidden();
    var next = vals.phase === phaseId ? '' : phaseId;
    phaseManual = !!next;
    setHidden(vals.day, next, vals.flow);
    refreshActiveStates();
  }

  function selectFlow(flowId) {
    var vals = syncHidden();
    var next = vals.flow === flowId ? '' : flowId;
    setHidden(vals.day, vals.phase, next);
    refreshActiveStates();
  }

  function clearCycleTracking() {
    phaseManual = false;
    setHidden('', '', '');
    refreshActiveStates();
  }

  function phaseIcon(id) {
    if (id === 'menstrual') return '\u{1FA78}';
    if (id === 'follicular') return '\u{1F331}';
    if (id === 'ovulation') return '\u2728';
    if (id === 'luteal') return '\u{1F319}';
    return '\u2022';
  }

  function buildFlowDrops(count) {
    var wrap = document.createElement('span');
    wrap.className = 'cycle-flow-drops';
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i += 1) {
      var drop = document.createElement('span');
      drop.className = 'cycle-flow-drop' + (i < count ? ' cycle-flow-drop--on' : '');
      wrap.appendChild(drop);
    }
    return wrap;
  }

  function buildUi() {
    if (built) return;
    built = true;

    var dayScroll = document.getElementById('logCycleDayScroll');
    if (dayScroll && !dayScroll.childElementCount) {
      for (var d = 1; d <= DAY_MAX; d += 1) {
        var tone = suggestPhase(d) || 'unknown';
        var pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'cycle-day-pill cycle-day-pill--' + tone;
        pill.setAttribute('data-day', String(d));
        pill.setAttribute('aria-pressed', 'false');
        pill.setAttribute('aria-label', t('wizard.cycle.day') + ' ' + d);
        pill.textContent = String(d);
        pill.addEventListener('click', function () {
          selectDay(parseInt(this.getAttribute('data-day'), 10));
        });
        dayScroll.appendChild(pill);
      }
    }

    var phaseGrid = document.getElementById('logCyclePhaseGrid');
    if (phaseGrid && !phaseGrid.childElementCount) {
      PHASES.forEach(function (phase) {
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'cycle-phase-tile cycle-phase-tile--' + phase.tone;
        tile.setAttribute('data-phase', phase.id);
        tile.setAttribute('aria-pressed', 'false');
        tile.innerHTML =
          '<span class="cycle-phase-icon" aria-hidden="true">' + phaseIcon(phase.id) + '</span>' +
          '<span class="cycle-phase-label">' + t(phase.i18n) + '</span>';
        tile.addEventListener('click', function () {
          selectPhase(phase.id);
        });
        phaseGrid.appendChild(tile);
      });
    }

    var flowRow = document.getElementById('logCycleFlowRow');
    if (flowRow && !flowRow.childElementCount) {
      FLOWS.forEach(function (flow) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cycle-flow-btn';
        btn.setAttribute('data-flow', flow.id);
        btn.setAttribute('aria-pressed', 'false');
        btn.appendChild(buildFlowDrops(flow.drops));
        var label = document.createElement('span');
        label.className = 'cycle-flow-label';
        label.textContent = t(flow.i18n);
        btn.appendChild(label);
        btn.addEventListener('click', function () {
          selectFlow(flow.id);
        });
        flowRow.appendChild(btn);
      });
    }

    var clearBtn = document.getElementById('logCycleClear');
    if (clearBtn) clearBtn.addEventListener('click', clearCycleTracking);

    refreshActiveStates();
  }

  function bindCycleTrackingUi() {
    buildUi();
    refreshActiveStates();
  }

  global.RianellCycleTracking = {
    bind: bindCycleTrackingUi,
    clear: clearCycleTracking,
    refresh: refreshActiveStates,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCycleTrackingUi);
  } else {
    bindCycleTrackingUi();
  }
})(typeof window !== 'undefined' ? window : globalThis);
