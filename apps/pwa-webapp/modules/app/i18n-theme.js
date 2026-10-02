/**
 * UI translation lookups (tUi/tContent), locale/date formatting, theme colours and ApexCharts theming.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

/** True when legacy web UI uses light appearance (`body.light-mode`). */
function isWebAppLightMode() {
  try {
    return document.body && document.body.classList.contains('light-mode');
  } catch (e) {
    return false;
  }
}

/** Line/column ApexCharts: axis, grid, legend, tooltip. */
function getApexLineChartTheme() {
  var light = isWebAppLightMode();
  var highContrast =
    typeof window !== 'undefined' &&
    window.appSettings &&
    window.appSettings.accessibility &&
    window.appSettings.accessibility.chartPaletteMode === 'high-contrast';
  if (highContrast) {
    return {
      mode: light ? 'light' : 'dark',
      tooltipTheme: light ? 'light' : 'dark',
      text: light ? '#000000' : '#ffffff',
      gridBorder: light ? '#333333' : '#cccccc',
      legendColor: light ? '#000000' : '#ffffff',
      crosshair: light ? '#444444' : '#dddddd',
      tooltipDescription: light ? '#222222' : '#eeeeee',
    };
  }
  return {
    mode: light ? 'light' : 'dark',
    tooltipTheme: light ? 'light' : 'dark',
    text: light ? getThemeInkColor('#151515') : '#e0f2f1',
    gridBorder: light ? getThemeAccentSoft('#81c784') : '#374151',
    legendColor: light ? getThemeInkColor('#151515') : '#e0f2f1',
    crosshair: light ? '#546e7a' : '#b0bec5',
    tooltipDescription: light ? getThemeInkColor('#4a6358') : '#b0bec5'
  };
}

/** Read active theme ink from CSS tokens (updates when globalTheme / light-mode changes). */
function getThemeInkColor(fallback) {
  try {
    if (typeof document !== 'undefined') {
      var el = document.body || document.documentElement;
      var v = getComputedStyle(el).getPropertyValue('--text-dark').trim();
      if (v) return v;
      v = getComputedStyle(el).getPropertyValue('--light-ink').trim();
      if (v) return v;
    }
  } catch (e) {}
  return fallback || '#1b5e20';
}

/** Read active theme accent from CSS tokens (updates when globalTheme changes). */
function getThemePrimaryColor(fallback) {
  try {
    if (typeof document !== 'undefined') {
      var el = document.body || document.documentElement;
      var v = getComputedStyle(el).getPropertyValue('--primary-color').trim();
      if (v) return v;
    }
  } catch (e) {}
  return fallback || '#7bdf8c';
}

function getThemeAccentSoft(fallback) {
  try {
    if (typeof document !== 'undefined') {
      var el = document.body || document.documentElement;
      var v = getComputedStyle(el).getPropertyValue('--accent-soft').trim();
      if (v) return v;
    }
  } catch (e) {}
  return getThemePrimaryColor(fallback);
}

