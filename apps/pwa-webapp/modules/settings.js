/**
 * Settings overlay + carousel module (Plan 01 T1).
 * Exports init helpers; keeps window.toggleSettings / closeSettings contract for inline handlers.
 */

/** True when overlay is open or mid open/close transition (not merely display:block during rAF). */
function settingsOverlayIsOpen(overlay) {
  if (!overlay) return false;
  if (overlay.classList.contains('settings-overlay--open')) return true;
  var state = overlay.dataset.settingsState;
  return state === 'opening' || state === 'closing';
}
/** Minimal overlay open/close used before full module install. */
function settingsOverlaySetOpen(overlay, open, deps) {
  if (!overlay) return;
  if (open) {
    overlay.dataset.settingsState = 'opening';
    document.body.classList.add('settings-modal-open', 'modal-active');
    overlay.classList.add('settings-overlay--visible');
    overlay.classList.remove('settings-overlay--hidden');
    requestAnimationFrame(function () {
      overlay.classList.add('settings-overlay--open');
      overlay.dataset.settingsState = 'open';
    });
    if (deps.loadSettingsState) deps.loadSettingsState();
    if (typeof window !== 'undefined' && window.RianellPrivacy && typeof window.RianellPrivacy.renderSettingsPane === 'function') {
      window.RianellPrivacy.renderSettingsPane();
    }
    if (deps.initSettingsCarouselUI) deps.initSettingsCarouselUI();
  } else {
    overlay.dataset.settingsState = 'closing';
    overlay.classList.remove('settings-overlay--open');
    var cleaned = false;
    function doCleanup() {
      if (cleaned) return;
      cleaned = true;
      overlay.removeEventListener('transitionend', onEnd);
      if (t) clearTimeout(t);
      overlay.classList.remove('settings-overlay--visible', 'settings-overlay--open');
      overlay.classList.add('settings-overlay--hidden');
      delete overlay.dataset.settingsState;
      document.body.classList.remove('modal-active', 'settings-modal-open');
    }
    var onEnd = function (e) {
      if (e.target !== overlay) return;
      doCleanup();
    };
    overlay.addEventListener('transitionend', onEnd);
    var t = setTimeout(doCleanup, 450);
  }
}

/** Early placeholder so inline onclick handlers do not error before full install. */
export function installSettingsEarlyPlaceholder(deps) {
  if (typeof window === 'undefined') return;
  window.toggleSettings = function () {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    const isVisible = settingsOverlayIsOpen(overlay);
    if (isVisible) {
      settingsOverlaySetOpen(overlay, false, deps);
    } else {
      if (deps.refreshBuildDownloadLinks) deps.refreshBuildDownloadLinks();
      if (typeof window.RianellPrivacy !== 'undefined' && typeof window.RianellPrivacy.renderSettingsPane === 'function') {
        window.RianellPrivacy.renderSettingsPane();
      }
      settingsOverlaySetOpen(overlay, true, deps);
      const menu = overlay.querySelector('.settings-menu');
      if (menu) menu.classList.add('settings-menu--ready');
    }
  };
}

function captureSettingsModalCarouselState(overlay) {
  var track = document.getElementById('settingsCarouselTrack');
  if (!track) {
    var sc = overlay && overlay.querySelector('.settings-content');
    if (sc) window.settingsModalScrollPosition = sc.scrollTop;
    return;
  }
  var idx = parseInt(track.getAttribute('data-settings-index') || '0', 10);
  window.settingsModalPaneIndex = idx;
  var panes = track.querySelectorAll('.settings-carousel-pane');
  var pane = panes[idx];
  window.settingsModalScrollPosition = pane ? pane.scrollTop : 0;
}

