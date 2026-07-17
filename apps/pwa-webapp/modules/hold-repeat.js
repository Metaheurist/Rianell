/**
 * Hold-to-repeat for +/− stepper / drum nudge buttons.
 * Fires once on press, then repeats after a short delay while held.
 */
(function (global) {
  'use strict';

  var DEFAULT_DELAY_MS = 380;
  var DEFAULT_INTERVAL_MS = 70;

  /**
   * @param {Element} el
   * @param {function(): void} action
   * @param {{ delayMs?: number, intervalMs?: number }=} opts
   * @returns {function(): void} unbind
   */
  function bind(el, action, opts) {
    if (!el || typeof action !== 'function') return function () {};
    if (el.dataset.holdRepeatBound === '1') return function () {};
    el.dataset.holdRepeatBound = '1';

    var delayMs = (opts && opts.delayMs) || DEFAULT_DELAY_MS;
    var intervalMs = (opts && opts.intervalMs) || DEFAULT_INTERVAL_MS;
    var delayTimer = null;
    var intervalTimer = null;
    var activePointerId = null;

    function clearTimers() {
      if (delayTimer != null) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }
      if (intervalTimer != null) {
        clearInterval(intervalTimer);
        intervalTimer = null;
      }
    }

    function stop(e) {
      if (e && activePointerId != null && e.pointerId != null && e.pointerId !== activePointerId) return;
      clearTimers();
      if (activePointerId != null) {
        try {
          if (el.hasPointerCapture && el.hasPointerCapture(activePointerId)) {
            el.releasePointerCapture(activePointerId);
          }
        } catch (_) { /* ignore */ }
        activePointerId = null;
      }
    }

    function start(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (activePointerId != null) return;
      e.preventDefault();
      activePointerId = e.pointerId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) { /* ignore */ }
      clearTimers();
      action();
      delayTimer = setTimeout(function () {
        delayTimer = null;
        intervalTimer = setInterval(action, intervalMs);
      }, delayMs);
    }

    function onLostCapture() {
      clearTimers();
      activePointerId = null;
    }

    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('lostpointercapture', onLostCapture);
    el.addEventListener('keydown', function (e) {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      action();
    });

    return function unbind() {
      stop();
      el.removeEventListener('pointerdown', start);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
      el.removeEventListener('lostpointercapture', onLostCapture);
      delete el.dataset.holdRepeatBound;
    };
  }

  /**
   * Bind hold-repeat on every matching button under root (skips already-bound).
   * @param {ParentNode} root
   * @param {string} selector
   * @param {function(Element): void} actionForBtn
   * @param {{ delayMs?: number, intervalMs?: number }=} opts
   */
  function bindAll(root, selector, actionForBtn, opts) {
    if (!root || !selector || typeof actionForBtn !== 'function') return;
    root.querySelectorAll(selector).forEach(function (btn) {
      bind(btn, function () {
        actionForBtn(btn);
      }, opts);
    });
  }

  global.RianellHoldRepeat = {
    bind: bind,
    bindAll: bindAll,
    DEFAULT_DELAY_MS: DEFAULT_DELAY_MS,
    DEFAULT_INTERVAL_MS: DEFAULT_INTERVAL_MS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
