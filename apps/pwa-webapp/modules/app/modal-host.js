/**
 * Shared alert and confirm modals (alertModalOverlay) and the settings-modal close helper. Settings internals are injected via registerSettingsModalHooks because app.js assigns them after installSettingsModule.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { tUi } from './i18n-theme.js';
import { Logger } from './logger.js';
import { escapeHTML } from './dom-safety.js';

// ============================================
// Helper: Close Settings Modal
// ============================================
const settingsModalHooks = { captureCarouselState: null, overlaySetOpen: null, toggleSettings: null };

function registerSettingsModalHooks(hooks) {
  Object.assign(settingsModalHooks, hooks);
}

function closeSettingsModalIfOpen() {
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (!settingsOverlay) return;
  const isOpen = settingsOverlay.classList.contains('settings-overlay--open') ||
    settingsOverlay.dataset.settingsState === 'opening' ||
    settingsOverlay.dataset.settingsState === 'closing';
  if (!isOpen) return;
  const captureSettingsModalCarouselState = settingsModalHooks.captureCarouselState;
  const settingsOverlaySetOpen = settingsModalHooks.overlaySetOpen;
  const toggleSettings = settingsModalHooks.toggleSettings;
  if (typeof captureSettingsModalCarouselState === 'function') captureSettingsModalCarouselState(settingsOverlay);
  else {
    const settingsContent = settingsOverlay.querySelector('.settings-content');
    if (settingsContent) window.settingsModalScrollPosition = settingsContent.scrollTop;
  }
  const conditionSelector = document.getElementById('medicalConditionSelector');
  if (conditionSelector) window.settingsModalConditionSelectorOpen = conditionSelector.style.display !== 'none';
  if (typeof window.closeSettings === 'function') {
    window.closeSettings();
  } else if (typeof toggleSettings === 'function') {
    toggleSettings();
  } else {
    if (typeof settingsOverlaySetOpen === 'function') settingsOverlaySetOpen(settingsOverlay, false);
    else {
      settingsOverlay.style.display = 'none';
      settingsOverlay.style.visibility = 'hidden';
      document.body.classList.remove('modal-active');
    }
  }
}

// ============================================
// Custom Alert Modal
// ============================================
const ALERT_HTML_ALLOWED_TAGS = new Set([
  'section', 'div', 'p', 'span', 'h3', 'h4', 'h5', 'strong', 'em', 'b', 'i', 'small', 'br', 'ul', 'ol', 'li'
]);
const ALERT_HTML_ALLOWED_ATTRS = new Set(['class', 'style', 'role']);

function parseInertHtml(html) {
  return new DOMParser().parseFromString(String(html == null ? '' : html), 'text/html');
}

function copyAllowedAlertNodes(source, target) {
  source.childNodes.forEach(function(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(node.nodeValue));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (!ALERT_HTML_ALLOWED_TAGS.has(tag)) {
      if (tag !== 'script' && tag !== 'style' && tag !== 'template') copyAllowedAlertNodes(node, target);
      return;
    }
    const el = document.createElement(tag);
    Array.from(node.attributes).forEach(function(attr) {
      const name = attr.name.toLowerCase();
      if (ALERT_HTML_ALLOWED_ATTRS.has(name) || /^aria-[a-z-]+$/.test(name)) {
        el.setAttribute(name, attr.value);
      }
    });
    copyAllowedAlertNodes(node, el);
    target.appendChild(el);
  });
}

function sanitizeAlertHtml(html) {
  const fragment = document.createDocumentFragment();
  copyAllowedAlertNodes(parseInertHtml(html).body, fragment);
  return fragment;
}

function showAlertModal(message, title, onClose, options) {
  if (title === undefined || title === 'Alert') title = tUi('common.alert');
  const overlay = document.getElementById('alertModalOverlay');
  const titleEl = document.getElementById('alertModalTitle');
  const messageEl = document.getElementById('alertModalMessage');
  const opts = options && typeof options === 'object' ? options : {};
  const useHtml = opts.html === true;
  const iconId = typeof opts.icon === 'string' && opts.icon ? opts.icon : '';
  
  if (!overlay || !titleEl || !messageEl) {
    // Fallback to native alert if modal elements not found
    Logger.warn('Alert modal elements not found, using native alert');
    alert(useHtml ? parseInertHtml(message).body.textContent : message);
    if (typeof onClose === 'function') onClose();
    return;
  }
  
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  // Set content
  titleEl.textContent = title;
  messageEl.classList.remove('alert-modal-message--html', 'alert-modal-message--icon');
  messageEl.classList.toggle('alert-modal-message--html', useHtml);
  messageEl.classList.toggle('alert-modal-message--icon', !!iconId && !useHtml);
  if (iconId && !useHtml) {
    messageEl.innerHTML =
      '<span class="alert-modal-message-with-icon">' +
      '<svg class="ui-svg-icon alert-modal-icon" aria-hidden="true"><use href="#' + iconId + '"></use></svg>' +
      '<span class="alert-modal-message-text"></span></span>';
    const textEl = messageEl.querySelector('.alert-modal-message-text');
    if (textEl) textEl.textContent = message;
  } else if (useHtml) {
    // Invariant: opts.html is only for app-authored markup (e.g. formatReviewMetric bars).
    // Never pass user-derived or i18n strings here without escapeHTML first.
    messageEl.replaceChildren(sanitizeAlertHtml(message));
  } else {
    messageEl.textContent = message;
  }
  
  // OK button: optional callback then close
  const okBtn = overlay.querySelector('.modal-save-btn');
  if (okBtn) {
    okBtn.onclick = function() {
      if (typeof onClose === 'function') onClose();
      closeAlertModal();
    };
  }
  
  // Show modal
  if (typeof window.openModalOverlay === 'function') {
    window.openModalOverlay(overlay, {
      onEscape: closeAlertModal,
      initialFocusSelector: '.modal-save-btn'
    });
  } else {
    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.classList.add('modal-active');
  }
  overlay.style.zIndex = '100001';
  
  // Centre modal
  const modalContent = overlay.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.margin = '0';
    modalContent.style.padding = '0';
    modalContent.style.zIndex = '100002'; // Higher than alert overlay
  }
  
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      if (typeof onClose === 'function') onClose();
      closeAlertModal();
    }
  };
  
  // Close on Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      if (typeof onClose === 'function') onClose();
      closeAlertModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function closeAlertModal() {
  const overlay = document.getElementById('alertModalOverlay');
  if (!overlay) return;
  if (typeof window.closeModalOverlay === 'function') {
    window.closeModalOverlay(overlay);
    return;
  }
  overlay.style.display = 'none';
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
}

// Show confirmation modal with Yes/No buttons
function showConfirmModal(message, title = tUi('common.confirm'), onConfirm, onCancel, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const confirmText = typeof opts.confirmText === 'string' ? opts.confirmText : 'Yes, Continue';
  const cancelText = typeof opts.cancelText === 'string' ? opts.cancelText : 'Cancel';
  const overlay = document.getElementById('alertModalOverlay');
  const titleEl = document.getElementById('alertModalTitle');
  const messageEl = document.getElementById('alertModalMessage');
  const footer = overlay?.querySelector('.alert-modal-footer');
  
  if (!overlay || !titleEl || !messageEl || !footer) {
    // Fallback to native confirm if modal elements not found
    Logger.warn('Alert modal elements not found, using native confirm');
    if (confirm(message)) {
      if (onConfirm) onConfirm();
    } else {
      if (onCancel) onCancel();
    }
    return;
  }
  
  // Close settings modal if open
  closeSettingsModalIfOpen();
  
  // Set content
  titleEl.textContent = title;
  messageEl.classList.remove('alert-modal-message--html', 'alert-modal-message--icon');
  messageEl.textContent = message;
  
  // Update footer with Yes/No buttons
  footer.innerHTML = `
    <button class="modal-save-btn modal-danger-btn" id="confirmYesBtn">${escapeHTML(confirmText)}</button>
    <button class="modal-save-btn modal-cancel-btn" id="confirmNoBtn">${escapeHTML(cancelText)}</button>
  `;
  
  // Show modal
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.style.zIndex = '100001';
  document.body.classList.add('modal-active');
  
  // Centre modal
  const modalContent = overlay.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.margin = '0';
    modalContent.style.padding = '0';
    modalContent.style.zIndex = '100002';
  }
  
  // Set up button handlers
  const yesBtn = document.getElementById('confirmYesBtn');
  const noBtn = document.getElementById('confirmNoBtn');
  
  const cleanup = () => {
    closeAlertModal();
    // Restore original OK button
    footer.innerHTML = '<button class="modal-save-btn" onclick="closeAlertModal()">OK</button>';
  };
  
  if (yesBtn) {
    yesBtn.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };
  }
  
  if (noBtn) {
    noBtn.onclick = () => {
      cleanup();
      if (onCancel) onCancel();
    };
  }
  
  // Close on overlay click (treat as cancel)
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      cleanup();
      if (onCancel) onCancel();
    }
  };
  
  // Close on Escape key (treat as cancel)
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', escapeHandler);
      if (onCancel) onCancel();
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

export { registerSettingsModalHooks, closeSettingsModalIfOpen, showAlertModal, closeAlertModal, showConfirmModal };