function themePrimaryRgba(alpha) {
  var hex = getThemePrimaryColor('#7bdf8c').replace('#', '');
  if (hex.length !== 6) return 'rgba(123, 223, 140, ' + alpha + ')';
  var r = parseInt(hex.slice(0, 2), 16);
  var g = parseInt(hex.slice(2, 4), 16);
  var b = parseInt(hex.slice(4, 6), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

/** Convert rgb/rgba/hex chart color to rgba with given alpha. */
function colorToRgba(input, alpha) {
  if (!input) return themePrimaryRgba(alpha);
  if (input.indexOf('rgba(') === 0) {
    var rgbaParts = input.replace(/rgba?\(|\)|\s/g, '').split(',');
    if (rgbaParts.length >= 3) return 'rgba(' + rgbaParts[0] + ', ' + rgbaParts[1] + ', ' + rgbaParts[2] + ', ' + alpha + ')';
  }
  if (input.indexOf('rgb(') === 0) {
    var rgbParts = input.replace(/rgb\(|\)|\s/g, '').split(',');
    if (rgbParts.length >= 3) return 'rgba(' + rgbParts[0] + ', ' + rgbParts[1] + ', ' + rgbParts[2] + ', ' + alpha + ')';
  }
  if (input.indexOf('#') === 0) {
    var hex = input.replace('#', '');
    if (hex.length === 6) {
      return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ', ' + parseInt(hex.slice(2, 4), 16) + ', ' + parseInt(hex.slice(4, 6), 16) + ', ' + alpha + ')';
    }
  }
  return themePrimaryRgba(alpha);
}

/** UI string from active locale catalog (PWA i18n). */
function tUi(key, params) {
  if (typeof window !== 'undefined' && window.RianellI18n && typeof window.RianellI18n.t === 'function') {
    return window.RianellI18n.t(key, params);
  }
  return key;
}

/** tUi with English fallback when the catalog is not loaded yet. */
function tUiOr(key, fallback, params) {
  var val = tUi(key, params);
  return val && val !== key ? val : fallback;
}

/** Content catalog label (food, exercise, stressor, etc.) with English fallback. */
function tContent(prefix, id, fallback) {
  var slug = String(id).replace(/[^a-zA-Z0-9_]/g, '_');
  var key = 'content.' + prefix + '.' + slug;
  var val = tUi(key);
  if (val !== key) return val;
  return fallback != null ? fallback : String(id);
}

/** Localized device benchmark per-test label (also used by device-benchmark.js). */
function benchmarkTestLabel(test) {
  var id = test && test.id ? String(test.id) : '';
  var key = 'benchmark.tests.' + id.replace(/-/g, '_');
  var val = tUi(key);
  if (val !== key) return val;
  return test && test.label ? test.label : id;
}

function getActiveUiLocale() {
  if (typeof window !== 'undefined' && window.RianellI18n && typeof window.RianellI18n.getLocale === 'function') {
    return window.RianellI18n.getLocale();
  }
  return 'en-GB';
}

function formatUiDate(value, opts) {
  var locale = getActiveUiLocale();
  var S = typeof window !== 'undefined' ? window.RianellShared : null;
  if (S && typeof S.formatDate === 'function') return S.formatDate(value, locale, opts || {});
  var d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(locale, opts || { month: 'short', day: 'numeric' });
}

function applyApexLineChartThemeToOptions(options) {
  var t = getApexLineChartTheme();
  if (!options) return;
  if (!options.theme) options.theme = {};
  options.theme.mode = t.mode;
  function paintYaxis(ya) {
    if (!ya) return;
    if (ya.title && ya.title.style) ya.title.style.color = t.text;
    if (ya.labels && ya.labels.style) ya.labels.style.colors = t.text;
  }
  if (options.title && options.title.style) options.title.style.color = t.text;
  if (options.xaxis) {
    if (options.xaxis.title && options.xaxis.title.style) options.xaxis.title.style.color = t.text;
    if (options.xaxis.labels && options.xaxis.labels.style) options.xaxis.labels.style.colors = t.text;
  }
  if (options.yaxis) {
    if (Array.isArray(options.yaxis)) options.yaxis.forEach(paintYaxis);
    else paintYaxis(options.yaxis);
  }
  if (options.grid) options.grid.borderColor = t.gridBorder;
  if (options.legend && options.legend.labels) options.legend.labels.colors = t.legendColor;
  if (options.tooltip) options.tooltip.theme = t.tooltipTheme;
  if (options.crosshairs && options.crosshairs.stroke) options.crosshairs.stroke.color = t.crosshair;
}

/** Radar ApexCharts: polygons, axis numbers, legend. */
function getApexRadarChartTheme() {
  var light = isWebAppLightMode();
  return {
    mode: light ? 'light' : 'dark',
    tooltipTheme: light ? 'light' : 'dark',
    axisLabel: light ? getThemeInkColor('#151515') : '#e0f2f1',
    legendColor: light ? getThemeInkColor('#151515') : '#e0f2f1',
    polygonStroke: light ? getThemeAccentSoft('#81c784') : '#374151',
    polygonFill: light ? themePrimaryRgba(0.14) : 'rgba(55, 65, 81, 0.1)'
  };
}

function applyApexRadarChartThemeToOptions(options) {
  var t = getApexRadarChartTheme();
  if (!options) return;
  if (!options.theme) options.theme = {};
  options.theme.mode = t.mode;
  if (options.tooltip) options.tooltip.theme = t.tooltipTheme;
  if (options.yaxis && options.yaxis.labels && options.yaxis.labels.style) {
    options.yaxis.labels.style.colors = t.axisLabel;
  }
  if (options.xaxis) {
    if (!options.xaxis.labels) options.xaxis.labels = {};
    if (!options.xaxis.labels.style) options.xaxis.labels.style = {};
    options.xaxis.labels.style.colors = t.axisLabel;
  }
  if (options.legend && options.legend.labels) {
    options.legend.labels.colors = t.legendColor;
  }
  if (options.plotOptions && options.plotOptions.radar && options.plotOptions.radar.polygons) {
    var poly = options.plotOptions.radar.polygons;
    poly.strokeColors = t.polygonStroke;
    if (poly.fill && poly.fill.colors) {
      poly.fill.colors = [t.polygonFill];
    }
  }
}

export { isWebAppLightMode, getApexLineChartTheme, getThemePrimaryColor, getThemeAccentSoft, themePrimaryRgba, colorToRgba, tUi, tUiOr, tContent, benchmarkTestLabel, getActiveUiLocale, formatUiDate, applyApexLineChartThemeToOptions, applyApexRadarChartThemeToOptions };
