(function (global) {
  'use strict';
  var S = global.RianellShared || {};
  var STORAGE_KEY = 'rianellAppLockEnvelope';

  var locked = false;
  var unlockedThisPage = false;
  var listenersBound = false;
  var _appLockTrapHandler = null;
  var _appLockPreviousActive = null;

  function getAppLockFocusable() {
    var overlay = document.getElementById('appLockOverlay');
    if (!overlay || overlay.style.display === 'none') return [];
    var sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(overlay.querySelectorAll(sel), function (el) {
      return el.offsetParent !== null;
    });
  }

  function removeAppLockTrap() {
    if (_appLockTrapHandler) {
      document.removeEventListener('keydown', _appLockTrapHandler);
      _appLockTrapHandler = null;
    }
  }

  function bindAppLockFocusTrap() {
    removeAppLockTrap();
    _appLockTrapHandler = function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        return;
      }
      if (e.key !== 'Tab') return;
      var focusable = getAppLockFocusable();
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', _appLockTrapHandler);
  }

  function t(key) {
    if (typeof global.tUi === 'function') return global.tUi(key);
    return key;
  }

  function readStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeStored(envelope) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  }

  function shouldLock() {
    return !!(global.appSettings && global.appSettings.appLockEnabled && readStored());
  }

  async function verifyPasscode(passcode, stored) {
    if (!stored || !S.decryptExportWithPassphrase) return false;
    try {
      var out = await S.decryptExportWithPassphrase(stored, passcode);
      return out && out.pinCheck === 'ok';
    } catch (e) {
      return false;
    }
  }

  function setShellLocked(isLocked) {
    var shell = document.getElementById('appShell');
    var fab = document.getElementById('appFabWrap');
    [shell, fab].forEach(function (el) {
      if (!el) return;
      if (isLocked) {
        try { el.setAttribute('inert', ''); } catch (e) { /* ignore */ }
        el.setAttribute('aria-hidden', 'true');
      } else {
        try { el.removeAttribute('inert'); } catch (e2) { /* ignore */ }
        el.removeAttribute('aria-hidden');
      }
    });
  }

  function showLockOverlay() {
    if (!shouldLock()) {
      hideLockOverlay();
      return;
    }
    var el = document.getElementById('appLockOverlay');
    if (!el) return;
    el.style.display = 'flex';
    el.style.opacity = '1';
    el.classList.add('modal-overlay--open');
    if (document.body) document.body.classList.add('modal-active', 'app-lock-active');
    setShellLocked(true);
    locked = true;
    _appLockPreviousActive = document.activeElement;
    bindAppLockFocusTrap();
    var input = document.getElementById('appLockPinInput');
    if (input) {
      input.value = '';
      setTimeout(function () {
        try { input.focus(); } catch (e) { /* ignore */ }
      }, 60);
    }
  }

  function hideLockOverlay() {
    removeAppLockTrap();
    var el = document.getElementById('appLockOverlay');
    if (el) {
      el.style.display = 'none';
      el.style.opacity = '';
      el.classList.remove('modal-overlay--open');
    }
    if (document.body) {
      document.body.classList.remove('app-lock-active');
      if (!document.querySelector('.modal-overlay--open, .settings-overlay--open')) {
        document.body.classList.remove('modal-active');
      }
    }
    setShellLocked(false);
    locked = false;
    if (_appLockPreviousActive && typeof _appLockPreviousActive.focus === 'function') {
      try { _appLockPreviousActive.focus(); } catch (e) { /* ignore */ }
      _appLockPreviousActive = null;
    }
  }

  function armLockOnResume() {
    if (!shouldLock()) return;
    unlockedThisPage = false;
    showLockOverlay();
  }

  function onVisibilityChange() {
    if (!shouldLock()) return;
    if (document.visibilityState === 'hidden') {
      armLockOnResume();
      return;
    }
    if (document.visibilityState === 'visible' && !unlockedThisPage) {
      showLockOverlay();
    }
  }

  function onPageHide() {
    if (!shouldLock()) return;
    unlockedThisPage = false;
  }

  function onPageShow(ev) {
    if (!shouldLock()) return;
    if (!unlockedThisPage || (ev && ev.persisted)) {
      showLockOverlay();
    }
  }

  function onWindowBlur() {
    if (!shouldLock()) return;
    window.setTimeout(function () {
      if (!shouldLock()) return;
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        unlockedThisPage = false;
        showLockOverlay();
      }
    }, 0);
  }

  function bindUnlockUi() {
    var btn = document.getElementById('appLockUnlockBtn');
    if (btn && !btn.__rianellBound) {
      btn.__rianellBound = true;
      btn.addEventListener('click', function () {
        void tryUnlockFromPrompt();
      });
    }
    var input = document.getElementById('appLockPinInput');
    if (input && !input.__rianellBound) {
      input.__rianellBound = true;
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          void tryUnlockFromPrompt();
        }
      });
    }
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('blur', onWindowBlur);
    bindUnlockUi();
  }

  async function tryUnlockFromPrompt() {
    var stored = readStored();
    if (!stored) {
      hideLockOverlay();
      return true;
    }
    var input = document.getElementById('appLockPinInput');
    var passcode = input && input.value ? input.value : '';
    if (passcode.length < 8) {
      if (typeof global.showAlertModal === 'function') {
        global.showAlertModal(t('settings.privacy.appLock.setupPrompt'), t('settings.privacy.appLock.title'));
      }
      return false;
    }
    var ok = await verifyPasscode(passcode, stored);
    if (ok) {
      if (input) input.value = '';
      unlockedThisPage = true;
      hideLockOverlay();
      return true;
    }
    if (input) input.value = '';
    if (typeof global.showToast === 'function') {
      global.showToast(t('settings.privacy.appLock.failed'), 'error');
    } else if (typeof global.showAlertModal === 'function') {
      global.showAlertModal(t('settings.privacy.appLock.failed'), t('settings.privacy.appLock.title'));
    }
    return false;
  }

  async function enableAppLock(passcode) {
    if (typeof passcode !== 'string' || passcode.length < 8) {
      throw new Error('Passcode must be at least 8 characters');
    }
    if (!S.encryptExportWithPassphrase) throw new Error('Crypto helpers unavailable');
    var envelope = await S.encryptExportWithPassphrase({ pinCheck: 'ok' }, passcode);
    writeStored(envelope);
    if (global.appSettings) global.appSettings.appLockEnabled = true;
    if (typeof global.saveSettings === 'function') global.saveSettings();
    unlockedThisPage = true;
    hideLockOverlay();
  }

  async function disableAppLock() {
    localStorage.removeItem(STORAGE_KEY);
    if (global.appSettings) global.appSettings.appLockEnabled = false;
    if (typeof global.saveSettings === 'function') global.saveSettings();
    unlockedThisPage = false;
    hideLockOverlay();
  }

  function bindAppLock() {
    bindListeners();
    if (!shouldLock()) {
      hideLockOverlay();
      return;
    }
    if (!unlockedThisPage) {
      showLockOverlay();
    }
  }

  global.RianellAppLock = {
    enableAppLock: enableAppLock,
    disableAppLock: disableAppLock,
    bindAppLock: bindAppLock,
    showLockOverlay: showLockOverlay,
    hideLockOverlay: hideLockOverlay,
    isLocked: function () { return locked; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
