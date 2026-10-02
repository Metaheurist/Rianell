/**
 * Cookie consent banner and cookie policy modal.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { Logger } from './logger.js';

// ============================================
// Cookie consent banner and Cookie policy modal
// ============================================
const COOKIE_CONSENT_KEY = 'rianellCookieConsent';

const COOKIE_CONSENT_AT_KEY = 'rianellCookieConsentAcceptedAt';

function showCookieBannerIfNeeded() {
  if (localStorage.getItem(COOKIE_CONSENT_KEY)) return;
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('hidden');
}

function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.add('hidden');
}

function acceptCookieConsent() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_CONSENT_AT_KEY, new Date().toISOString());
  } catch (e) {
    Logger.warn('Could not save cookie consent', { error: String(e) });
  }
  hideCookieBanner();
  closeCookiePolicyModal();
}

var _cookiePolicyModalEscapeHandler = null;

var _cookiePolicyModalFocusTrap = null;

var _cookiePolicyModalPreviousActiveElement = null;

function openCookiePolicyModal() {
  const overlay = document.getElementById('cookiePolicyOverlay');
  const panel = overlay && overlay.querySelector('.modal-content');
  if (!overlay || !panel) return;
  _cookiePolicyModalPreviousActiveElement = document.activeElement;
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function(e) {
    if (e.target === overlay) closeCookiePolicyModal();
  };
  _cookiePolicyModalEscapeHandler = function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', _cookiePolicyModalEscapeHandler);
      _cookiePolicyModalEscapeHandler = null;
      closeCookiePolicyModal();
    }
  };
  document.addEventListener('keydown', _cookiePolicyModalEscapeHandler);
  var focusables = panel.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  var first = focusables[0];
  var last = focusables[focusables.length - 1];
  if (first) first.focus();
  _cookiePolicyModalFocusTrap = function(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        if (last) last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        if (first) first.focus();
      }
    }
  };
  panel.addEventListener('keydown', _cookiePolicyModalFocusTrap);
}

function closeCookiePolicyModal() {
  if (_cookiePolicyModalEscapeHandler) {
    document.removeEventListener('keydown', _cookiePolicyModalEscapeHandler);
    _cookiePolicyModalEscapeHandler = null;
  }
  const overlay = document.getElementById('cookiePolicyOverlay');
  const panel = overlay && overlay.querySelector('.modal-content');
  if (panel && _cookiePolicyModalFocusTrap) {
    panel.removeEventListener('keydown', _cookiePolicyModalFocusTrap);
    _cookiePolicyModalFocusTrap = null;
  }
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
  }
  document.body.classList.remove('modal-active');
  document.body.style.overflow = '';
  if (_cookiePolicyModalPreviousActiveElement && typeof _cookiePolicyModalPreviousActiveElement.focus === 'function') {
    _cookiePolicyModalPreviousActiveElement.focus();
    _cookiePolicyModalPreviousActiveElement = null;
  }
}

export { COOKIE_CONSENT_KEY, COOKIE_CONSENT_AT_KEY, showCookieBannerIfNeeded, acceptCookieConsent, openCookiePolicyModal, closeCookiePolicyModal };
