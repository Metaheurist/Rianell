(function (global) {
  'use strict';
  var S = global.RianellShared || {};
  var STORAGE_KEY = 'rianellAppLockEnvelope';

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

  async function verifyPasscode(passcode, stored) {
    if (!stored || !S.decryptExportWithPassphrase) return false;
    try {
      var out = await S.decryptExportWithPassphrase(stored, passcode);
      return out && out.pinCheck === 'ok';
    } catch (e) {
      return false;
    }
  }

  var locked = false;

  function showLockOverlay() {
    var el = document.getElementById('appLockOverlay');
    if (el) el.style.display = 'flex';
    locked = true;
  }

  function hideLockOverlay() {
    var el = document.getElementById('appLockOverlay');
    if (el) el.style.display = 'none';
    locked = false;
  }

  async function tryUnlockFromPrompt() {
    var stored = readStored();
    if (!stored) {
      hideLockOverlay();
      return true;
    }
    var input = document.getElementById('appLockPinInput');
    var passcode = input && input.value ? input.value : '';
    if (passcode.length < 8) return false;
    var ok = await verifyPasscode(passcode, stored);
    if (ok) {
      if (input) input.value = '';
      hideLockOverlay();
      return true;
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
  }

  async function disableAppLock() {
    localStorage.removeItem(STORAGE_KEY);
    if (global.appSettings) global.appSettings.appLockEnabled = false;
    if (typeof global.saveSettings === 'function') global.saveSettings();
    hideLockOverlay();
  }

  function bindAppLock() {
    if (!global.appSettings || !global.appSettings.appLockEnabled) {
      hideLockOverlay();
      return;
    }
    if (!readStored()) {
      hideLockOverlay();
      return;
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') showLockOverlay();
      if (document.visibilityState === 'visible' && locked) showLockOverlay();
    });
    var btn = document.getElementById('appLockUnlockBtn');
    if (btn && !btn.__rianellBound) {
      btn.__rianellBound = true;
      btn.addEventListener('click', function () {
        void tryUnlockFromPrompt();
      });
    }
  }

  global.RianellAppLock = {
    enableAppLock: enableAppLock,
    disableAppLock: disableAppLock,
    bindAppLock: bindAppLock,
    showLockOverlay: showLockOverlay,
  };
})(typeof window !== 'undefined' ? window : globalThis);
