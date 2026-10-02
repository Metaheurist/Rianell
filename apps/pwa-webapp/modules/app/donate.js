/**
 * Donate modal: PayPal SDK loading, amount chips and thank-you state.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { tUi } from './i18n-theme.js';
import { notifySuccess } from './dom-safety.js';

var _donateModalEscapeHandler = null;

var _paypalDonateButtonsInstance = null;

var _donateAmountChipsBound = false;

function _getPayPalClientId() {
  if (typeof window.__PAYPAL_CLIENT_ID__ === 'string' && window.__PAYPAL_CLIENT_ID__.trim()) {
    return window.__PAYPAL_CLIENT_ID__.trim();
  }
  var m = document.querySelector('meta[name="paypal-client-id"]');
  return m && m.getAttribute('content') ? String(m.getAttribute('content')).trim() : '';
}

function _getPayPalCurrency() {
  var m = document.querySelector('meta[name="paypal-currency"]');
  var c = m && m.getAttribute('content') ? String(m.getAttribute('content')).trim() : 'USD';
  return /^[A-Za-z]{3}$/.test(c) ? c.toUpperCase() : 'USD';
}

function _destroyPaypalDonateButtons() {
  if (_paypalDonateButtonsInstance && typeof _paypalDonateButtonsInstance.close === 'function') {
    try {
      _paypalDonateButtonsInstance.close();
    } catch (e) {}
  }
  _paypalDonateButtonsInstance = null;
  var el = document.getElementById('paypalDonateButtonContainer');
  if (el) el.innerHTML = '';
}

function _loadPayPalSdk(clientId, currency) {
  return new Promise(function (resolve, reject) {
    if (window.paypal) return resolve(window.paypal);
    var existing = document.querySelector('script[data-rianell-paypal-sdk]');
    if (existing) {
      if (window.paypal) return resolve(window.paypal);
      existing.addEventListener('load', function () {
        resolve(window.paypal);
      });
      existing.addEventListener('error', reject);
      return;
    }
    var s = document.createElement('script');
    s.src =
      'https://www.paypal.com/sdk/js?client-id=' +
      encodeURIComponent(clientId) +
      '&currency=' +
      encodeURIComponent(currency) +
      '&intent=capture&components=buttons';
    s.async = true;
    s.setAttribute('data-rianell-paypal-sdk', '1');
    s.onload = function () {
      resolve(window.paypal);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function _bindDonateAmountChips() {
  if (_donateAmountChipsBound) return;
  var wrap = document.getElementById('donatePaypalSdkWrap');
  if (!wrap) return;
  _donateAmountChipsBound = true;
  wrap.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('.donate-amount-chip') : null;
    if (!t) return;
    var a = t.getAttribute('data-amount');
    if (!a) return;
    wrap.querySelectorAll('.donate-amount-chip').forEach(function (c) {
      c.classList.remove('donate-amount-chip--active');
    });
    t.classList.add('donate-amount-chip--active');
    window._rianellDonateAmountUsd = parseFloat(a, 10);
  });
}

function _showDonateThankYou(details) {
  var name =
    details &&
    details.payer &&
    details.payer.name &&
    details.payer.name.given_name
      ? details.payer.name.given_name
      : '';
  notifySuccess(name ? 'Thanks, ' + name + '!' : 'Thank you for your support!');
}

function openDonateModal() {
  const overlay = document.getElementById('donateModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.onclick = function (e) {
    if (e.target === overlay) closeDonateModal();
  };
  _donateModalEscapeHandler = function (e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', _donateModalEscapeHandler);
      _donateModalEscapeHandler = null;
      closeDonateModal();
    }
  };
  document.addEventListener('keydown', _donateModalEscapeHandler);
  var closeBtn = overlay.querySelector('#donateModalCloseBtn') || overlay.querySelector('.modal-close');
  var clientId = _getPayPalClientId();
  var loadingEl = document.getElementById('donatePaypalLoading');
  var sdkWrap = document.getElementById('donatePaypalSdkWrap');
  var fallbackEl = document.getElementById('donatePaypalFallback');
  var hintEl = document.getElementById('donatePaypalFallbackHint');

  if (!clientId) {
    _destroyPaypalDonateButtons();
    if (loadingEl) loadingEl.style.display = 'none';
    if (sdkWrap) sdkWrap.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = '';
    if (hintEl) {
      hintEl.innerHTML =
        'Add your PayPal REST Client ID to the <code>paypal-client-id</code> meta tag (or set <code>window.__PAYPAL_CLIENT_ID__</code>) to enable PayPal, card, Apple Pay, and Google Pay in the app. Until then, use the link below.';
    }
    var primary = fallbackEl && fallbackEl.querySelector('.donate-paypal-btn');
    if (primary && typeof primary.focus === 'function') primary.focus();
    else if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
    return;
  }

  if (fallbackEl) fallbackEl.style.display = 'none';
  if (sdkWrap) sdkWrap.style.display = 'block';
  if (loadingEl) {
    loadingEl.style.display = 'block';
    loadingEl.textContent = tUi('common.loading.payment.options');
  }
  if (hintEl) hintEl.innerHTML = '';

  _bindDonateAmountChips();
  var activeChip = document.querySelector('#donatePaypalSdkWrap .donate-amount-chip--active');
  var initAmt = activeChip && activeChip.getAttribute('data-amount');
  window._rianellDonateAmountUsd = initAmt ? parseFloat(initAmt, 10) : 10;

  _destroyPaypalDonateButtons();
  var curr = _getPayPalCurrency();

  _loadPayPalSdk(clientId, curr)
    .then(function (paypal) {
      if (!document.getElementById('donateModalOverlay')) return;
      var ov = document.getElementById('donateModalOverlay');
      if (ov.style.display === 'none' || ov.style.visibility === 'hidden') return;
      var container = document.getElementById('paypalDonateButtonContainer');
      if (!container || !paypal || !paypal.Buttons) return;

      _paypalDonateButtonsInstance = paypal.Buttons({
        style: {
          layout: 'vertical',
          label: 'donate',
          shape: 'rect',
          color: 'gold'
        },
        createOrder: function (data, actions) {
          var amount = window._rianellDonateAmountUsd;
          if (!isFinite(amount) || amount < 1) amount = 10;
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: curr,
                  value: amount.toFixed(2)
                },
                description: 'Rianell donation'
              }
            ]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            _showDonateThankYou(details);
            closeDonateModal();
          });
        },
        onError: function (err) {
          console.error('PayPal', err);
          var fe = document.getElementById('donatePaypalFallback');
          var he = document.getElementById('donatePaypalFallbackHint');
          var le = document.getElementById('donatePaypalLoading');
          var sw = document.getElementById('donatePaypalSdkWrap');
          if (le) le.style.display = 'none';
          if (sw) sw.style.display = 'none';
          if (fe) fe.style.display = '';
          if (he) {
            he.textContent =
              'Could not start PayPal. Check your connection or try the link below. (Apple Pay / Google Pay also require an eligible PayPal account and domain setup.)';
          }
        }
      });
      return _paypalDonateButtonsInstance.render('#paypalDonateButtonContainer');
    })
    .then(function () {
      var le = document.getElementById('donatePaypalLoading');
      if (le) le.style.display = 'none';
      var chip = document.querySelector('#donatePaypalSdkWrap .donate-amount-chip--active');
      var cb = document.getElementById('donateModalCloseBtn');
      if (chip && typeof chip.focus === 'function') {
        try {
          chip.focus({ preventScroll: true });
        } catch (e) {
          chip.focus();
        }
      } else if (cb && typeof cb.focus === 'function') cb.focus();
    })
    .catch(function (err) {
      console.error('PayPal SDK load failed', err);
      var le = document.getElementById('donatePaypalLoading');
      var sw = document.getElementById('donatePaypalSdkWrap');
      var fe = document.getElementById('donatePaypalFallback');
      var he = document.getElementById('donatePaypalFallbackHint');
      if (le) le.style.display = 'none';
      if (sw) sw.style.display = 'none';
      if (fe) fe.style.display = '';
      if (he) {
        he.textContent =
          'Could not load PayPal. Check Content-Security-Policy allows https://www.paypal.com, or use the link below.';
      }
    });
}

function closeDonateModal() {
  _destroyPaypalDonateButtons();
  if (_donateModalEscapeHandler) {
    document.removeEventListener('keydown', _donateModalEscapeHandler);
    _donateModalEscapeHandler = null;
  }
  const overlay = document.getElementById('donateModalOverlay');
  if (overlay) {
    overlay.onclick = null;
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
  }
  var loadingEl = document.getElementById('donatePaypalLoading');
  if (loadingEl) loadingEl.style.display = 'none';
  var settingsEl = document.getElementById('settingsOverlay');
  var settingsOpen = settingsEl && (
    settingsEl.style.display === 'block' ||
    settingsEl.style.display === 'flex' ||
    settingsEl.classList.contains('settings-overlay--open')
  );
  if (!settingsOpen) {
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

export { openDonateModal, closeDonateModal };
