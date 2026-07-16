/**
 * Shared drum picker scroll: touch, mouse wheel, pointer drag (any axis), and snap-to-nearest value.
 */
(function (global) {
  'use strict';

  function drumValueAtCenter(scrollEl) {
    if (!scrollEl) return null;
    var rect = scrollEl.getBoundingClientRect();
    var centerY = rect.top + rect.height / 2;
    var items = scrollEl.querySelectorAll('[data-value]');
    var best = null;
    var bestDist = Infinity;
    items.forEach(function (item) {
      var ir = item.getBoundingClientRect();
      var dist = Math.abs(ir.top + ir.height / 2 - centerY);
      if (dist < bestDist) {
        bestDist = dist;
        var raw = item.getAttribute('data-value');
        var n = raw != null && raw.indexOf('.') >= 0 ? parseFloat(raw) : parseInt(raw, 10);
        best = isNaN(n) ? best : n;
      }
    });
    return best;
  }

  function scrollDrumToValue(scrollEl, value, smooth) {
    if (!scrollEl || value == null) return;
    var str = String(value);
    var target = scrollEl.querySelector('[data-value="' + str + '"]');
    if (!target) {
      var closest = null;
      var diff = Infinity;
      scrollEl.querySelectorAll('[data-value]').forEach(function (el) {
        var raw = el.getAttribute('data-value');
        var n = raw != null && raw.indexOf('.') >= 0 ? parseFloat(raw) : parseInt(raw, 10);
        if (isNaN(n)) return;
        var d = Math.abs(n - value);
        if (d < diff) {
          diff = d;
          closest = el;
        }
      });
      target = closest;
    }
    if (!target) return;
    var top = target.offsetTop - (scrollEl.clientHeight - target.offsetHeight) / 2;
    scrollEl.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  }

  function snapToNearest(scrollEl, smooth) {
    var val = drumValueAtCenter(scrollEl);
    if (val == null) return null;
    scrollDrumToValue(scrollEl, val, smooth !== false);
    return val;
  }

  /**
   * @param {HTMLElement} scrollEl
   * @param {{ onScroll?: function, onSnap?: function }} callbacks
   */
  function bindDrumPickerScroll(scrollEl, callbacks) {
    if (!scrollEl || scrollEl.dataset.drumPickerBound === '1') return;
    scrollEl.dataset.drumPickerBound = '1';

    var onScroll = callbacks && typeof callbacks.onScroll === 'function' ? callbacks.onScroll : function () {};
    var onSnap = callbacks && typeof callbacks.onSnap === 'function' ? callbacks.onSnap : function () {};
    var ticking = false;
    var snapTimer = null;
    var wheelTimer = null;
    var dragging = false;

    function notifyScroll() {
      if (ticking) return;
      ticking = true;
      global.requestAnimationFrame(function () {
        ticking = false;
        onScroll();
      });
    }

    function finishSnap() {
      if (dragging) return;
      snapToNearest(scrollEl, true);
      onScroll();
      onSnap();
    }

    function scheduleSnap(delay) {
      if (snapTimer) global.clearTimeout(snapTimer);
      snapTimer = global.setTimeout(function () {
        snapTimer = null;
        finishSnap();
      }, delay == null ? 80 : delay);
    }

    scrollEl.addEventListener('scroll', function () {
      notifyScroll();
      if (!dragging) scheduleSnap(120);
    }, { passive: true });

    if ('onscrollend' in global) {
      scrollEl.addEventListener('scrollend', function () {
        if (snapTimer) {
          global.clearTimeout(snapTimer);
          snapTimer = null;
        }
        finishSnap();
      });
    }

    scrollEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaY;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      }
      scrollEl.scrollTop += delta;
      notifyScroll();
      if (wheelTimer) global.clearTimeout(wheelTimer);
      wheelTimer = global.setTimeout(function () {
        wheelTimer = null;
        finishSnap();
      }, 100);
    }, { passive: false });

    scrollEl.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      dragging = true;
      scrollEl.classList.add('drum-scroll--dragging');
      scrollEl.setPointerCapture(e.pointerId);
      var startX = e.clientX;
      var startY = e.clientY;
      var startScroll = scrollEl.scrollTop;
      var axis = null;

      function onMove(ev) {
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if (!axis) {
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
          axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        }
        var delta = axis === 'h' ? dx : dy;
        scrollEl.scrollTop = startScroll - delta;
        notifyScroll();
      }

      function onEnd() {
        dragging = false;
        scrollEl.classList.remove('drum-scroll--dragging');
        try {
          scrollEl.releasePointerCapture(e.pointerId);
        } catch (err) { /* ignore */ }
        scrollEl.removeEventListener('pointermove', onMove);
        scrollEl.removeEventListener('pointerup', onEnd);
        scrollEl.removeEventListener('pointercancel', onEnd);
        finishSnap();
      }

      scrollEl.addEventListener('pointermove', onMove);
      scrollEl.addEventListener('pointerup', onEnd);
      scrollEl.addEventListener('pointercancel', onEnd);
    });

    scrollEl.addEventListener('click', function (e) {
      var item = e.target.closest('[data-value]');
      if (!item || !scrollEl.contains(item)) return;
      var raw = item.getAttribute('data-value');
      var val = raw != null && raw.indexOf('.') >= 0 ? parseFloat(raw) : parseInt(raw, 10);
      if (isNaN(val)) return;
      scrollDrumToValue(scrollEl, val, true);
      scheduleSnap(150);
    });

    scrollEl.addEventListener('keydown', function (e) {
      var val = drumValueAtCenter(scrollEl);
      if (val == null) return;
      var next = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        var delta = (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 1;
        next = val + delta;
      } else if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        next = val + (e.key === 'PageUp' ? -5 : 5);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        var items = scrollEl.querySelectorAll('[data-value]');
        if (!items.length) return;
        var first = items[0].getAttribute('data-value');
        var last = items[items.length - 1].getAttribute('data-value');
        next = e.key === 'Home'
          ? (first.indexOf('.') >= 0 ? parseFloat(first) : parseInt(first, 10))
          : (last.indexOf('.') >= 0 ? parseFloat(last) : parseInt(last, 10));
      }
      if (next == null || isNaN(next)) return;
      scrollDrumToValue(scrollEl, next, true);
      scheduleSnap(150);
    });
  }

  global.RianellDrumPicker = {
    valueAtCenter: drumValueAtCenter,
    scrollToValue: scrollDrumToValue,
    snapToNearest: snapToNearest,
    bind: bindDrumPickerScroll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
