/**
 * Share modal UI (log, chart, AI export actions).
 * Exposes window.openShareModal / window.closeShareModal for app.js callers.
 */
(function (global) {
  'use strict';

  var _escapeHandler = null;

  function tUi(key, params) {
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return key;
  }

  function closeShareModal() {
    if (_escapeHandler) {
      document.removeEventListener('keydown', _escapeHandler);
      _escapeHandler = null;
    }
    var overlay = document.getElementById('shareModalOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      document.body.classList.remove('modal-active');
      document.body.style.overflow = '';
    }
  }

  function openShareModal(options) {
    var overlay = document.getElementById('shareModalOverlay');
    var titleEl = document.getElementById('shareModalTitle');
    var bodyEl = document.getElementById('shareModalBody');
    var footerEl = document.getElementById('shareModalFooter');
    if (!overlay || !bodyEl || !footerEl) return;

    var opts = options || {};
    var mode = opts.mode || 'log';
    var payload = opts.payload || {};

    if (titleEl) titleEl.textContent = opts.title || tUi('common.share');

    // Invariant: bodyHTML must be static or built with escapeHTML at call sites in app.js.
    bodyEl.innerHTML = opts.bodyHTML != null ? opts.bodyHTML : '';
    footerEl.innerHTML = '';

    function addBtn(label, onClick, primary, icon) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'share-modal-btn' + (primary ? ' share-modal-btn-primary' : '');
      if (icon) {
        var span = document.createElement('span');
        span.className = 'share-modal-btn-icon';
        span.innerHTML = icon;
        btn.appendChild(span);
      }
      var textSpan = document.createElement('span');
      textSpan.className = 'share-modal-btn-label';
      textSpan.textContent = label;
      btn.appendChild(textSpan);
      btn.onclick = function () { if (onClick) onClick(); };
      footerEl.appendChild(btn);
    }

    if (mode === 'log') {
      if (payload.emailHref) addBtn('Email', function () { global.location.href = payload.emailHref; }, true, '<i class="fa-solid fa-envelope" aria-hidden="true"></i>');
      if (payload.whatsappHref) addBtn('WhatsApp', function () { global.open(payload.whatsappHref, '_blank', 'noopener,noreferrer'); }, true, '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>');
      if (payload.downloadCSV) addBtn('Download CSV', payload.downloadCSV, true, '<i class="fa-solid fa-file-csv" aria-hidden="true"></i>');
    } else if (mode === 'chart') {
      if (payload.saveImage) addBtn('Save image', payload.saveImage, true, '<i class="fa-solid fa-file-image" aria-hidden="true"></i>');
      if (payload.savePdf) addBtn('Save PDF', payload.savePdf, true, '<i class="fa-solid fa-file-pdf" aria-hidden="true"></i>');
      if (payload.shareToWhatsApp) addBtn('WhatsApp', payload.shareToWhatsApp, true, '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>');
    } else if (mode === 'ai') {
      if (payload.copyText) {
        addBtn('Copy', function () {
          navigator.clipboard.writeText(payload.copyText).then(function () {
            if (typeof global.showAlertModal === 'function') global.showAlertModal(tUi('common.copied.to.clipboard.you.can.paste.into.e'), tUi('common.copied'));
          }).catch(function () {
            if (typeof global.showAlertModal === 'function') global.showAlertModal(tUi('common.could.not.copy.use.email.or.whatsapp.ins'), tUi('common.copy.failed'));
          });
        }, true, '<i class="fa-solid fa-copy" aria-hidden="true"></i>');
        if (payload.copyMarkdown) {
          addBtn('Copy as Markdown', function () {
            navigator.clipboard.writeText(payload.copyMarkdown).then(function () {
              if (typeof global.showAlertModal === 'function') global.showAlertModal(tUi('common.markdown.version.copied.to.clipboard'), tUi('common.copied'));
            }).catch(function () {});
          }, false, '<i class="fa-solid fa-code" aria-hidden="true"></i>');
        }
      }
      if (payload.emailHref) addBtn('Email', function () { global.location.href = payload.emailHref; }, true, '<i class="fa-solid fa-envelope" aria-hidden="true"></i>');
      if (payload.whatsappHref) addBtn('WhatsApp', function () { global.open(payload.whatsappHref, '_blank', 'noopener,noreferrer'); }, true, '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>');
    }

    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.classList.add('modal-active');
    document.body.style.overflow = 'hidden';

    _escapeHandler = function (e) {
      if (e.key === 'Escape') {
        closeShareModal();
        document.removeEventListener('keydown', _escapeHandler);
        _escapeHandler = null;
      }
    };
    document.addEventListener('keydown', _escapeHandler);
    overlay.onclick = function (e) {
      if (e.target === overlay) closeShareModal();
    };
  }

  global.openShareModal = openShareModal;
  global.closeShareModal = closeShareModal;
  global.RianellShareModal = { openShareModal: openShareModal, closeShareModal: closeShareModal };
})(typeof window !== 'undefined' ? window : globalThis);
