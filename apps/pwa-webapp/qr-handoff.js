/**
 * Plan 12 CL2 - QR handoff modal (PWA).
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

  async function generateQrWithPassphrase(passphrase) {
    var Shared = window.RianellShared;
    var logs = typeof window.getHealthLogsArray === 'function' ? window.getHealthLogsArray() : [];
    try {
      var payload = await Shared.createQrHandoffPayload(logs, String(passphrase), { ttlMinutes: 60 });
      var overlay = document.getElementById('qrHandoffOverlay');
      var canvas  = document.getElementById('qrHandoffCanvas');
      var meta    = document.getElementById('qrHandoffMeta');
      if (!overlay || !canvas) throw new Error('QR handoff UI elements missing from page');
      var QRCode = await ensureQrLib();
      await QRCode.toCanvas(canvas, payload.token, { width: 220, margin: 1 });
      if (meta) {
        meta.textContent = 'Expires ' + payload.expiresAt + ' · ' + payload.logCount + ' log day(s). View-only.';
      }
      if (typeof openModalOverlay === 'function') {
        openModalOverlay(overlay, { onEscape: closeQrHandoffModal });
      } else {
        overlay.style.display = 'flex';
      }
      overlay.dataset.handoffToken = payload.token;
    } catch (e) {
      var msg = e
        ? (e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
        : 'QR handoff failed';
      console.error('[QR handoff]', e);
      if (typeof showToast === 'function') showToast(msg || 'QR handoff failed', { type: 'error' });
    }
  }

  function openQrHandoffModal() {
    var Shared = window.RianellShared;
    if (!Shared || typeof Shared.createQrHandoffPayload !== 'function') {
      if (typeof showToast === 'function') showToast('Handoff module not loaded', { type: 'error' });
      return;
    }
    if (typeof closeSettingsModalIfOpen === 'function') closeSettingsModalIfOpen();
    if (typeof window.showTextPromptModal === 'function') {
      window.showTextPromptModal(
        {
          title: 'Clinician passphrase',
          hint: 'Set a passphrase for the clinician to decrypt the QR (min 12 characters).',
          placeholder: 'Passphrase (min 12 characters)',
          type: 'password',
          submitLabel: 'Generate QR',
          minLength: 12,
        },
        function (passphrase) { generateQrWithPassphrase(passphrase); }
      );
    } else {
      var passphrase = window.prompt('Set a passphrase for the clinician (min 12 characters):', '');
      if (passphrase == null) return;
      if (String(passphrase).length < 12) {
        if (typeof showToast === 'function') showToast('Passphrase must be at least 12 characters', { type: 'error' });
        return;
      }
      generateQrWithPassphrase(passphrase);
    }
  }

  function closeQrHandoffModal() {
    var overlay = document.getElementById('qrHandoffOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function importQrHandoffFromPrompt() {
    var Shared = window.RianellShared;
    if (!Shared || typeof Shared.decryptQrHandoffToken !== 'function') return;

    if (typeof window.showTextPromptModal !== 'function') {
      var token = window.prompt('Paste handoff code:', '');
      if (!token) return;
      var pass = window.prompt('Passphrase:', '');
      if (!pass) return;
      Shared.decryptQrHandoffToken(token, String(pass)).then(function (data) {
        if (typeof showToast === 'function') showToast('Decrypted ' + (data.logs || []).length + ' log day(s) (view-only)', { type: 'success' });
      }).catch(function (e) {
        if (typeof showToast === 'function') showToast((e && e.message) || 'Import failed', { type: 'error' });
      });
      return;
    }

    window.showTextPromptModal(
      {
        title: 'Paste handoff code',
        hint: 'Paste the handoff token provided by the clinician.',
        placeholder: 'Handoff token',
        type: 'text',
        submitLabel: 'Next',
      },
      function (token) {
        if (!token) return;
        window.showTextPromptModal(
          {
            title: 'Enter passphrase',
            hint: 'Enter the passphrase set when the QR was generated.',
            placeholder: 'Passphrase',
            type: 'password',
            submitLabel: 'Decrypt',
          },
          function (passphrase) {
            if (!passphrase) return;
            Shared.decryptQrHandoffToken(token, String(passphrase))
              .then(function (data) {
                if (typeof showToast === 'function') showToast('Decrypted ' + (data.logs || []).length + ' log day(s) (view-only)', { type: 'success' });
              })
              .catch(function (e) {
                var msg = (e && e.message) ? String(e.message) : 'Import failed';
                if (typeof showToast === 'function') showToast(msg, { type: 'error' });
              });
          }
        );
      }
    );
  }

  window.RianellQrHandoff = {
    open: openQrHandoffModal,
    close: closeQrHandoffModal,
    importFromPrompt: importQrHandoffFromPrompt,
  };
})();
