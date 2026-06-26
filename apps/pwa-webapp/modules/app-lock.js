(function (global) {
  'use strict';
  var S = global.RianellShared || {};
  var STORAGE_KEY = 'rianellAppLockEnvelope';
  var PIN_MIN = 4;
  var PIN_MAX = 8;

  var locked = false;
  var unlockedThisPage = false;
  var listenersBound = false;
  var _appLockTrapHandler = null;
  var _appLockPreviousActive = null;
  var _currentPin = '';
  var _setupPin = '';
  var _setupPinConfirm = '';
  var _setupConfirmStep = false;
  var _unlockMode = 'pin';

  function t(key) {
    if (typeof global.tUi === 'function') return global.tUi(key);
    return key;
  }

  function getAppLockMode() {
    if (global.appSettings && global.appSettings.appLockMode === 'passphrase') return 'passphrase';
    return 'pin';
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

  function isWeakPin(pin) {
    if (S && typeof S.isWeakPin === 'function') return S.isWeakPin(pin);
    if (!pin || pin.length < PIN_MIN) return true;
    if (!/^\d+$/.test(pin)) return true;
    if (/^(\d)\1+$/.test(pin)) return true;
    var digits = pin.split('').map(Number);
    var asc = digits.every(function (d, i) { return i === 0 || d === digits[i - 1] + 1; });
    var desc = digits.every(function (d, i) { return i === 0 || d === digits[i - 1] - 1; });
    return asc || desc;
  }

  function updatePinDots(containerId, filled, total) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('span');
      dot.className = 'pin-dot' + (i < filled ? ' pin-dot--filled' : '');
      el.appendChild(dot);
    }
  }

  function syncUnlockUi() {
    var mode = _unlockMode;
    var pinUi = document.getElementById('appLockPinUi');
    var passUi = document.getElementById('appLockPassphraseUi');
    var switchBtn = document.getElementById('pinSwitchModeBtn');
    var lead = document.getElementById('appLockLead');
    if (pinUi) pinUi.style.display = mode === 'pin' ? '' : 'none';
    if (passUi) passUi.style.display = mode === 'passphrase' ? '' : 'none';
    if (lead) {
      lead.textContent = mode === 'pin'
        ? t('settings.privacy.appLock.pinLead')
        : t('settings.privacy.appLock.lead');
    }
    if (switchBtn) {
      switchBtn.textContent = mode === 'pin'
        ? t('settings.security.usePassphraseInstead')
        : t('settings.security.usePinInstead');
    }
    if (mode === 'pin') {
      _currentPin = '';
      updatePinDots('pinDots', 0, PIN_MAX);
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

  function showLockOverlay() {
    if (!shouldLock()) {
      hideLockOverlay();
      return;
    }
    var el = document.getElementById('appLockOverlay');
    if (!el) return;
    _unlockMode = getAppLockMode();
    syncUnlockUi();
    el.style.display = 'flex';
    el.style.opacity = '1';
    el.classList.add('modal-overlay--open');
    if (document.body) document.body.classList.add('modal-active', 'app-lock-active');
    setShellLocked(true);
    locked = true;
    _appLockPreviousActive = document.activeElement;
    bindAppLockFocusTrap();
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
    _currentPin = '';
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
    var passInput = document.getElementById('appLockPassphraseInput');
    if (passInput && !passInput.__rianellBound) {
      passInput.__rianellBound = true;
      passInput.addEventListener('keydown', function (e) {
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
    var passcode = '';
    if (_unlockMode === 'pin') {
      passcode = _currentPin;
      if (passcode.length < PIN_MIN) {
        if (typeof global.showToast === 'function') global.showToast(t('settings.security.pinTooShort'), 'error');
        return false;
      }
    } else {
      var passInput = document.getElementById('appLockPassphraseInput');
      passcode = passInput && passInput.value ? passInput.value : '';
      if (passcode.length < 12) {
        if (typeof global.showAlertModal === 'function') {
          global.showAlertModal(t('settings.export.encrypted.placeholder'), t('settings.privacy.appLock.title'));
        }
        return false;
      }
    }
    var ok = await verifyPasscode(passcode, stored);
    if (ok) {
      _currentPin = '';
      var passInput2 = document.getElementById('appLockPassphraseInput');
      if (passInput2) passInput2.value = '';
      unlockedThisPage = true;
      hideLockOverlay();
      return true;
    }
    _currentPin = '';
    updatePinDots('pinDots', 0, PIN_MAX);
    var passInput3 = document.getElementById('appLockPassphraseInput');
    if (passInput3) passInput3.value = '';
    if (typeof global.showToast === 'function') {
      global.showToast(t('settings.privacy.appLock.failed'), 'error');
    } else if (typeof global.showAlertModal === 'function') {
      global.showAlertModal(t('settings.privacy.appLock.failed'), t('settings.privacy.appLock.title'));
    }
    return false;
  }

  async function submitPin() {
    if (_currentPin.length < PIN_MIN) return;
    await tryUnlockFromPrompt();
  }

  function keypadPress(key) {
    if (key === 'del') {
      _currentPin = _currentPin.slice(0, -1);
    } else if (key === 'ok') {
      void submitPin();
      return;
    } else if (_currentPin.length < PIN_MAX) {
      _currentPin += key;
    }
    updatePinDots('pinDots', _currentPin.length, PIN_MAX);
    var hidden = document.getElementById('appLockPinInput');
    if (hidden) hidden.value = _currentPin;
    if (_currentPin.length === PIN_MAX) {
      setTimeout(function () { void submitPin(); }, 80);
    }
  }

  function switchUnlockMode() {
    _unlockMode = _unlockMode === 'pin' ? 'passphrase' : 'pin';
    syncUnlockUi();
    if (_unlockMode === 'passphrase') {
      var passInput = document.getElementById('appLockPassphraseInput');
      if (passInput) passInput.focus();
    }
  }

  function resetSetupPinState() {
    _setupPin = '';
    _setupPinConfirm = '';
    _setupConfirmStep = false;
    updatePinDots('appLockSetupPinDots', 0, PIN_MAX);
  }

  function setupKeypadPress(key) {
    if (key === 'del') {
      if (_setupConfirmStep) _setupPinConfirm = _setupPinConfirm.slice(0, -1);
      else _setupPin = _setupPin.slice(0, -1);
    } else if (key === 'ok') {
      if (!_setupConfirmStep) {
        if (_setupPin.length < PIN_MIN) return;
        if (isWeakPin(_setupPin)) {
          if (typeof global.showAlertModal === 'function') {
            global.showAlertModal(t('settings.security.pinTooWeak'), t('settings.security.title'));
          }
          _setupPin = '';
          updatePinDots('appLockSetupPinDots', 0, PIN_MAX);
          return;
        }
        _setupConfirmStep = true;
        updatePinDots('appLockSetupPinDots', 0, PIN_MAX);
        return;
      }
      if (_setupPinConfirm !== _setupPin) {
        if (typeof global.showAlertModal === 'function') {
          global.showAlertModal(t('settings.privacy.appLock.mismatch'), t('settings.security.title'));
        }
        _setupPinConfirm = '';
        _setupConfirmStep = false;
        _setupPin = '';
        updatePinDots('appLockSetupPinDots', 0, PIN_MAX);
        return;
      }
      if (typeof global.saveAppLockPasscodeFromPin === 'function') {
        global.saveAppLockPasscodeFromPin(_setupPin);
      }
      resetSetupPinState();
      return;
    } else {
      if (_setupConfirmStep) {
        if (_setupPinConfirm.length < PIN_MAX) _setupPinConfirm += key;
      } else if (_setupPin.length < PIN_MAX) {
        _setupPin += key;
      }
    }
    var filled = _setupConfirmStep ? _setupPinConfirm.length : _setupPin.length;
    updatePinDots('appLockSetupPinDots', filled, PIN_MAX);
    if (!_setupConfirmStep && _setupPin.length === PIN_MAX) {
      setTimeout(function () { setupKeypadPress('ok'); }, 80);
    } else if (_setupConfirmStep && _setupPinConfirm.length === PIN_MAX) {
      setTimeout(function () { setupKeypadPress('ok'); }, 80);
    }
  }

  function getSetupPin() {
    return _setupPin;
  }

  async function enableAppLock(passcode, mode) {
    var lockMode = mode || (passcode && /^\d+$/.test(passcode) && passcode.length <= PIN_MAX ? 'pin' : 'passphrase');
    if (lockMode === 'pin') {
      if (typeof passcode !== 'string' || passcode.length < PIN_MIN || passcode.length > PIN_MAX) {
        throw new Error('PIN must be 4-8 digits');
      }
      if (isWeakPin(passcode)) throw new Error('PIN is too easy to guess');
    } else if (typeof passcode !== 'string' || passcode.length < 12) {
      throw new Error('Passphrase must be at least 12 characters');
    }
    if (!S.encryptExportWithPassphrase) throw new Error('Crypto helpers unavailable');
    var envelope = await S.encryptExportWithPassphrase({ pinCheck: 'ok' }, passcode);
    writeStored(envelope);
    if (global.appSettings) {
      global.appSettings.appLockEnabled = true;
      global.appSettings.appLockMode = lockMode;
    }
    if (typeof global.saveSettings === 'function') global.saveSettings();
    unlockedThisPage = true;
    hideLockOverlay();
  }

  async function disableAppLock() {
    localStorage.removeItem(STORAGE_KEY);
    if (global.appSettings) {
      global.appSettings.appLockEnabled = false;
      delete global.appSettings.appLockMode;
    }
    if (typeof global.saveSettings === 'function') global.saveSettings();
    unlockedThisPage = false;
    hideLockOverlay();
    resetSetupPinState();
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
    keypadPress: keypadPress,
    setupKeypadPress: setupKeypadPress,
    switchUnlockMode: switchUnlockMode,
    resetSetupPinState: resetSetupPinState,
    getSetupPin: getSetupPin,
    PIN_MIN: PIN_MIN,
    PIN_MAX: PIN_MAX,
  };
})(typeof window !== 'undefined' ? window : globalThis);
