(function (global) {
  'use strict';

  var S = global.RianellShared || {};
  var buildSuggestions = S.buildVitalSuggestions || null;
  var FIELD_IDS = S.VITAL_SUGGESTION_FIELD_IDS || [
    'bloodPressure', 'bloodGlucose', 'spO2', 'hrv', 'bodyWeight',
  ];

  var FIELD_UI = {
    bloodPressure: {
      inputs: ['bloodPressureSystolic', 'bpm'],
      insertAfter: '#bpStep .bp-dial-widget',
    },
    bloodGlucose: { inputs: ['bloodGlucose'], insertAfter: '#glucoseWidget' },
    spO2: { inputs: ['spO2'], insertAfter: '#spo2Widget' },
    hrv: { inputs: ['hrv'], insertAfter: '#hrvWidget' },
    bodyWeight: { inputs: ['bodyWeight'], insertAfter: '#bodyWeightWidget' },
  };

  var latestSuggestions = {};

  function t(key, params) {
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      return global.RianellI18n.t(key, params || {});
    }
    return key;
  }

  function formatSuggestDate(iso) {
    if (global.RianellI18n && typeof global.RianellI18n.formatDate === 'function') {
      try {
        return global.RianellI18n.formatDate(iso, { dateStyle: 'medium' });
      } catch (e) { /* fall through */ }
    }
    return iso;
  }

  function unitPrefs() {
    var settings = global.appSettings || {};
    return {
      weightUnit: settings.weightUnit === 'lb' ? 'lb' : 'kg',
      glucoseUnit: settings.glucoseUnit === 'mgdl' ? 'mgdl' : 'mmol',
      bodyWeightUnit: settings.bodyWeightUnit === 'lbs' ? 'lbs' : 'kg',
    };
  }

  function readInput(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function isFieldEmpty(fieldId) {
    var cfg = FIELD_UI[fieldId];
    if (!cfg) return true;
    return cfg.inputs.every(function (id) { return !readInput(id); });
  }

  function ensureHintButton(fieldId) {
    var cfg = FIELD_UI[fieldId];
    if (!cfg) return null;
    var hintId = 'vitalsLastValue_' + fieldId;
    var existing = document.getElementById(hintId);
    if (existing) return existing;

    var anchor = document.querySelector(cfg.insertAfter);
    if (!anchor) return null;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = hintId;
    btn.className = 'vitals-last-value-hint';
    btn.dataset.fieldId = fieldId;
    btn.hidden = true;
    btn.addEventListener('click', function () {
      applySuggestion(fieldId);
    });

    var parent = anchor.closest('.input-container') || anchor.parentElement;
    if (cfg.insertAfter.indexOf('.vitals-inline-row') >= 0 && parent) {
      parent.insertBefore(btn, anchor.nextSibling);
    } else if (parent) {
      parent.appendChild(btn);
    } else {
      anchor.insertAdjacentElement('afterend', btn);
    }
    return btn;
  }

  function applySuggestion(fieldId) {
    var row = latestSuggestions[fieldId];
    if (!row || !row.values) return;
    var vals = row.values;
    if (fieldId === 'bloodPressure') {
      var sysEl = document.getElementById('bloodPressureSystolic');
      var bpmEl = document.getElementById('bpm');
      if (sysEl) sysEl.value = String(vals.bloodPressureSystolic);
      if (bpmEl && vals.bpm != null) bpmEl.value = String(vals.bpm);
      if (global.RianellBpInput && typeof global.RianellBpInput.setValues === 'function') {
        global.RianellBpInput.setValues(vals.bloodPressureSystolic, vals.bpm, true);
      }
    } else if (fieldId === 'bloodGlucose' && vals.bloodGlucose != null) {
      var glucoseEl = document.getElementById('bloodGlucose');
      if (glucoseEl) glucoseEl.value = String(vals.bloodGlucose);
      if (global.RianellAdvancedVitals && typeof global.RianellAdvancedVitals.setVitalValues === 'function') {
        global.RianellAdvancedVitals.setVitalValues('bloodGlucose', vals.bloodGlucose);
      }
    } else if (fieldId === 'spO2' && vals.spO2 != null) {
      var spEl = document.getElementById('spO2');
      if (spEl) spEl.value = String(vals.spO2);
      if (global.RianellAdvancedVitals && typeof global.RianellAdvancedVitals.setVitalValues === 'function') {
        global.RianellAdvancedVitals.setVitalValues('spO2', vals.spO2);
      }
    } else if (fieldId === 'hrv' && vals.hrv != null) {
      var hrvEl = document.getElementById('hrv');
      if (hrvEl) hrvEl.value = String(vals.hrv);
      if (global.RianellAdvancedVitals && typeof global.RianellAdvancedVitals.setVitalValues === 'function') {
        global.RianellAdvancedVitals.setVitalValues('hrv', vals.hrv);
      }
    } else if (fieldId === 'bodyWeight' && vals.bodyWeight != null) {
      var bwEl = document.getElementById('bodyWeight');
      if (bwEl) bwEl.value = String(vals.bodyWeight);
      if (global.RianellAdvancedVitals && typeof global.RianellAdvancedVitals.setVitalValues === 'function') {
        global.RianellAdvancedVitals.setVitalValues('bodyWeight', vals.bodyWeight);
      }
    }
    refresh([], document.getElementById('date') ? document.getElementById('date').value : '');
    if (typeof global.updateBmiReadout === 'function') global.updateBmiReadout();
    if (typeof global.scheduleLogDraftPersist === 'function') global.scheduleLogDraftPersist();
  }

  function renderHintContent(btn, row) {
    var value = row.displayValue;
    var dateStr = formatSuggestDate(row.fromDate);
    var action = t('wizard.vitals.useLastValue.action');
    btn.setAttribute(
      'aria-label',
      t('wizard.vitals.useLastValue.aria', { value: value, date: dateStr }),
    );
    btn.innerHTML =
      '<span class="vitals-last-value-hint__icon" aria-hidden="true">' +
      '<svg class="ui-svg-icon" aria-hidden="true"><use href="#icon-import-arrow"></use></svg></span>' +
      '<span class="vitals-last-value-hint__copy">' +
      '<span class="vitals-last-value-hint__value"></span>' +
      '<span class="vitals-last-value-hint__date"></span>' +
      '</span>' +
      '<span class="vitals-last-value-hint__action"></span>';
    btn.querySelector('.vitals-last-value-hint__value').textContent = value;
    btn.querySelector('.vitals-last-value-hint__date').textContent = dateStr;
    btn.querySelector('.vitals-last-value-hint__action').textContent = action;
  }

  function refresh(logs, targetDateIso) {
    if (typeof buildSuggestions !== 'function') return;
    latestSuggestions = buildSuggestions(logs || [], targetDateIso || '', {
      unitPrefs: unitPrefs(),
    }) || {};

    FIELD_IDS.forEach(function (fieldId) {
      var btn = ensureHintButton(fieldId);
      if (!btn) return;
      var row = latestSuggestions[fieldId];
      if (!row || !isFieldEmpty(fieldId)) {
        btn.hidden = true;
        btn.textContent = '';
        btn.innerHTML = '';
        return;
      }
      renderHintContent(btn, row);
      btn.hidden = false;
    });
  }

  function bindInputListeners() {
    var ids = ['bpm', 'bloodPressureSystolic', 'bloodGlucose', 'spO2', 'hrv', 'bodyWeight'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.vitalsSuggestBound) return;
      el.dataset.vitalsSuggestBound = '1';
      el.addEventListener('input', function () {
        var dateEl = document.getElementById('date');
        var logList = typeof global.logs !== 'undefined' && Array.isArray(global.logs) ? global.logs : [];
        refresh(logList, dateEl && dateEl.value ? dateEl.value : '');
      });
    });
  }

  function bind() {
    bindInputListeners();
    FIELD_IDS.forEach(function (fieldId) { ensureHintButton(fieldId); });
    if (global.RianellI18n && typeof global.RianellI18n.onLocaleChange === 'function' && !global.__rianellVitalsLocaleHook) {
      global.RianellI18n.onLocaleChange(function () {
        var dateEl = document.getElementById('date');
        var logList = typeof global.logs !== 'undefined' && Array.isArray(global.logs) ? global.logs : [];
        refresh(logList, dateEl && dateEl.value ? dateEl.value : '');
      });
      global.__rianellVitalsLocaleHook = true;
    }
  }

  global.RianellVitalsSuggest = {
    bind: bind,
    refresh: refresh,
  };
})(typeof window !== 'undefined' ? window : globalThis);
