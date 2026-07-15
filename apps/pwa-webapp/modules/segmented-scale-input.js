/**
 * SegmentedScaleInput - horizontal number pills (default 1-10).
 * Syncs an existing <input type="range|number|hidden"> so wizard save paths stay unchanged.
 */
(function (global) {
  'use strict';

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function parseBound(input, attr, fallback) {
    var raw = input.getAttribute(attr);
    if (raw == null || raw === '') return fallback;
    var n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function paint(root, value) {
    root.querySelectorAll('.segmented-scale__btn').forEach(function (btn) {
      var n = parseInt(btn.getAttribute('data-value'), 10);
      var on = n === value;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
  }

  /**
   * @param {{ input: HTMLInputElement, mount?: HTMLElement, min?: number, max?: number, name?: string }} opts
   * @returns {{ root: HTMLElement, setValue: function(number): void, destroy: function(): void } | null}
   */
  function mount(opts) {
    var input = opts && opts.input;
    if (!input || input.dataset.segmentedScale === '1') return null;

    var min = opts.min != null ? opts.min : parseBound(input, 'min', 1);
    var max = opts.max != null ? opts.max : parseBound(input, 'max', 10);
    if (max < min) {
      var swap = min;
      min = max;
      max = swap;
    }

    var host = opts.mount || input.parentNode;
    if (!host) return null;

    input.dataset.segmentedScale = '1';
    input.classList.add('segmented-scale__native');
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;

    var root = document.createElement('div');
    root.className = 'segmented-scale';
    root.setAttribute('role', 'radiogroup');
    if (opts.name || input.id) {
      root.setAttribute('aria-label', opts.name || (input.id + ' scale'));
    }

    var current = clamp(parseInt(input.value, 10) || min, min, max);
    input.value = String(current);

    for (var v = min; v <= max; v += 1) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segmented-scale__btn';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('data-value', String(v));
      btn.textContent = String(v);
      btn.addEventListener('click', function (ev) {
        var next = parseInt(ev.currentTarget.getAttribute('data-value'), 10);
        setValue(next, true);
      });
      root.appendChild(btn);
    }

    host.insertBefore(root, input.nextSibling);
    paint(root, current);

    function onInputSync() {
      paint(root, clamp(parseInt(input.value, 10) || min, min, max));
    }
    input.addEventListener('input', onInputSync);
    input.addEventListener('change', onInputSync);

    function setValue(next, emit) {
      var value = clamp(next, min, max);
      input.value = String(value);
      paint(root, value);
      if (emit) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof global.updateSliderColor === 'function') {
          global.updateSliderColor(input);
        }
      }
    }

    function destroy() {
      input.removeEventListener('input', onInputSync);
      input.removeEventListener('change', onInputSync);
      delete input.dataset.segmentedScale;
      input.classList.remove('segmented-scale__native');
      input.removeAttribute('aria-hidden');
      input.tabIndex = 0;
      if (root.parentNode) root.parentNode.removeChild(root);
    }

    root._rianellSegmentedScale = { setValue: setValue, destroy: destroy };
    return { root: root, setValue: setValue, destroy: destroy };
  }

  function mountAll(selector, rootEl) {
    var scope = rootEl || document;
    var nodes = scope.querySelectorAll(selector || 'input[type="range"][data-segmented="1"]');
    nodes.forEach(function (input) {
      mount({ input: input });
    });
  }

  global.RianellSegmentedScale = {
    mount: mount,
    mountAll: mountAll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