function bindSettingsCarouselTouchOnce(settingsCarouselStep) {
  if (window._settingsCarouselTouchBound) return;
  var vp = document.getElementById('settingsCarouselViewport');
  if (!vp) return;
  window._settingsCarouselTouchBound = true;
  var startX = null;
  vp.addEventListener(
    'touchstart',
    function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      startX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  vp.addEventListener(
    'touchend',
    function (e) {
      if (startX == null || !e.changedTouches || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].screenX - startX;
      startX = null;
      if (Math.abs(dx) < 56) return;
      if (dx > 0) settingsCarouselStep(-1);
      else settingsCarouselStep(1);
    },
    { passive: true }
  );
}

function resolveSettingsPaneTitle(pane) {
  if (!pane) return '';
  var key = pane.getAttribute('data-settings-pane-i18n');
  var i18n = typeof window !== 'undefined' ? window.RianellI18n : null;
  if (key && i18n && typeof i18n.t === 'function') {
    var translated = i18n.t(key);
    if (translated && translated !== key) return translated;
  }
  return pane.getAttribute('data-settings-pane-title') || '';
}

function getSettingsAppLockIconState() {
  var enabled = typeof window !== 'undefined' && window.appSettings && window.appSettings.appLockEnabled;
  return enabled ? 'locked' : 'unlocked';
}

function findSettingsSecurityLockPaneIndex(panes) {
  if (!panes || !panes.length) return -1;
  for (var i = 0; i < panes.length; i++) {
    if (panes[i].getAttribute('data-settings-pane-i18n') === 'settings.security.title') return i;
  }
  return -1;
}

function refreshSettingsSecurityLockTabIcon(svgIcon) {
  var track = document.getElementById('settingsCarouselTrack');
  if (!track) return;
  var panes = track.querySelectorAll('.settings-carousel-pane');
  var idx = findSettingsSecurityLockPaneIndex(panes);
  if (idx < 0) return;
  var dotsWrap = document.getElementById('settingsCarouselDots');
  if (!dotsWrap) return;
  var dot = dotsWrap.querySelector('.settings-carousel-dot[data-settings-target="' + String(idx) + '"]');
  if (!dot) {
    ensureSettingsCarouselDots(panes, svgIcon);
    return;
  }
  var enabled = typeof window !== 'undefined' && window.appSettings && window.appSettings.appLockEnabled;
  var iconWrap = dot.querySelector('.settings-carousel-dot__icon');
  if (iconWrap && typeof svgIcon === 'function') {
    iconWrap.innerHTML = svgIcon(enabled ? 'lock' : 'lock-open', 'ui-svg-icon');
  }
  dotsWrap.setAttribute('data-app-lock-state', getSettingsAppLockIconState());
}

/** Settings chapter groupings (pane indices match `data-settings-pane-i18n` order in index.html). */
var SETTINGS_CHAPTERS = [
  { id: 'gettingStarted', i18n: 'settings.chapter.gettingStarted', icon: 'zap', panes: [0, 1, 3], defaultOpen: true },
  { id: 'customise', i18n: 'settings.chapter.customise', icon: 'palette', panes: [4, 5], defaultOpen: false },
  { id: 'advanced', i18n: 'settings.chapter.advanced', icon: 'zap', panes: [2, 6, 7, 8, 9], defaultOpen: false }
];

function settingsChapterTitle(key) {
  var i18n = typeof window !== 'undefined' ? window.RianellI18n : null;
  if (i18n && typeof i18n.t === 'function') {
    var translated = i18n.t(key);
    if (translated && translated !== key) return translated;
  }
  if (typeof window !== 'undefined' && typeof window.tUi === 'function') return window.tUi(key);
  return key;
}

function toggleSettingsChapter(chapterId) {
  var root = document.getElementById('settingsChapters');
  if (!root) return;
  var chapter = root.querySelector('[data-settings-chapter="' + chapterId + '"]');
  if (!chapter) return;
  var open = !chapter.classList.contains('settings-chapter--open');
  chapter.classList.toggle('settings-chapter--open', open);
  var toggle = chapter.querySelector('.settings-chapter-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function settingsIconForTitle(title, idx, paneEl) {
  var paneKey = paneEl && paneEl.getAttribute ? paneEl.getAttribute('data-settings-pane-i18n') : '';
  if (paneKey === 'settings.privacy.title') return 'check';
  if (paneKey === 'settings.security.title') {
    var enabled = typeof window !== 'undefined' && window.appSettings && window.appSettings.appLockEnabled;
    return enabled ? 'lock' : 'lock-open';
  }
  var t = String(title || '').toLowerCase();
  if (t.indexOf('privacy') !== -1 || t.indexOf('region') !== -1) return 'document';
  if (t.indexOf('personal') !== -1 || t.indexOf('cloud') !== -1) return 'user';
  if (t.indexOf('ai') !== -1 || t.indexOf('goal') !== -1) return 'brain';
  if (t.indexOf('display') !== -1 || t.indexOf('reminder') !== -1) return 'chart-bars';
  if (t.indexOf('custom') !== -1 || t.indexOf('theme') !== -1) return 'palette';
  if (t.indexOf('access') !== -1) return 'accessibility';
  if (t.indexOf('data option') !== -1) return 'save';
  if (t.indexOf('performance') !== -1) return 'zap';
  if (t.indexOf('install') !== -1) return 'save';
  if (t.indexOf('data management') !== -1) return 'save';
  if (t.indexOf('security') !== -1) return 'lock-open';
  return idx % 2 === 0 ? 'chart-bars' : 'document';
}

function buildSettingsDot(paneIdx, paneEl, panes, svgIcon) {
  var paneTitle = resolveSettingsPaneTitle(paneEl) || 'Section ' + String(paneIdx + 1);
  var dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'settings-carousel-dot';
  dot.setAttribute('aria-label', 'Go to settings section ' + String(paneIdx + 1) + (paneTitle ? ': ' + paneTitle : ''));
  dot.setAttribute('title', paneTitle);
  dot.setAttribute('data-settings-target', String(paneIdx));
  dot.setAttribute('data-dist', '3');
  dot.innerHTML = '<span class="settings-carousel-dot__icon" aria-hidden="true">' +
    svgIcon(settingsIconForTitle(paneTitle, paneIdx, paneEl), 'ui-svg-icon') + '</span>';
  dot.addEventListener('click', function (e) {
    var idx = parseInt(e.currentTarget.getAttribute('data-settings-target') || '0', 10);
    if (typeof window.settingsCarouselGo === 'function') window.settingsCarouselGo(idx);
  });
  return dot;
}

function initSettingsChapters(panes, svgIcon) {
  var root = document.getElementById('settingsChapters');
  if (!root) return;

  var strip = document.getElementById('settingsIconStrip');

  if (root.getAttribute('data-chapters-built') === '1' && strip) {
    // Refresh security lock icon if needed
    panes && panes.forEach && panes.forEach(function (paneEl, i) {
      var dot = strip.querySelector('[data-settings-target="' + i + '"]');
      if (dot) {
        var paneKey = paneEl && paneEl.getAttribute ? paneEl.getAttribute('data-settings-pane-i18n') : '';
        if (paneKey === 'settings.security.title') {
          var icon = dot.querySelector('.settings-carousel-dot__icon');
          if (icon) icon.innerHTML = svgIcon(settingsIconForTitle('', i, paneEl), 'ui-svg-icon');
        }
      }
    });
    return;
  }

  root.innerHTML = '';
  root.className = 'settings-chapters settings-chapters--flat';

  strip = document.createElement('div');
  strip.className = 'settings-carousel-dots settings-icon-strip';
  strip.id = 'settingsIconStrip';
  strip.setAttribute('role', 'tablist');
  strip.setAttribute('aria-label', root.getAttribute('aria-label') || 'Settings sections');

  if (panes) {
    for (var i = 0; i < panes.length; i++) {
      strip.appendChild(buildSettingsDot(i, panes[i], panes, svgIcon));
    }
  }

  root.appendChild(strip);
  root.setAttribute('data-chapters-built', '1');

  var track = document.getElementById('settingsCarouselTrack');
  if (track) {
    updateSettingsCarouselDots(parseInt(track.getAttribute('data-settings-index') || '0', 10));
  }
}

function refreshSettingsChapterDots(panes, svgIcon) {
  if (!panes || !panes.length) return;
  SETTINGS_CHAPTERS.forEach(function (chapter) {
    var dotsWrap = document.querySelector('.settings-chapter-dots[data-chapter-id="' + chapter.id + '"]');
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    chapter.panes.forEach(function (paneIdx) {
      if (paneIdx < 0 || paneIdx >= panes.length) return;
      var dot = document.createElement('button');
      var paneTitle = resolveSettingsPaneTitle(panes[paneIdx]) || 'Section ' + String(paneIdx + 1);
      dot.className = 'settings-carousel-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Go to settings section ' + String(paneIdx + 1) + (paneTitle ? ': ' + paneTitle : ''));
      dot.setAttribute('title', paneTitle);
      dot.setAttribute('data-settings-target', String(paneIdx));
      dot.innerHTML =
        '<span class="settings-carousel-dot__icon" aria-hidden="true">' +
        svgIcon(settingsIconForTitle(paneTitle, paneIdx, panes[paneIdx]), 'ui-svg-icon') +
        '</span>';
      dot.addEventListener('click', function (e) {
        var idx = parseInt(e.currentTarget.getAttribute('data-settings-target') || '0', 10);
        if (typeof window.settingsCarouselGo === 'function') window.settingsCarouselGo(idx);
      });
      dotsWrap.appendChild(dot);
    });
  });
  var track = document.getElementById('settingsCarouselTrack');
  if (track) {
    var active = parseInt(track.getAttribute('data-settings-index') || '0', 10);
    updateSettingsCarouselDots(active);
  }
}

function ensureSettingsCarouselDots(panes, svgIcon) {
  var chaptersRoot = document.getElementById('settingsChapters');
  if (chaptersRoot) {
    initSettingsChapters(panes, svgIcon);
    return;
  }
  var dotsWrap = document.getElementById('settingsCarouselDots');
  if (!dotsWrap) return;
  var n = panes && panes.length ? panes.length : 0;
  if (n < 1) {
    dotsWrap.innerHTML = '';
    dotsWrap.removeAttribute('data-carousel-icons');
    return;
  }
  dotsWrap.style.setProperty('--settings-pane-count', String(n));
  if (
    dotsWrap.childElementCount === n &&
    dotsWrap.getAttribute('data-carousel-icons') === 'svg' &&
    dotsWrap.getAttribute('data-pane-count') === String(n) &&
    dotsWrap.getAttribute('data-app-lock-state') === getSettingsAppLockIconState()
  ) {
    return;
  }
  dotsWrap.setAttribute('data-pane-count', String(n));
  dotsWrap.setAttribute('data-app-lock-state', getSettingsAppLockIconState());
  dotsWrap.innerHTML = '';
  dotsWrap.setAttribute('data-carousel-icons', 'svg');

  for (var i = 0; i < n; i++) {
    var dot = document.createElement('button');
    var paneTitle = resolveSettingsPaneTitle(panes[i]) || 'Section ' + String(i + 1);
    dot.className = 'settings-carousel-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Go to settings section ' + String(i + 1) + (paneTitle ? ': ' + paneTitle : ''));
    dot.setAttribute('title', paneTitle);
    dot.setAttribute('data-settings-target', String(i));
    dot.setAttribute('data-dist', '3');
    dot.innerHTML =
      '<span class="settings-carousel-dot__icon" aria-hidden="true">' +
      svgIcon(settingsIconForTitle(paneTitle, i, panes[i]), 'ui-svg-icon') +
      '</span>';
    dot.addEventListener('click', function (e) {
      var idx = parseInt(e.currentTarget.getAttribute('data-settings-target') || '0', 10);
      window.settingsCarouselGo(idx);
    });
    dotsWrap.appendChild(dot);
  }
}

