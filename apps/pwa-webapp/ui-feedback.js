/**
 * Shared UI feedback: toasts, modals, haptics, ripple, scroll-reveal, offline banner.
 * @rianell/ui-feedback — keep platform-parity hooks in sync with RN Toast component.
 */
(function (global) {
  'use strict';

  function tUi(key, params) {
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      return global.RianellI18n.t(key, params);
    }
    return key;
  }

  var TOAST_CONTAINER_ID = 'rianellToastStack';
  var OFFLINE_ID = 'rianellOfflineIndicator';
  var UPDATE_BAR_ID = 'rianellUpdateBar';
  var AI_DOWNLOAD_ID = 'rianellAiModelDownloadBanner';
  var AI_PROGRESS_MODAL_ID = 'aiModelDownloadProgressOverlay';
  var aiDownloadUiMode = 'desktop';

  function isMobileViewport() {
    try {
      return global.matchMedia && global.matchMedia('(max-width: 768px)').matches;
    } catch (e) {
      return false;
    }
  }

  function isInstalledPwa() {
    try {
      if (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) return true;
      if (global.navigator && global.navigator.standalone === true) return true;
    } catch (e) {}
    return false;
  }

  function isMobileWebDownload() {
    return isMobileViewport() && !isInstalledPwa();
  }

  function resolveAiDownloadUiMode() {
    if (!isMobileViewport()) return 'desktop';
    if (isInstalledPwa()) return 'blocking';
    return 'mobile-web';
  }

  function setAiModelDownloadUiMode(mode) {
    aiDownloadUiMode = mode || resolveAiDownloadUiMode();
    applyAiModelDownloadConsentUiMode();
  }

  function applyAiModelDownloadConsentUiMode() {
    var overlay = document.getElementById('aiModelDownloadOverlay');
    if (!overlay) return;
    var blocking = aiDownloadUiMode === 'blocking';
    overlay.classList.toggle('ai-model-download-consent--blocking', blocking);
    var closeBtn = overlay.querySelector('.modal-close');
    var deferBtn = overlay.querySelector('.modal-cancel-btn');
    if (closeBtn) closeBtn.style.display = blocking ? 'none' : '';
    if (deferBtn) deferBtn.style.display = blocking ? 'none' : '';
  }

  function prefersReducedMotion() {
    try {
      return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function haptic(pattern) {
    if (prefersReducedMotion()) return;
    try {
      if (global.navigator && typeof global.navigator.vibrate === 'function') {
        global.navigator.vibrate(pattern || 12);
      }
    } catch (e) {}
  }

  function ensureToastContainer() {
    var el = document.getElementById(TOAST_CONTAINER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = TOAST_CONTAINER_ID;
    el.className = 'rianell-toast-stack';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    return el;
  }

  /**
   * @param {string} message
   * @param {{ type?: string, duration?: number, action?: { label: string, onClick: function } }} [opts]
   */
  function showToast(message, opts) {
    opts = opts || {};
    var type = opts.type || 'success';
    var duration = typeof opts.duration === 'number' ? opts.duration : 3200;
    var stack = ensureToastContainer();
    var toast = document.createElement('div');
    toast.className = 'rianell-toast rianell-toast--' + type;
    toast.setAttribute('role', 'alert');

    var body = document.createElement('div');
    body.className = 'rianell-toast__body';
    body.textContent = message;
    toast.appendChild(body);

    if (opts.action && opts.action.label) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rianell-toast__action';
      btn.textContent = opts.action.label;
      btn.addEventListener('click', function () {
        try { opts.action.onClick(); } catch (e) {}
        dismissToast(toast);
      });
      toast.appendChild(btn);
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'rianell-toast__close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    close.addEventListener('click', function () { dismissToast(toast); });
    toast.appendChild(close);

    var progress = document.createElement('div');
    progress.className = 'rianell-toast__progress';
    progress.style.animationDuration = duration + 'ms';
    toast.appendChild(progress);

    stack.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('rianell-toast--visible'); });

    var timer = setTimeout(function () { dismissToast(toast); }, duration);
    toast._dismissTimer = timer;

    toast.addEventListener('pointerdown', function (e) {
      toast._startX = e.clientX;
    });
    toast.addEventListener('pointerup', function (e) {
      if (typeof toast._startX === 'number' && e.clientX - toast._startX > 60) {
        dismissToast(toast);
      }
    });

    return toast;
  }

  function dismissToast(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
    toast.classList.remove('rianell-toast--visible');
    toast.classList.add('rianell-toast--exit');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, prefersReducedMotion() ? 0 : 220);
  }

  function openModalOverlay(overlay, options) {
    if (!overlay) return;
    options = options || {};
    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    overlay.classList.remove('modal-overlay--closing');
    overlay.classList.add('modal-overlay--open');
    document.body.classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    var main = document.getElementById('appShell');
    if (main && main.setAttribute) {
      try { main.setAttribute('inert', ''); } catch (e) {}
    }
    if (options.trap !== false && typeof global.installModalFocusTrap === 'function') {
      overlay._focusTrapTeardown = global.installModalFocusTrap(overlay, {
        onEscape: options.onEscape,
        initialFocusSelector: options.initialFocusSelector
      });
    }
  }

  function closeModalOverlay(overlay, options) {
    if (!overlay) return;
    options = options || {};
    if (overlay._focusTrapTeardown) {
      overlay._focusTrapTeardown();
      overlay._focusTrapTeardown = null;
    }
    var finish = function () {
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      overlay.classList.remove('modal-overlay--open', 'modal-overlay--closing');
      if (!document.querySelector('.modal-overlay--open')) {
        document.body.classList.remove('modal-active');
        document.body.style.overflow = '';
        var main = document.getElementById('appShell');
        if (main && main.removeAttribute) {
          try { main.removeAttribute('inert'); } catch (e) {}
        }
      }
      if (typeof options.onClosed === 'function') options.onClosed();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    overlay.classList.add('modal-overlay--closing');
    setTimeout(finish, options.duration || 220);
  }

  function initRipple(root) {
    root = root || document;
    root.querySelectorAll('[data-ripple]').forEach(function (el) {
      if (el._rippleBound) return;
      el._rippleBound = true;
      el.addEventListener('pointerdown', function (e) {
        if (prefersReducedMotion()) return;
        var rect = el.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'rianell-ripple-wave';
        var size = Math.max(rect.width, rect.height) * 1.2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        el.appendChild(ripple);
        ripple.addEventListener('animationend', function () {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        });
      });
    });
  }

  function initScrollReveal(root) {
    if (prefersReducedMotion() || !('IntersectionObserver' in global)) return;
    root = root || document;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('rianell-in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    root.querySelectorAll('[data-scroll-reveal]').forEach(function (el) {
      obs.observe(el);
    });
    return obs;
  }

  function countUp(el, target, duration) {
    if (!el) return;
    duration = duration || 600;
    var start = 0;
    var from = parseFloat(el.getAttribute('data-count-from') || '0') || 0;
    var to = typeof target === 'number' ? target : parseFloat(target) || 0;
    var decimals = (String(to).split('.')[1] || '').length;
    var t0 = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = from + (to - from) * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toString();
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function ensureOfflineIndicator() {
    var el = document.getElementById(OFFLINE_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = OFFLINE_ID;
    el.className = 'offline-indicator hidden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }

  function updateOfflineIndicator() {
    var el = ensureOfflineIndicator();
    var online = global.navigator.onLine !== false;
    if (online) {
      el.classList.add('hidden');
      return;
    }
    var queued = 0;
    try {
      if (global.__rianellOfflineQueueCount) queued = global.__rianellOfflineQueueCount;
    } catch (e) {}
    el.textContent = queued > 0
      ? queued + ' log' + (queued === 1 ? '' : 's') + ' will sync when back online'
      : 'You are offline — changes stay on this device';
    el.classList.remove('hidden');
  }

  function initOfflineIndicator() {
    ensureOfflineIndicator();
    global.addEventListener('online', updateOfflineIndicator);
    global.addEventListener('offline', updateOfflineIndicator);
    updateOfflineIndicator();
  }

  function showUpdateBar(message, onAction) {
    var bar = document.getElementById(UPDATE_BAR_ID);
    if (!bar) {
      bar = document.createElement('div');
      bar.id = UPDATE_BAR_ID;
      bar.className = 'rianell-update-bar';
      document.body.appendChild(bar);
    }
    bar.innerHTML = '';
    var text = document.createElement('span');
    text.textContent = message || 'Update ready';
    bar.appendChild(text);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rianell-update-bar__btn';
    btn.textContent = tUi('common.restart');
    btn.addEventListener('click', function () {
      if (typeof onAction === 'function') onAction();
    });
    bar.appendChild(btn);
    bar.classList.add('rianell-update-bar--visible');
  }

  function hideUpdateBar() {
    var bar = document.getElementById(UPDATE_BAR_ID);
    if (bar) bar.classList.remove('rianell-update-bar--visible');
  }

  function ensureAiModelDownloadBanner() {
    var el = document.getElementById(AI_DOWNLOAD_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = AI_DOWNLOAD_ID;
    el.className = 'ai-model-download-banner ai-model-download-banner--desktop hidden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="ai-model-download-banner__text">' +
      '<span class="ai-model-download-banner__label">' + tUi('common.downloading.ai.model') + '</span>' +
      '<span class="ai-model-download-banner__pct">0%</span>' +
      '</div>' +
      '<div class="ai-model-download-banner__track">' +
      '<div class="ai-model-download-banner__fill" style="width:0%"></div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function ensureAiModelDownloadProgressModal() {
    var el = document.getElementById(AI_PROGRESS_MODAL_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = AI_PROGRESS_MODAL_ID;
    el.className = 'modal-overlay ai-model-download-progress';
    el.style.display = 'none';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'aiModelDownloadProgressTitle');
    el.innerHTML =
      '<div class="modal-content ai-model-download-progress__content" onclick="event.stopPropagation()">' +
      '<div class="modal-header ai-model-download-progress__header">' +
      '<h3 id="aiModelDownloadProgressTitle">' + tUi('common.downloading.ai.model') + '</h3>' +
      '</div>' +
      '<div class="modal-body ai-model-download-progress__body">' +
      '<p class="ai-model-download-progress__label">' + tUi('common.preparing.on.device.ai') + '</p>' +
      '<div class="ai-model-download-progress__track">' +
      '<div class="ai-model-download-progress__fill" style="width:0%"></div>' +
      '</div>' +
      '<p class="ai-model-download-progress__pct">0%</p>' +
      '<p class="settings-hint ai-model-download-progress__hint">' + tUi('common.wi.fi.recommended.keep.this.screen.open.') + '</p>' +
      '</div>' +
      '<div class="modal-footer alert-modal-footer ai-model-download-progress__footer">' +
      '<button type="button" class="modal-cancel-btn" id="aiModelDownloadSkipBtn" onclick="skipAiModelDownloadProgress()">' + tUi('common.not.now') + '</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function formatAiDownloadLabel(state) {
    if (state && state.file) {
      return 'Downloading AI model… ' + String(state.file).split('/').pop();
    }
    return 'Downloading AI model…';
  }

  function applyAiDownloadProgressToElements(state, labelSel, pctSel, fillSel, root) {
    root = root || document;
    var pct = typeof state.pct === 'number' ? state.pct : 0;
    var labelEl = root.querySelector(labelSel);
    var pctEl = root.querySelector(pctSel);
    var fill = root.querySelector(fillSel);
    if (labelEl) labelEl.textContent = formatAiDownloadLabel(state);
    if (pctEl) pctEl.textContent = pct + '%';
    if (fill) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  function showAiModelDownloadProgressModal(state) {
    var modal = ensureAiModelDownloadProgressModal();
    var blocking = aiDownloadUiMode === 'blocking';
    var skipBtn = modal.querySelector('#aiModelDownloadSkipBtn');
    var hint = modal.querySelector('.ai-model-download-progress__hint');
    if (skipBtn) skipBtn.style.display = blocking ? 'none' : '';
    if (hint) {
      hint.textContent = blocking
        ? 'Wi-Fi recommended. The app will start when the download finishes.'
        : 'Wi-Fi recommended. You can continue without the model, but AI features will use text-only fallbacks.';
    }
    applyAiDownloadProgressToElements(
      state,
      '.ai-model-download-progress__label',
      '.ai-model-download-progress__pct',
      '.ai-model-download-progress__fill',
      modal
    );
    modal.style.display = 'flex';
    if (typeof openModalOverlay === 'function') openModalOverlay(modal);
    if (blocking && document.body) document.body.classList.add('ai-model-download-blocking');
  }

  function hideAiModelDownloadProgressModal() {
    var modal = document.getElementById(AI_PROGRESS_MODAL_ID);
    if (modal) modal.style.display = 'none';
    if (typeof closeModalOverlay === 'function') closeModalOverlay(modal);
    if (document.body) document.body.classList.remove('ai-model-download-blocking');
  }

  function updateAiModelDownloadProgressUI(state) {
    if (!state || !state.active) {
      hideAiModelDownloadProgressUI();
      return;
    }
    var mode = aiDownloadUiMode || resolveAiDownloadUiMode();
    if (mode === 'desktop') {
      hideAiModelDownloadProgressModal();
      var banner = ensureAiModelDownloadBanner();
      applyAiDownloadProgressToElements(
        state,
        '.ai-model-download-banner__label',
        '.ai-model-download-banner__pct',
        '.ai-model-download-banner__fill',
        banner
      );
      banner.classList.remove('hidden');
      return;
    }
    var desktopBanner = document.getElementById(AI_DOWNLOAD_ID);
    if (desktopBanner) desktopBanner.classList.add('hidden');
    showAiModelDownloadProgressModal(state);
  }

  function hideAiModelDownloadProgressUI() {
    var banner = document.getElementById(AI_DOWNLOAD_ID);
    if (banner) banner.classList.add('hidden');
    hideAiModelDownloadProgressModal();
  }

  function skipAiModelDownloadProgress() {
    if (aiDownloadUiMode === 'blocking') return;
    if (typeof global.cancelAiModelDownload === 'function') {
      global.cancelAiModelDownload();
    } else if (typeof global.deferAiModelDownloadConsent === 'function') {
      global.deferAiModelDownloadConsent();
    }
    hideAiModelDownloadProgressUI();
  }

  function applyThemeCrossfade(callback) {
    if (prefersReducedMotion()) {
      if (typeof callback === 'function') callback();
      return;
    }
    var veil = document.createElement('div');
    veil.className = 'rianell-theme-veil';
    document.body.appendChild(veil);
    requestAnimationFrame(function () {
      veil.classList.add('rianell-theme-veil--active');
      if (typeof callback === 'function') callback();
      setTimeout(function () {
        veil.classList.remove('rianell-theme-veil--active');
        setTimeout(function () {
          if (veil.parentNode) veil.parentNode.removeChild(veil);
        }, 280);
      }, 80);
    });
  }

  var TAB_ORDER = ['home', 'logs', 'charts', 'ai'];

  function getTabDirection(fromTab, toTab) {
    var a = TAB_ORDER.indexOf(fromTab);
    var b = TAB_ORDER.indexOf(toTab);
    if (a < 0 || b < 0 || a === b) return 0;
    return b > a ? 1 : -1;
  }

  function initUiFeedback() {
    initRipple(document);
    initScrollReveal(document);
    initOfflineIndicator();
    var mo = new MutationObserver(function () {
      initRipple(document);
      initScrollReveal(document);
    });
    if (document.body) {
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUiFeedback);
  } else {
    initUiFeedback();
  }

  global.showToast = showToast;
  global.dismissToast = dismissToast;
  global.haptic = haptic;
  global.openModalOverlay = openModalOverlay;
  global.closeModalOverlay = closeModalOverlay;
  global.initRipple = initRipple;
  global.initScrollReveal = initScrollReveal;
  global.countUp = countUp;
  global.updateOfflineIndicator = updateOfflineIndicator;
  global.showUpdateBar = showUpdateBar;
  global.hideUpdateBar = hideUpdateBar;
  global.isMobileViewport = isMobileViewport;
  global.isInstalledPwa = isInstalledPwa;
  global.isMobileWebDownload = isMobileWebDownload;
  global.setAiModelDownloadUiMode = setAiModelDownloadUiMode;
  global.applyAiModelDownloadConsentUiMode = applyAiModelDownloadConsentUiMode;
  global.resolveAiDownloadUiMode = resolveAiDownloadUiMode;
  global.updateAiModelDownloadProgressUI = updateAiModelDownloadProgressUI;
  global.hideAiModelDownloadProgressUI = hideAiModelDownloadProgressUI;
  global.skipAiModelDownloadProgress = skipAiModelDownloadProgress;
  global.applyThemeCrossfade = applyThemeCrossfade;
  global.getTabDirection = getTabDirection;
})(typeof window !== 'undefined' ? window : globalThis);
