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
    var phaseId = safe.replace(/^cycle-/, '');
    var hrefId = ['menstrual', 'follicular', 'ovulation', 'luteal'].indexOf(phaseId) >= 0
      ? 'cycle-' + phaseId
      : safe;
    var cls = className || 'cycle-phase-icon-svg ui-svg-icon cycle-phase-emblem';
    return '<svg class="' + cls + '" aria-hidden="true"><use href="#icon-' + hrefId + '"></use></svg>';
  }

  function dayInPhaseRange(dayNum, phaseId) {
    var row = PHASE_RANGES.find(function (r) { return r.id === phaseId; });
    if (!row || !Number.isFinite(dayNum)) return false;
    return dayNum >= row.start && dayNum <= row.end;
  }

  function isMenstrualDayNum(dayNum) {
    return Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 5;
  }

  function flowMeta(flowId) {
    return FLOWS.find(function (f) { return f.id === flowId; }) || null;
  }

  function updateReadout() {
    var readout = document.getElementById('logCycleDayReadout');
    if (!readout) return;
    var vals = syncHidden();
    if (!vals.day) {
      readout.textContent = t('wizard.cycle.lead');
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
    if (vals.flow) {
      var fMeta = flowMeta(vals.flow);
      if (fMeta) hint += ' · ' + t('wizard.cycle.flow') + ': ' + t(fMeta.i18n);
    } else if (isMenstrualDayNum(dayNum)) {
      var tapHint = t('wizard.cycle.tapFlowHint');
      if (!tapHint || tapHint === 'wizard.cycle.tapFlowHint') tapHint = 'tap droplets on your day';
      hint += ' · ' + tapHint;
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

  function refreshFlowOpts() {
    document.querySelectorAll('#logCycleTimelineInner .cycle-day-node__flow-opt').forEach(function (btn) {
      var flowId = btn.getAttribute('data-flow');
      var fMeta = flowMeta(flowId);
      var legacyKey = btn.getAttribute('data-i18n');
      if (legacyKey) {
        btn.removeAttribute('data-i18n');
        if (!btn.getAttribute('data-i18n-aria')) btn.setAttribute('data-i18n-aria', legacyKey);
      }
      var key = btn.getAttribute('data-i18n-aria');
      if (key) btn.setAttribute('aria-label', t(key));
      if (!fMeta) return;
      if (!btn.querySelector('.cycle-flow-drops')) {
        btn.textContent = '';
        btn.appendChild(buildFlowDrops(fMeta.drops, true));
      }
    });
  }

  function refreshLabels() {
    document.querySelectorAll('#logCycleBlock [data-i18n]:not(.cycle-day-node__flow-opt)').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('#logCycleTimelineInner .cycle-ribbon-marker-label[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    refreshFlowOpts();
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
    var active = scroll && scroll.querySelector('.cycle-day-node--active');
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

    var ribbon = document.getElementById('logCycleTimelineInner');
    if (ribbon) {
      ribbon.querySelectorAll('.cycle-ribbon-phase').forEach(function (seg) {
        var phaseId = seg.getAttribute('data-phase');
        seg.classList.toggle('cycle-ribbon-phase--active', phaseId === activePhase);
      });
      ribbon.querySelectorAll('.cycle-ribbon-marker').forEach(function (head) {
        var phaseId = head.getAttribute('data-phase');
        head.setAttribute('aria-pressed', phaseId === vals.phase ? 'true' : 'false');
      });
      ribbon.querySelectorAll('.cycle-day-node').forEach(function (node) {
        var day = node.getAttribute('data-day');
        var dNum = parseInt(day, 10);
        var active = day === vals.day;
        var menstrual = isMenstrualDayNum(dNum);
        node.classList.toggle('cycle-day-node--active', active);
        node.classList.toggle('cycle-day-node--expanded', active && menstrual);
        node.classList.toggle('cycle-day-node--late', isCycleDayLate(dNum));
        node.setAttribute('aria-pressed', active ? 'true' : 'false');
        var flowPreview = node.querySelector('.cycle-day-node__flow-preview');
        if (flowPreview) {
          var showPreview = menstrual && vals.flow && active;
          flowPreview.hidden = !showPreview;
          if (showPreview) {
            flowPreview.querySelectorAll('.cycle-flow-drop').forEach(function (drop, idx) {
              var fMeta = flowMeta(vals.flow);
              drop.classList.toggle('cycle-flow-drop--on', fMeta ? idx < fMeta.drops : false);
            });
          }
        }
        node.querySelectorAll('.cycle-day-node__flow-opt').forEach(function (btn) {
          var on = active && btn.getAttribute('data-flow') === vals.flow;
          btn.classList.toggle('cycle-day-node__flow-opt--active', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      scrollActiveDayIntoView();
      if (global.RianellGraphicsPortfolio && typeof global.RianellGraphicsPortfolio.decorateCycleBeacon === 'function') {
        global.RianellGraphicsPortfolio.decorateCycleBeacon();
      }
    }
    updateReadout();
  }

  function selectDay(day) {
    autoFilled = false;
    var vals = syncHidden();
    var nextDay = vals.day === String(day) ? '' : String(day);
    var nextPhase = vals.phase;
    var nextPeriodStart = vals.periodStart;
    var nextFlow = vals.flow;
    if (nextDay && nextDay !== '1') nextPeriodStart = false;
    if (nextDay && !phaseManual) {
      nextPhase = suggestPhase(nextDay) || '';
    }
    if (!nextDay) {
      phaseManual = false;
      nextPeriodStart = false;
      nextPhase = '';
      nextFlow = '';
    } else if (!isMenstrualDayNum(parseInt(nextDay, 10))) {
      nextFlow = '';
    }
    setHidden(nextDay, nextPhase, nextFlow, nextPeriodStart);
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

  function buildFlowDrops(count, mini) {
    var wrap = document.createElement('span');
    wrap.className = mini ? 'cycle-flow-drops cycle-flow-drops--mini' : 'cycle-flow-drops';
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

    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add('cycle-ribbon-scroll--dragging');
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('cycle-ribbon-scroll--dragging');
      if (el.releasePointerCapture) {
        try { el.releasePointerCapture(e.pointerId); } catch (_err) { /* noop */ }
      }
    });
    el.addEventListener('pointercancel', function () {
      dragging = false;
      el.classList.remove('cycle-ribbon-scroll--dragging');
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.pageX - startX);
    });
  }

  function createDayNode(dayNum, meta) {
    var node = document.createElement('button');
    node.type = 'button';
    node.className = 'cycle-day-node cycle-day-node--' + meta.tone;
    node.setAttribute('data-day', String(dayNum));
    node.setAttribute('aria-pressed', 'false');
    node.setAttribute('aria-label', t('wizard.cycle.day') + ' ' + dayNum + ', ' + t(meta.i18n));

    var num = document.createElement('span');
    num.className = 'cycle-day-node__num';
    num.textContent = String(dayNum);
    node.appendChild(num);

    var iconWrap = document.createElement('span');
    iconWrap.className = 'cycle-day-node__phase-icon';
    iconWrap.innerHTML = phaseSvg(meta.icon, 'cycle-day-node__phase-svg ui-svg-icon');
    iconWrap.setAttribute('aria-hidden', 'true');
    node.appendChild(iconWrap);

    if (isMenstrualDayNum(dayNum)) {
      var preview = document.createElement('span');
      preview.className = 'cycle-day-node__flow-preview';
      preview.hidden = true;
      preview.appendChild(buildFlowDrops(0, true));
      node.appendChild(preview);

      var dock = document.createElement('div');
      dock.className = 'cycle-day-node__flow';
      dock.setAttribute('role', 'group');
      dock.setAttribute('aria-label', t('wizard.cycle.flow'));
      FLOWS.forEach(function (flow) {
        var opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'cycle-day-node__flow-opt';
        opt.setAttribute('data-flow', flow.id);
        opt.setAttribute('data-i18n-aria', flow.i18n);
        opt.setAttribute('aria-label', t(flow.i18n));
        opt.setAttribute('aria-pressed', 'false');
        opt.appendChild(buildFlowDrops(flow.drops, true));
        opt.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          var vals = syncHidden();
          if (vals.day !== String(dayNum)) {
            autoFilled = false;
            var nextPhase = phaseManual ? vals.phase : (suggestPhase(dayNum) || 'menstrual');
            setHidden(String(dayNum), nextPhase, vals.flow, dayNum === 1 ? vals.periodStart : false);
          }
          selectFlow(flow.id);
        });
        dock.appendChild(opt);
      });
      node.appendChild(dock);
    }

    node.addEventListener('click', function () {
      selectDay(dayNum);
    });
    return node;
  }

  function buildTimeline() {
    var inner = document.getElementById('logCycleTimelineInner');
    if (!inner || inner.childElementCount) return;

    var ribbon = document.createElement('div');
    ribbon.className = 'cycle-ribbon';

    PHASE_RANGES.forEach(function (range, phaseIdx) {
      var meta = phaseMeta(range.id);
      if (!meta) return;

      var seg = document.createElement('div');
      seg.className = 'cycle-ribbon-phase cycle-ribbon-phase--' + meta.tone;
      seg.setAttribute('data-phase', range.id);
      seg.style.setProperty('--phase-i', String(phaseIdx));

      var marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'cycle-ribbon-marker cycle-ribbon-marker--' + meta.tone;
      marker.setAttribute('data-phase', range.id);
      marker.setAttribute('aria-pressed', 'false');
      marker.setAttribute('aria-label', t(meta.i18n) + ', ' + t('wizard.cycle.day') + ' ' + range.start + '-' + range.end);

      var markerIcon = document.createElement('span');
      markerIcon.className = 'cycle-ribbon-marker-icon';
      markerIcon.innerHTML = phaseSvg(meta.icon || 'cycle-menstrual');
      marker.appendChild(markerIcon);

      var markerLabel = document.createElement('span');
      markerLabel.className = 'cycle-ribbon-marker-label';
      markerLabel.setAttribute('data-i18n', meta.i18n);
      markerLabel.textContent = t(meta.i18n);
      marker.appendChild(markerLabel);

      var markerRange = document.createElement('span');
      markerRange.className = 'cycle-ribbon-marker-range';
      markerRange.textContent = range.start + '-' + range.end;
      marker.appendChild(markerRange);

      marker.addEventListener('click', function () {
        selectPhase(range.id);
      });
      seg.appendChild(marker);

      var daysWrap = document.createElement('div');
      daysWrap.className = 'cycle-ribbon-days';
      for (var d = range.start; d <= range.end; d += 1) {
        daysWrap.appendChild(createDayNode(d, meta));
      }
      seg.appendChild(daysWrap);
      ribbon.appendChild(seg);
    });

    inner.appendChild(ribbon);

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
