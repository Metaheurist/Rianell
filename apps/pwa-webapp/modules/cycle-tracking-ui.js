(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var PHASES = S.CYCLE_PHASES || [
    { id: 'menstrual', i18n: 'wizard.cycle.phase.menstrual', tone: 'menstrual', icon: 'cycle-menstrual' },
    { id: 'follicular', i18n: 'wizard.cycle.phase.follicular', tone: 'follicular', icon: 'cycle-follicular' },
    { id: 'ovulation', i18n: 'wizard.cycle.phase.ovulation', tone: 'ovulation', icon: 'cycle-ovulation' },
    { id: 'luteal', i18n: 'wizard.cycle.phase.luteal', tone: 'luteal', icon: 'cycle-luteal' },
  ];
  var PHASE_RANGES = S.CYCLE_PHASE_RANGES || [
    { id: 'menstrual', start: 1, end: 5, defaultDay: 1 },
    { id: 'follicular', start: 6, end: 13, defaultDay: 9 },
    { id: 'ovulation', start: 14, end: 16, defaultDay: 15 },
    { id: 'luteal', start: 17, end: S.CYCLE_DAY_MAX || 45, defaultDay: 22 },
  ];
  var FLOWS = S.CYCLE_FLOW_LEVELS || [
    { id: 'none', i18n: 'wizard.cycle.flow.none', drops: 0 },
    { id: 'light', i18n: 'wizard.cycle.flow.light', drops: 1 },
    { id: 'medium', i18n: 'wizard.cycle.flow.medium', drops: 2 },
    { id: 'heavy', i18n: 'wizard.cycle.flow.heavy', drops: 3 },
  ];
  var DAY_NORMAL_MAX = S.CYCLE_DAY_NORMAL_MAX || 35;
  var DAY_MAX = S.CYCLE_DAY_MAX || 45;
  var suggestPhase = S.suggestCyclePhaseForDay || function (day) {
    var n = parseInt(day, 10);
    if (!Number.isFinite(n) || n < 1) return '';
    if (n <= 5) return 'menstrual';
    if (n <= 13) return 'follicular';
    if (n <= 16) return 'ovulation';
    return 'luteal';
  };
  var defaultDayForPhase = S.defaultCycleDayForPhase || function (phaseId) {
    var row = PHASE_RANGES.find(function (r) { return r.id === phaseId; });
    return row ? row.defaultDay : undefined;
  };
  var isCycleDayLate = S.isCycleDayLate || function (day) {
    var n = parseInt(day, 10);
    return Number.isFinite(n) && n > DAY_NORMAL_MAX;
  };
  var daysSincePeriodStart = S.daysSincePeriodStart || null;
  var suggestForDate = S.suggestCycleForDate || null;

  var phaseManual = false;
  var built = false;
  var scrollBound = false;
  var suggestionAppliedForDate = '';
  var autoFilled = false;
  var lastPeriodStartDate = '';

  function t(key, params) {
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      var v = global.RianellI18n.t(key, params);
      if (v && v !== key) return v;
    }
    if (typeof global.tUi === 'function') {
      var ui = global.tUi(key, params);
      if (ui && ui !== key) return ui;
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
    var periodStartEl = hidden('logCyclePeriodStartFlag');
    return {
      day: dayEl ? dayEl.value : '',
      phase: phaseEl ? phaseEl.value : '',
      flow: flowEl ? flowEl.value : '',
      periodStart: periodStartEl ? periodStartEl.value === '1' : false,
    };
  }

  function setPeriodStartHidden(on) {
    var periodStartEl = hidden('logCyclePeriodStartFlag');
    if (periodStartEl) periodStartEl.value = on ? '1' : '';
  }

  function setHidden(day, phase, flow, periodStart) {
    var dayEl = hidden('logCycleDay');
    var phaseEl = hidden('logCyclePhase');
    var flowEl = hidden('logCycleFlow');
    if (dayEl) dayEl.value = day != null && day !== '' ? String(day) : '';
    if (phaseEl) phaseEl.value = phase || '';
    if (flowEl) flowEl.value = flow || '';
    if (periodStart !== undefined) setPeriodStartHidden(!!periodStart);
  }

  function phaseMeta(phaseId) {
    return PHASES.find(function (p) { return p.id === phaseId; }) || null;
  }

  function phaseSvg(name, className) {
    var safe = String(name || '').replace(/[^a-z0-9-]/gi, '');
    var cls = className || 'cycle-phase-icon-svg ui-svg-icon';
    return '<svg class="' + cls + '" aria-hidden="true"><use href="#icon-' + safe + '"></use></svg>';
  }

  function dayInPhaseRange(dayNum, phaseId) {
    var row = PHASE_RANGES.find(function (r) { return r.id === phaseId; });
    if (!row || !Number.isFinite(dayNum)) return false;
    return dayNum >= row.start && dayNum <= row.end;
  }

  function updateReadout() {
    var readout = document.getElementById('logCycleDayReadout');
    if (!readout) return;
    var vals = syncHidden();
    if (!vals.day) {
      readout.textContent = '';
      return;
    }
    var dayNum = parseInt(vals.day, 10);
    var hint = t('wizard.cycle.dayHint', { day: vals.day });
    if (vals.phase) {
      var meta = phaseMeta(vals.phase);
      if (meta) {
        hint += ' · ' + t('wizard.cycle.suggestedPhase', { phase: t(meta.i18n) });
      }
    }
    if (lastPeriodStartDate && typeof daysSincePeriodStart === 'function') {
      var since = daysSincePeriodStart(lastPeriodStartDate, getWizardDateIso());
      if (since != null && since >= 0) {
        hint += ' · ' + t('wizard.cycle.daysSincePeriod', { days: String(since) });
      }
    }
    if (isCycleDayLate(dayNum)) {
      hint += ' · ' + t('wizard.cycle.lateHint');
    }
    readout.textContent = hint;
  }

  function getWizardDateIso() {
    var dateEl = document.getElementById('logDate');
    if (dateEl && dateEl.value) return dateEl.value;
    if (typeof global.getLocalDateString === 'function') return global.getLocalDateString();
    return '';
  }

  function refreshLabels() {
    document.querySelectorAll('#logCycleBlock [data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('#logCycleTimelineInner .cycle-phase-label[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    var suggestEl = document.getElementById('logCycleSuggestHint');
    if (suggestEl && suggestEl.dataset.suggestKey) {
      var params = {
        day: suggestEl.dataset.suggestDay || '',
        phase: suggestEl.dataset.suggestPhaseLabel || '',
        date: suggestEl.dataset.suggestDate || '',
      };
      suggestEl.textContent = t(suggestEl.dataset.suggestKey, params);
    }
    updateReadout();
  }

  function scrollActiveDayIntoView() {
    var scroll = document.getElementById('logCycleTimelineScroll');
    var active = scroll && scroll.querySelector('.cycle-timeline-day--active');
    if (!active) return;
    try {
      active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    } catch (e) {
      active.scrollIntoView(true);
    }
  }

  function refreshActiveStates() {
    var vals = syncHidden();
    var dayNum = parseInt(vals.day, 10);
    var activePhase = vals.phase || (Number.isFinite(dayNum) ? suggestPhase(dayNum) : '');

    var periodBtn = document.getElementById('logCyclePeriodStartBtn');
    if (periodBtn) {
      periodBtn.classList.toggle('cycle-period-start-btn--active', vals.periodStart && vals.day === '1');
    }

    var timeline = document.getElementById('logCycleTimelineInner');
    if (timeline) {
      timeline.querySelectorAll('.cycle-timeline-band').forEach(function (band) {
        var phaseId = band.getAttribute('data-phase');
        band.classList.toggle('cycle-timeline-band--active', phaseId === activePhase);
        var head = band.querySelector('.cycle-timeline-band-head');
        if (head) head.setAttribute('aria-pressed', phaseId === vals.phase ? 'true' : 'false');
      });
      timeline.querySelectorAll('.cycle-timeline-day').forEach(function (btn) {
        var day = btn.getAttribute('data-day');
        var active = day === vals.day;
        btn.classList.toggle('cycle-timeline-day--active', active);
        btn.classList.toggle('cycle-timeline-day--late', isCycleDayLate(parseInt(day, 10)));
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      scrollActiveDayIntoView();
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
    var nextPeriodStart = vals.periodStart;
    if (nextDay && nextDay !== '1') nextPeriodStart = false;
    if (nextDay && !phaseManual) {
      nextPhase = suggestPhase(nextDay) || '';
    }
    if (!nextDay) {
      phaseManual = false;
      nextPeriodStart = false;
      nextPhase = '';
    }
    setHidden(nextDay, nextPhase, vals.flow, nextPeriodStart);
    refreshActiveStates();
  }

  function markPeriodStartedToday() {
    autoFilled = false;
    phaseManual = false;
    lastPeriodStartDate = getWizardDateIso();
    setHidden('1', 'menstrual', syncHidden().flow, true);
    refreshActiveStates();
  }

  function selectPhase(phaseId) {
    autoFilled = false;
    var vals = syncHidden();
    var nextPhase = vals.phase === phaseId ? '' : phaseId;
    var nextDay = vals.day;
    phaseManual = !!nextPhase;
    if (nextPhase) {
      var dayNum = parseInt(vals.day, 10);
      if (!Number.isFinite(dayNum) || !dayInPhaseRange(dayNum, nextPhase)) {
        var fallback = defaultDayForPhase(nextPhase);
        if (fallback != null) nextDay = String(fallback);
      }
      if (nextDay !== '1') {
        setPeriodStartHidden(false);
      }
    } else {
      nextDay = '';
      phaseManual = false;
    }
    setHidden(nextDay, nextPhase, vals.flow, nextPhase && nextDay === '1' ? vals.periodStart : false);
    refreshActiveStates();
  }

  function selectFlow(flowId) {
    autoFilled = false;
    var vals = syncHidden();
    var next = vals.flow === flowId ? '' : flowId;
    setHidden(vals.day, vals.phase, next, vals.periodStart);
    refreshActiveStates();
  }

  function clearCycleTracking() {
    phaseManual = false;
    autoFilled = false;
    suggestionAppliedForDate = '';
    lastPeriodStartDate = '';
    setHidden('', '', '', false);
    var suggestEl = document.getElementById('logCycleSuggestHint');
    if (suggestEl) {
      suggestEl.textContent = '';
      suggestEl.hidden = true;
      delete suggestEl.dataset.suggestKey;
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
      el.classList.add('cycle-timeline-scroll--dragging');
    });
    global.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('cycle-timeline-scroll--dragging');
    });
    global.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.pageX - startX);
    });
  }

  function buildTimeline() {
    var inner = document.getElementById('logCycleTimelineInner');
    if (!inner || inner.childElementCount) return;

    PHASE_RANGES.forEach(function (range) {
      var meta = phaseMeta(range.id);
      if (!meta) return;

      var band = document.createElement('div');
      band.className = 'cycle-timeline-band cycle-timeline-band--' + meta.tone;
      band.setAttribute('data-phase', range.id);

      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'cycle-timeline-band-head cycle-timeline-band-head--' + meta.tone;
      head.setAttribute('data-phase', range.id);
      head.setAttribute('aria-pressed', 'false');
      head.setAttribute('aria-label', t(meta.i18n) + ', ' + t('wizard.cycle.day') + ' ' + range.start + '–' + range.end);

      var iconWrap = document.createElement('span');
      iconWrap.className = 'cycle-phase-icon';
      iconWrap.innerHTML = phaseSvg(meta.icon || 'cycle-menstrual');
      head.appendChild(iconWrap);

      var label = document.createElement('span');
      label.className = 'cycle-phase-label';
      label.setAttribute('data-i18n', meta.i18n);
      label.textContent = t(meta.i18n);
      head.appendChild(label);

      var span = document.createElement('span');
      span.className = 'cycle-timeline-band-range';
      span.textContent = range.start + '–' + range.end;
      head.appendChild(span);

      head.addEventListener('click', function () {
        selectPhase(range.id);
      });
      band.appendChild(head);

      var daysWrap = document.createElement('div');
      daysWrap.className = 'cycle-timeline-days';
      for (var d = range.start; d <= range.end; d += 1) {
        var dayBtn = document.createElement('button');
        dayBtn.type = 'button';
        dayBtn.className = 'cycle-timeline-day cycle-timeline-day--' + meta.tone;
        dayBtn.setAttribute('data-day', String(d));
        dayBtn.setAttribute('aria-pressed', 'false');
        dayBtn.setAttribute('aria-label', t('wizard.cycle.day') + ' ' + d + ', ' + t(meta.i18n));
        dayBtn.textContent = String(d);
        dayBtn.addEventListener('click', function () {
          selectDay(parseInt(this.getAttribute('data-day'), 10));
        });
        daysWrap.appendChild(dayBtn);
      }
      band.appendChild(daysWrap);
      inner.appendChild(band);
    });

    var scroll = document.getElementById('logCycleTimelineScroll');
    initHorizontalScroll(scroll);
  }

  function buildUi() {
    if (built) {
      refreshLabels();
      return;
    }
    built = true;

    var periodBtn = document.getElementById('logCyclePeriodStartBtn');
    if (periodBtn && !periodBtn.dataset.bound) {
      periodBtn.dataset.bound = '1';
      periodBtn.addEventListener('click', markPeriodStartedToday);
    }

    buildTimeline();

    var flowRow = document.getElementById('logCycleFlowRow');
    if (flowRow && !flowRow.childElementCount) {
      FLOWS.forEach(function (flow) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cycle-flow-btn';
        btn.setAttribute('data-flow', flow.id);
        btn.setAttribute('aria-pressed', 'false');
        btn.appendChild(buildFlowDrops(flow.drops));
        var flowLabel = document.createElement('span');
        flowLabel.className = 'cycle-flow-label';
        flowLabel.setAttribute('data-i18n', flow.i18n);
        flowLabel.textContent = t(flow.i18n);
        btn.appendChild(flowLabel);
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
      setHidden('', '', '', false);
      vals = syncHidden();
      autoFilled = false;
      suggestionAppliedForDate = '';
      var suggestElReset = document.getElementById('logCycleSuggestHint');
      if (suggestElReset) {
        suggestElReset.textContent = '';
        suggestElReset.hidden = true;
        delete suggestElReset.dataset.suggestKey;
      }
    }
    if (vals.day || vals.phase || vals.flow) return;
    if (suggestionAppliedForDate === targetDateIso) return;
    var suggestion = suggestForDate(logs, targetDateIso);
    if (!suggestion || !suggestion.cycleDay) return;
    phaseManual = false;
    autoFilled = true;
    lastPeriodStartDate = suggestion.periodStartDate || suggestion.fromDate || '';
    setHidden(String(suggestion.cycleDay), suggestion.phase || suggestPhase(suggestion.cycleDay) || '', '', false);
    suggestionAppliedForDate = targetDateIso;
    var suggestEl = document.getElementById('logCycleSuggestHint');
    if (suggestEl) {
      var pMeta = PHASES.find(function (p) { return p.id === suggestion.phase; });
      var phaseLabel = pMeta ? t(pMeta.i18n) : '';
      if (suggestion.periodStartDate) {
        suggestEl.dataset.suggestKey = 'wizard.cycle.autoFromPeriodStart';
        suggestEl.dataset.suggestDate = suggestion.periodStartDate;
        suggestEl.textContent = t('wizard.cycle.autoFromPeriodStart', { date: suggestion.periodStartDate });
      } else {
        suggestEl.dataset.suggestKey = 'wizard.cycle.suggestedFromLast';
        suggestEl.dataset.suggestDay = String(suggestion.cycleDay);
        suggestEl.dataset.suggestPhaseLabel = phaseLabel;
        suggestEl.textContent = t('wizard.cycle.suggestedFromLast', { day: suggestion.cycleDay, phase: phaseLabel });
      }
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