function updateSettingsCarouselDots(activeIdx) {
  var dots = document.querySelectorAll('#settingsChapters .settings-carousel-dot, #settingsCarouselDots .settings-carousel-dot');
  if (!dots || !dots.length) return;
  var activeDot = null;
  for (var i = 0; i < dots.length; i++) {
    var target = parseInt(dots[i].getAttribute('data-settings-target') || '-1', 10);
    var active = target === activeIdx;
    var dist = Math.min(Math.abs(target - activeIdx), 3);
    dots[i].classList.toggle('settings-carousel-dot--active', active);
    dots[i].setAttribute('aria-current', active ? 'true' : 'false');
    dots[i].setAttribute('data-dist', String(dist));
    if (active) activeDot = dots[i];
  }
  // Scroll active dot to centre of strip
  if (activeDot) {
    var strip = activeDot.parentElement;
    if (strip) {
      var stripW = strip.offsetWidth;
      var dotLeft = activeDot.offsetLeft;
      var dotW = activeDot.offsetWidth;
      strip.scrollTo({ left: dotLeft - stripW / 2 + dotW / 2, behavior: 'smooth' });
    }
  }
}

/**
 * Full settings module: carousel navigation, overlay open/close, keyboard trap.
 * @param {object} deps — callbacks from app.js (loadSettingsState, svgIcon, etc.)
 */
