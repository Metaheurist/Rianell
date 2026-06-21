(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var PHASES = S.CYCLE_PHASES || [
    { id: 'menstrual', i18n: 'wizard.cycle.phase.menstrual', tone: 'menstrual', icon: 'cycle-menstrual' },
    { id: 'follicular', i18n: 'wizard.cycle.phase.follicular', tone: 'follicular', icon: 'cycle-follicular' },
    { id: 'ovulation', i18n: 'wizard.cycle.phase.ovulation', tone: 'ovulation', icon: 'cycle-ovulation' },
    { id: 'luteal', i18n: 'wizard.cycle.phase.luteal', tone: 'luteal', icon: 'cycle-luteal' },
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
  var suggestForDate = S.suggestCycleForDate || null;

  var phaseManual = false;
  var built = false;
  var scrollBound = false;
  var suggestionAppliedForDate = '';
  var autoFilled = false;

  function t(key, params) {
    if (typeof global.tUi === 'function') {
      var ui = global.tUi(key, params);
      if (ui && ui !== key) return ui;
    }
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      var v = global.RianellI18n.t(key, params);
      if (v && v !== key) return v;
    }
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

  function phaseSvg(name, className) {
    var safe = String(name || '').replace(/[^a-z0-9-]/gi, '');
    var cls = className || 'cycle-phase-icon-svg ui-svg-icon';
    return '<svg class="' + cls + '" aria-hidden="true"><use href="#icon-' + safe + '"></use></svg>';
  }

  function updateReadout() {
    var readout = document.getElementById('logCycleDayReadout');
    if (!readout) return;
    var vals = syncHidden();
    if (!vals.day) {
      readout.textContent = '';
      return;
    }
    var hint = t('wizard.cycle.dayHint', { day: vals.day });
    if (vals.phase && !phaseManual) {
      var phaseMeta = PHASES.find(function (p) { return p.id === vals.phase; });
      if (phaseMeta) {
        hint += ' · ' + t('wizard.cycle.suggestedPhase', { phase: t(phaseMeta.i18n) });
      }
    }
    readout.textContent = hint;
  }

  function refreshLabels() {
    document.querySelectorAll('#logCyclePhaseGrid [data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('#logCycleFlowRow [data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    var suggestEl = document.getElementById('logCycleSuggestHint');
    if (suggestEl && suggestEl.dataset.suggestKey) {
      suggestEl.textContent = t(suggestEl.dataset.suggestKey, {
        day: suggestEl.dataset.suggestDay || '',
        phase: suggestEl.dataset.suggestPhaseLabel || '',
      });
    }
    updateReadout();
  }

  function refreshActiveStates() {
    var vals = syncHidden();
    var dayScroll = document.getElementById('logCycleDayScroll');
    if (dayScroll) {
      dayScroll.querySelectorAll('.cycle-day-pill').forEach(function (btn) {
        var active = btn.getAttribute('data-day') === vals.day;
        btn.classList.toggle('cycle-day-pill--active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (active) {
          try {
            btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
          } catch (e) {
            btn.scrollIntoView(true);
          }
        }
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
    autoFilled = false;
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
    autoFilled = false;
    var vals = syncHidden();
    var next = vals.phase === phaseId ? '' : phaseId;
    phaseManual = !!next;
    setHidden(vals.day, next, vals.flow);
    refreshActiveStates();
  }

  function selectFlow(flowId) {
    autoFilled = false;
    var vals = syncHidden();
    var next = vals.flow === flowId ? '' : flowId;
    setHidden(vals.day, vals.phase, next);
    refreshActiveStates();
  }

  function clearCycleTracking() {
    phaseManual = false;
    autoFilled = false;
    suggestionAppliedForDate = '';
    setHidden('', '', '');
    var suggestEl = document.getElementById('logCycleSuggestHint');
    if (suggestEl) {
      suggestEl.textContent = '';
      suggestEl.hidden = true;
    }
    refreshActiveStates();
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

  function initHorizontalScroll(el) {
    if (!el || scrollBound) return;
    scrollBound = true;
    var dragging = false;
    var startX = 0;
    var startScroll = 0;

    el.addEventListener(
      'wheel',
      function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      },
      { passive: false },
    );

    el.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add('cycle-day-scroll--dragging');
    });
    global.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('cycle-day-scroll--dragging');
    });
    global.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.pageX - startX);
    });
  }

  function buildUi() {
    if (built) {
      refreshLabels();
      return;
    }
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
      initHorizontalScroll(dayScroll);
    }

    var phaseGrid = document.getElementById('logCyclePhaseGrid');
    if (phaseGrid && !phaseGrid.childElementCount) {
      PHASES.forEach(function (phase) {
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'cycle-phase-tile cycle-phase-tile--' + phase.tone;
        tile.setAttribute('data-phase', phase.id);
        tile.setAttribute('aria-pressed', 'false');
        var iconWrap = document.createElement('span');
        iconWrap.className = 'cycle-phase-icon';
        iconWrap.innerHTML = phaseSvg(phase.icon || 'cycle-menstrual');
        tile.appendChild(iconWrap);
        var label = document.createElement('span');
        label.className = 'cycle-phase-label';
        label.setAttribute('data-i18n', phase.i18n);
        label.textContent = t(phase.i18n);
        tile.appendChild(label);
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
        label.setAttribute('data-i18n', flow.i18n);
        label.textContent = t(flow.i18n);
        btn.appendChild(label);
        btn.addEventListener('click', function () {
          selectFlow(flow.id);
        });
        flowRow.appendChild(btn);
      });
    }

    var clearBtn = document.getElementById('logCycleClear');
    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = '1';
      clearBtn.addEventListener('click', clearCycleTracking);
    }

    if (!global.__rianellCycleLocaleHook && global.RianellI18n && typeof global.RianellI18n.onLocaleChange === 'function') {
      global.RianellI18n.onLocaleChange(function () {
        refreshLabels();
        refreshActiveStates();
      });
      global.__rianellCycleLocaleHook = true;
    }

    refreshLabels();
    refreshActiveStates();
  }

  function applySuggestionFromLogs(logs, targetDateIso) {
    if (!suggestForDate || typeof targetDateIso !== 'string' || !targetDateIso) return;
    var vals = syncHidden();
    if (targetDateIso !== suggestionAppliedForDate && autoFilled && !phaseManual) {
      setHidden('', '', '');
      vals = syncHidden();
      autoFilled = false;
      suggestionAppliedForDate = '';
      var suggestElReset = document.getElementById('logCycleSuggestHint');
      if (suggestElReset) {
        suggestElReset.textContent = '';
        suggestElReset.hidden = true;
      }
    }
    if (vals.day || vals.phase || vals.flow) return;
    if (suggestionAppliedForDate === targetDateIso) return;
    var suggestion = suggestForDate(logs, targetDateIso);
    if (!suggestion || !suggestion.cycleDay) return;
    phaseManual = false;
    autoFilled = true;
    setHidden(String(suggestion.cycleDay), suggestion.phase || suggestPhase(suggestion.cycleDay) || '', '');
    suggestionAppliedForDate = targetDateIso;
    var suggestEl = document.getElementById('logCycleSuggestHint');
    if (suggestEl) {
      var phaseMeta = PHASES.find(function (p) { return p.id === suggestion.phase; });
      var phaseLabel = phaseMeta ? t(phaseMeta.i18n) : '';
      suggestEl.dataset.suggestKey = 'wizard.cycle.suggestedFromLast';
      suggestEl.dataset.suggestDay = String(suggestion.cycleDay);
      suggestEl.dataset.suggestPhaseLabel = phaseLabel;
      suggestEl.textContent = t('wizard.cycle.suggestedFromLast', { day: suggestion.cycleDay, phase: phaseLabel });
      suggestEl.hidden = false;
    }
    refreshActiveStates();
  }

  function bindCycleTrackingUi() {
    buildUi();
    refreshLabels();
    refreshActiveStates();
  }

  global.RianellCycleTracking = {
    bind: bindCycleTrackingUi,
    clear: clearCycleTracking,
    refresh: refreshActiveStates,
    refreshLabels: refreshLabels,
    applySuggestionFromLogs: applySuggestionFromLogs,
  };
})(typeof window !== 'undefined' ? window : globalThis);
