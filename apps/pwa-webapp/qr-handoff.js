/**
 * Plan 12 CL2 — QR handoff modal (PWA).
 */
(function () {
  'use strict';

  function ensureQrLib() {
    return new Promise(function (resolve, reject) {
      if (typeof window.QRCode !== 'undefined' && typeof window.QRCode.toCanvas === 'function') {
        resolve(window.QRCode);
        return;
      }
      if (window.PerformanceUtils && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
        window.PerformanceUtils.lazyLoadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js')
          .then(function () {
            if (typeof window.QRCode !== 'undefined') resolve(window.QRCode);
            else reject(new Error('QR library failed to load'));
          })
          .catch(reject);
        return;
      }
      reject(new Error('QR library unavailable'));
    });
  }

  async function openQrHandoffModal() {
    var Shared = window.RianellShared;
    if (!Shared || typeof Shared.createQrHandoffPayload !== 'function') {
      if (typeof showToast === 'function') showToast('Handoff module not loaded', { type: 'error' });
      return;
    }
    var passphrase = typeof window.prompt === 'function'
      ? window.prompt('Set a short passphrase for the clinician (min 8 characters):', '')
      : null;
    if (passphrase == null) return;
    if (String(passphrase).length < 8) {
      if (typeof showToast === 'function') showToast('Passphrase must be at least 8 characters', { type: 'error' });
      return;
    }
    var logs = typeof window.getHealthLogsArray === 'function' ? window.getHealthLogsArray() : [];
    try {
      var payload = await Shared.createQrHandoffPayload(logs, String(passphrase), { ttlMinutes: 60 });
      var overlay = document.getElementById('qrHandoffOverlay');
      var canvas = document.getElementById('qrHandoffCanvas');
      var meta = document.getElementById('qrHandoffMeta');
      if (!overlay || !canvas) throw new Error('QR handoff UI missing');
      var QRCode = await ensureQrLib();
      await QRCode.toCanvas(canvas, payload.token, { width: 220, margin: 1 });
      if (meta) {
        meta.textContent = 'Expires ' + payload.expiresAt + ' · ' + payload.logCount + ' log day(s). View-only.';
      }
      overlay.style.display = 'flex';
      overlay.dataset.handoffToken = payload.token;
    } catch (e) {
      var msg = (e && e.message) ? String(e.message) : 'QR handoff failed';
      if (typeof showToast === 'function') showToast(msg, { type: 'error' });
    }
  }

  function closeQrHandoffModal() {
    var overlay = document.getElementById('qrHandoffOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function importQrHandoffFromPrompt() {
    var Shared = window.RianellShared;
    if (!Shared || typeof Shared.decryptQrHandoffToken !== 'function') return;
    var token = typeof window.prompt === 'function' ? window.prompt('Paste handoff code:', '') : null;
    if (!token) return;
    var passphrase = typeof window.prompt === 'function' ? window.prompt('Passphrase:', '') : null;
    if (!passphrase) return;
    try {
      var data = await Shared.decryptQrHandoffToken(token, String(passphrase));
      if (typeof showToast === 'function') {
        showToast('Decrypted ' + (data.logs || []).length + ' log day(s) (view-only)', { type: 'success' });
      }
    } catch (e) {
      var msg = (e && e.message) ? String(e.message) : 'Import failed';
      if (typeof showToast === 'function') showToast(msg, { type: 'error' });
    }
  }

  window.RianellQrHandoff = {
    open: openQrHandoffModal,
    close: closeQrHandoffModal,
    importFromPrompt: importQrHandoffFromPrompt,
  };
})();