export function installSettingsModule(deps) {
  const svgIcon = deps.svgIcon;
  const loadSettingsState = deps.loadSettingsState;
  const refreshBuildDownloadLinks = deps.refreshBuildDownloadLinks;
  const refreshLlmModelSettingsHints = deps.refreshLlmModelSettingsHints;
  const ensureSummaryLlmLoadedForSettings = deps.ensureSummaryLlmLoadedForSettings;

  function settingsCarouselGo(i) {
    var track = document.getElementById('settingsCarouselTrack');
    var vp = document.getElementById('settingsCarouselViewport');
    var meta = document.getElementById('settingsCarouselMeta');
    var prev = document.getElementById('settingsCarouselPrev');
    var next = document.getElementById('settingsCarouselNext');
    if (!track || !vp) return;
    var panes = track.querySelectorAll('.settings-carousel-pane');
    var n = panes.length;
    if (n < 1) return;
    ensureSettingsCarouselDots(panes, svgIcon);
    if (i < 0) i = 0;
    if (i >= n) i = n - 1;
    track.setAttribute('data-settings-index', String(i));
    track.style.setProperty('--settings-pane-index', String(i));
    track.style.setProperty('--settings-pane-count', String(n));
    vp.style.setProperty('--settings-pane-count', String(n));
    if (prev) {
      prev.disabled = i <= 0;
      prev.setAttribute('aria-disabled', i <= 0 ? 'true' : 'false');
    }
    if (next) {
      next.disabled = i >= n - 1;
      next.setAttribute('aria-disabled', i >= n - 1 ? 'true' : 'false');
    }
    panes.forEach(function (p, idx) {
      var active = idx === i;
      p.classList.toggle('settings-carousel-pane--active', active);
      p.setAttribute('aria-hidden', active ? 'false' : 'true');
      if ('inert' in p) p.inert = !active;
    });
    var title = resolveSettingsPaneTitle(panes[i]);
    if (meta) meta.textContent = String(i + 1) + ' / ' + n + (title ? ' - ' + title : '');
    updateSettingsCarouselDots(i);
    window.settingsModalPaneIndex = i;
    if (i === 7 && typeof refreshLlmModelSettingsHints === 'function') {
      if (typeof ensureSummaryLlmLoadedForSettings === 'function') {
        ensureSummaryLlmLoadedForSettings()
          .then(function () {
            refreshLlmModelSettingsHints();
          })
          .catch(function () {
            refreshLlmModelSettingsHints();
          });
      } else {
        refreshLlmModelSettingsHints();
      }
    }
    var activePane = panes[i];
    if (activePane) {
      var paneI18n = activePane.getAttribute('data-settings-pane-i18n') || '';
      if (paneI18n === 'settings.developer.title') {
        if (typeof window.loadApiKeysList === 'function') window.loadApiKeysList();
        if (typeof window.loadWebhooksList === 'function') window.loadWebhooksList();
      }
    }
  }

  function settingsCarouselStep(delta) {
    var track = document.getElementById('settingsCarouselTrack');
    if (!track) return;
    var i = parseInt(track.getAttribute('data-settings-index') || '0', 10);
    settingsCarouselGo(i + delta);
  }

  function initSettingsCarouselUI() {
    bindSettingsCarouselTouchOnce(settingsCarouselStep);
    var track = document.getElementById('settingsCarouselTrack');
    if (!track) return;
    var n = track.querySelectorAll('.settings-carousel-pane').length;
    if (n < 1) return;
    settingsCarouselGo(0);
  }

  var _settingsEscapeAndTrapHandler = null;
  var _settingsPreviousActiveElement = null;

  function getFocusableInSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return [];
    const sel =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(overlay.querySelectorAll(sel), function (el) {
      var pane = el.closest('.settings-carousel-pane');
      if (pane && !pane.classList.contains('settings-carousel-pane--active')) return false;
      return (
        el.offsetParent !== null &&
        (el.tabIndex >= 0 ||
          el.tagName === 'A' ||
          el.tagName === 'INPUT' ||
          el.tagName === 'SELECT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'BUTTON')
      );
    });
  }

  function removeSettingsKeydown() {
    if (_settingsEscapeAndTrapHandler) {
      document.removeEventListener('keydown', _settingsEscapeAndTrapHandler);
      _settingsEscapeAndTrapHandler = null;
    }
  }

  function resetSettingsStateOnClose() {
    window.settingsModalPaneIndex = 0;
    window.settingsModalScrollPosition = 0;
    window.settingsModalConditionSelectorOpen = false;
    var conditionSelector = document.getElementById('medicalConditionSelector');
    var displayContainer = document.getElementById('medicalConditionDisplayContainer');
    if (conditionSelector) conditionSelector.style.display = 'none';
    if (displayContainer) displayContainer.style.display = 'block';
    var root = document.getElementById('settingsChapters');
    if (root) {
      SETTINGS_CHAPTERS.forEach(function (chapter) {
        var section = root.querySelector('[data-settings-chapter="' + chapter.id + '"]');
        if (!section) return;
        section.classList.toggle('settings-chapter--open', !!chapter.defaultOpen);
        var toggle = section.querySelector('.settings-chapter-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', chapter.defaultOpen ? 'true' : 'false');
      });
    }
  }

  function settingsOverlayDoCloseCleanup(overlay, onDone) {
    overlay.classList.remove('settings-overlay--visible', 'settings-overlay--open');
    overlay.classList.add('settings-overlay--hidden');
    delete overlay.dataset.settingsState;
    document.body.classList.remove('modal-active', 'settings-modal-open');
    if (onDone) onDone();
  }

  function settingsOverlayCloseWithTransition(overlay, onDone) {
    if (!settingsOverlayIsOpen(overlay)) {
      settingsOverlayDoCloseCleanup(overlay, onDone);
      return;
    }
    overlay.dataset.settingsState = 'closing';
    overlay.classList.remove('settings-overlay--open');
    var cleaned = false;
    function doCleanup() {
      if (cleaned) return;
      cleaned = true;
      overlay.removeEventListener('transitionend', onEnd);
      if (timeoutId != null) clearTimeout(timeoutId);
      settingsOverlayDoCloseCleanup(overlay, onDone);
    }
    var onEnd = function (e) {
      if (e.target !== overlay) return;
      doCleanup();
    };
    overlay.addEventListener('transitionend', onEnd);
    var timeoutId = setTimeout(doCleanup, 450);
  }

  const fullToggleSettings = function () {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    const isVisible = settingsOverlayIsOpen(overlay);

    if (isVisible) {
      resetSettingsStateOnClose();
      removeSettingsKeydown();
      settingsOverlayCloseWithTransition(overlay, function () {
        if (_settingsPreviousActiveElement && typeof _settingsPreviousActiveElement.focus === 'function') {
          _settingsPreviousActiveElement.focus();
          _settingsPreviousActiveElement = null;
        }
      });
    } else {
      if (overlay.style.display === 'block' && !settingsOverlayIsOpen(overlay)) {
        settingsOverlayDoCloseCleanup(overlay, null);
      }
      overlay.dataset.settingsState = 'opening';
      _settingsPreviousActiveElement = document.activeElement;
      document.body.classList.add('settings-modal-open', 'modal-active');
      window.scrollTo(0, 0);
      overlay.classList.add('settings-overlay--visible');
      overlay.classList.remove('settings-overlay--hidden');
      const menu = overlay.querySelector('.settings-menu');
      if (menu) menu.classList.add('settings-menu--ready');
      if (typeof loadSettingsState === 'function') loadSettingsState();
      if (typeof window.RianellPrivacy !== 'undefined' && typeof window.RianellPrivacy.renderSettingsPane === 'function') {
        window.RianellPrivacy.renderSettingsPane();
      }
      requestAnimationFrame(function () {
        overlay.classList.add('settings-overlay--open');
        overlay.dataset.settingsState = 'open';
      });
      initSettingsCarouselUI();
      _settingsEscapeAndTrapHandler = function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          removeSettingsKeydown();
          window.closeSettings();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          var kt = e.target;
          if (kt && (kt.tagName === 'INPUT' || kt.tagName === 'TEXTAREA' || kt.tagName === 'SELECT')) return;
          e.preventDefault();
          if (e.key === 'ArrowLeft') settingsCarouselStep(-1);
          else settingsCarouselStep(1);
          return;
        }
        if (e.key !== 'Tab') return;
        var focusable = getFocusableInSettings();
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', _settingsEscapeAndTrapHandler);
      setTimeout(function () {
        var focusable = getFocusableInSettings();
        if (focusable.length > 0) focusable[0].focus();
      }, 50);
    }
  };

  window.toggleSettings = fullToggleSettings;

  window.closeSettings = function () {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    resetSettingsStateOnClose();
    removeSettingsKeydown();
    var focusBack = function () {
      if (_settingsPreviousActiveElement && typeof _settingsPreviousActiveElement.focus === 'function') {
        _settingsPreviousActiveElement.focus();
        _settingsPreviousActiveElement = null;
      }
    };
    if (settingsOverlayIsOpen(overlay)) {
      settingsOverlayCloseWithTransition(overlay, focusBack);
    } else {
      settingsOverlayDoCloseCleanup(overlay, focusBack);
    }
  };

  window.settingsCarouselStep = settingsCarouselStep;
  window.settingsCarouselGo = settingsCarouselGo;

  if (typeof document !== 'undefined') {
    document.toggleSettings = window.toggleSettings;
    document.closeSettings = window.closeSettings;
  }

  function getSettingsPaneIndexByI18nKey(i18nKey) {
    var track = document.getElementById('settingsCarouselTrack');
    if (!track) return 1;
    var panes = track.querySelectorAll('.settings-carousel-pane');
    for (var i = 0; i < panes.length; i++) {
      if (panes[i].getAttribute('data-settings-pane-i18n') === i18nKey) return i;
    }
    return 1;
  }

  /** Re-bind early placeholder deps once carousel init exists. */
  installSettingsEarlyPlaceholder({
    loadSettingsState,
    initSettingsCarouselUI,
    refreshBuildDownloadLinks,
  });

  function filterSettingsPanes(query) {
    var needle = (query || '').trim().toLowerCase();
    var track = document.getElementById('settingsCarouselTrack');
    if (!track) return;
    var panes = track.querySelectorAll('.settings-carousel-pane');
    var firstHit = -1;
    panes.forEach(function (pane, idx) {
      var title = (pane.getAttribute('data-settings-pane-i18n') || pane.getAttribute('data-settings-pane-title') || '').toLowerCase();
      var body = (pane.textContent || '').toLowerCase();
      var match = !needle || title.indexOf(needle) >= 0 || body.indexOf(needle) >= 0;
      pane.classList.toggle('settings-carousel-pane--search-hidden', !match);
      if (match && firstHit < 0) firstHit = idx;
    });
    if (firstHit >= 0 && needle) settingsCarouselGo(firstHit);
  }
  if (typeof window !== 'undefined') {
    window.filterSettingsPanes = filterSettingsPanes;
    window.toggleSettingsChapter = toggleSettingsChapter;
    window.initSettingsChapters = function () {
      var track = document.getElementById('settingsCarouselTrack');
      if (!track) return;
      initSettingsChapters(track.querySelectorAll('.settings-carousel-pane'), svgIcon);
    };
  }

  return {
    captureSettingsModalCarouselState,
    settingsCarouselGo,
    settingsCarouselStep,
    initSettingsCarouselUI,
    filterSettingsPanes,
    getSettingsPaneIndexByI18nKey,
    refreshSettingsSecurityLockTabIcon: function () {
      refreshSettingsSecurityLockTabIcon(svgIcon);
    },
    settingsOverlaySetOpen: function (overlay, open) {
      settingsOverlaySetOpen(overlay, open, { loadSettingsState, initSettingsCarouselUI });
    },
    toggleSettings: fullToggleSettings,
    closeSettings: window.closeSettings,
  };
}
