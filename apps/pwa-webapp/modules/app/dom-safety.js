/**
 * DOM safety helpers: HTML escaping and sanitising, SVG icons, modal focus trap, user notifications and toggle-switch a11y.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

// ============================================
// Security: HTML Sanitization Utility
// ============================================
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function svgIcon(name, className, title) {
  var KNOWN_SVG_ICONS = new Set([
    'accessibility', 'activity', 'android', 'anxious-face', 'apple', 'balance', 'bandage', 'brain', 'brain-wave', 'bundle',
    'calendar', 'calendar-heatmap', 'chart-bars', 'chart-down', 'chart-up', 'check', 'checkin-am', 'checkin-midday',
    'checkin-pm', 'chevron-left', 'chevron-right', 'close', 'backspace', 'cloud', 'cloud-up', 'code', 'cycle', 'cycle-follicular', 'cycle-luteal',
    'cycle-menstrual', 'cycle-ovulation', 'discover-ai', 'discover-goals', 'discover-mood', 'discover-orb', 'document', 'edit', 'eye', 'food', 'gauge', 'globe', 'gut',
    'heart-pulse', 'import-arrow', 'leaf', 'learn', 'life-ring', 'link', 'lock', 'lock-open', 'medal',
    'mood-clipboard', 'onboard-bell', 'onboard-celebrate', 'onboard-coach', 'onboard-cookie', 'onboard-globe', 'onboard-heart',
    'onboard-helper', 'onboard-install', 'onboard-mascot', 'onboard-shield', 'onboard-sparkle', 'notice', 'reload',
    'palette', 'pill', 'pill-check', 'plus', 'qr', 'compass', 'run', 'save', 'share', 'shield-check', 'sleep', 'sparkle-ring', 'overview-monitor', 'trends-vitals',
    'star', 'stethoscope', 'stress', 'stressor-bolt', 'target', 'trash', 'user', 'zap',
    'weather-aqi-good', 'weather-aqi-moderate', 'weather-aqi-poor',
    'weather-clear', 'weather-cloudy', 'weather-fog', 'weather-partly-cloudy',
    'weather-pressure', 'weather-pressure-high', 'weather-pressure-low',
    'weather-rain', 'weather-snow', 'weather-temp-cold', 'weather-temp-hot',
    'weather-temp-mild', 'weather-temp-warm', 'weather-thunder', 'weather-unknown',
    'voidorb', 'tidewarden', 'leafcircuit', 'prismcore', 'moonthread',
    'emberveil', 'riftecho', 'stonebloom', 'glasswave', 'ashspiral',
    'coralnode', 'starlace', 'mistveil', 'thornloop', 'sunwarden',
    'duskmantle', 'ironbloom', 'vortexseed', 'lumenshard', 'driftmoss',
  ]);
  var safeName = String(name || '').replace(/[^a-z0-9-]/gi, '');
  if (!KNOWN_SVG_ICONS.has(safeName)) safeName = 'notice';
  var cls = className || 'ui-svg-icon';
  var label = title ? ' role="img" aria-label="' + escapeAttr(title) + '"' : ' aria-hidden="true"';
  return '<svg class="' + cls + '"' + label + '><use href="#icon-' + safeName + '"></use></svg>';
}

function svgIconUnsafe(name, cls) {
  var safeName = String(name || '').replace(/[^a-z0-9-]/gi, '');
  return '<svg class="' + (cls || 'ui-svg-icon') + '" aria-hidden="true"><use href="#icon-' + safeName + '"></use></svg>';
}

function sanitizeHTML(html) {
  if (typeof html !== 'string') return '';
  // Escape HTML special characters
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/** Trap Tab/Escape in modal overlays; returns teardown function. */
function installModalFocusTrap(overlay, options) {
  if (!overlay) return function () {};
  options = options || {};
  var focusSelector = options.focusSelector || 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var previousFocus = document.activeElement;
  function onKeyDown(e) {
    if (e.key === 'Escape' && typeof options.onEscape === 'function') {
      e.preventDefault();
      options.onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    var nodes = overlay.querySelectorAll(focusSelector);
    if (!nodes.length) return;
    var list = Array.prototype.filter.call(nodes, function (n) {
      return !n.disabled && n.offsetParent !== null;
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  overlay.addEventListener('keydown', onKeyDown);
  var initial = overlay.querySelector(options.initialFocusSelector || focusSelector);
  if (initial && initial.focus) initial.focus();
  return function teardownModalFocusTrap() {
    overlay.removeEventListener('keydown', onKeyDown);
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  };
}

/** Unified toast wrapper (ui-feedback.js). */
function notifyUser(message, opts) {
  opts = opts || {};
  if (typeof showToast === 'function') {
    showToast(message, opts);
    if (typeof haptic === 'function') haptic(opts.type === 'error' ? [20, 40, 20] : 12);
    return;
  }
  alert(message);
}

function notifySuccess(message, opts) {
  notifyUser(message, Object.assign({ type: 'success' }, opts || {}));
}

function notifyError(message, opts) {
  notifyUser(message, Object.assign({ type: 'error' }, opts || {}));
}

function initToggleSwitchA11y(root) {
  root = root || document;
  root.querySelectorAll('.toggle-switch').forEach(function (el) {
    if (el.getAttribute('role') === 'switch') return;
    el.setAttribute('role', 'switch');
    el.setAttribute('tabindex', '0');
    var active = el.classList.contains('active');
    el.setAttribute('aria-checked', active ? 'true' : 'false');
    if (el._toggleA11yBound) return;
    el._toggleA11yBound = true;
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
}

/** Safe text for HTML attribute (e.g. aria-label) */
function escapeAttr(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { escapeHTML, svgIcon, svgIconUnsafe, installModalFocusTrap, notifySuccess, notifyError, initToggleSwitchA11y, escapeAttr };
