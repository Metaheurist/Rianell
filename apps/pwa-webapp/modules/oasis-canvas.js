/**
 * oasis-canvas.js — UI Oasis Overhaul v2.1.0
 * Ambient blobs, magnetic CTAs, confetti, check-in shimmer, data-stream dots.
 * Namespace: window.OasisCanvas
 * Depends: PerformanceUtils (performance-utils.js must be loaded first)
 */
(function (global) {
  'use strict';

  // ── Guard: do not run if PerformanceUtils not ready ──────────────────────
  var PU = global.PerformanceUtils;
  if (!PU) {
    if (typeof console !== 'undefined') console.warn('[OasisCanvas] PerformanceUtils not found — skipping.');
    return;
  }

  // ── Reduced-motion check (mirrors ui-feedback.js pattern) ────────────────
  function prefersReducedMotion() {
    try { return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function isReducedMotion() {
    // Check both OS pref and Rianell user setting
    if (prefersReducedMotion()) return true;
    try {
      var prefs = global.RianellPrefs && typeof global.RianellPrefs.get === 'function'
        ? global.RianellPrefs.get('reducedMotion')
        : null;
      return prefs === true || prefs === 'true';
    } catch (e) { return false; }
  }

  function isBrainFogMode() {
    return document.body && document.body.classList.contains('rianell-brain-fog');
  }

  // ── Device tier gate ─────────────────────────────────────────────────────
  // getDeviceOpts().reduceAnimations is true for 'low' class + reduced-motion.
  // On 'low' class: skip blob injection entirely, keep grain (CSS-only, no JS).
  function canRunAmbientBlobs() {
    if (isReducedMotion()) return false;
    if (isBrainFogMode()) return false;
    var opts = PU.getDeviceOpts();
    // Allow 'medium' and 'high'; skip 'low'
    return !opts.reduceAnimations;
  }

  // ── B.5 Ambient blob injection ──────────────────────────────────────────
  var BLOB_IDS = ['oasis-blob-1', 'oasis-blob-2', 'oasis-blob-3'];
  var _blobsInjected = false;

  function injectBlobsIntoPanel(panelEl) {
    if (!panelEl) return;
    // Idempotency: skip if already injected
    if (panelEl.querySelector('.oasis-ambient-layer')) return;

    var layer = document.createElement('div');
    layer.className = 'oasis-ambient-layer';
    layer.setAttribute('aria-hidden', 'true');

    [1, 2, 3].forEach(function (n) {
      var blob = document.createElement('div');
      blob.className = 'oasis-blob oasis-blob--' + n;
      layer.appendChild(blob);
    });

    panelEl.insertBefore(layer, panelEl.firstChild);
  }

  function initAmbientBlobs() {
    if (!canRunAmbientBlobs()) return;
    if (_blobsInjected) return;
    _blobsInjected = true;

    // Tab panels: #homeTab, #logsTab, #chartsTab, #moodTab, #aiTab
    var TAB_IDS = ['homeTab', 'logsTab', 'chartsTab', 'moodTab', 'aiTab'];
    TAB_IDS.forEach(function (id) {
      var panel = document.getElementById(id);
      if (panel) injectBlobsIntoPanel(panel);
    });
  }

  // Re-run on tab switch to ensure lazy-rendered panels get blobs
  function onTabActivated(tabId) {
    if (!canRunAmbientBlobs()) return;
    var panel = document.getElementById(tabId);
    if (panel) injectBlobsIntoPanel(panel);
  }

  // ── C.3 Counter flip on value update ────────────────────────────────────
  // Call this when a metric display value changes.
  // el: the DOM element containing the number text.
  function triggerCountFlip(el) {
    if (!el || isReducedMotion()) return;
    el.classList.remove('oasis-count-flip');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('oasis-count-flip');
    el.addEventListener('animationend', function handler() {
      el.classList.remove('oasis-count-flip');
      el.removeEventListener('animationend', handler);
    }, { once: true });
  }

  // ── D.2 Neural trace injection for AI tab ─────────────────────────────
  // Full-panel ambient dashed waves (two strands, repeated vertically).
  function buildNeuralTraceSvg() {
    var rows = [];
    var rowCount = 7;
    var rowStep = 104;
    var startY = 56;
    for (var i = 0; i < rowCount; i++) {
      var yA = startY + i * rowStep;
      var yB = yA + 28 + (i % 2) * 8;
      var phase = i * 18;
      rows.push(
        '  <path class="oasis-neural-path" style="animation-delay:' + (-i * 0.35) + 's"',
        '    d="M-60,' + yA + ' C' + (40 + phase) + ',' + (yA - 36) + ' ' + (120 + phase) + ',' + (yA + 34) + ' 200,' + yA +
        ' S' + (320 + phase) + ',' + (yA - 42) + ' 460,' + yA + '"',
        '    fill="none" stroke="var(--oasis-glow)" stroke-width="1.35" opacity="0.42"/>',
        '  <path class="oasis-neural-path oasis-neural-path--b" style="animation-delay:' + (-1.2 - i * 0.35) + 's"',
        '    d="M-60,' + yB + ' C' + (50 + phase) + ',' + (yB + 38) + ' ' + (130 + phase) + ',' + (yB - 32) + ' 210,' + yB +
        ' S' + (330 + phase) + ',' + (yB + 40) + ' 460,' + yB + '"',
        '    fill="none" stroke="var(--oasis-glow)" stroke-width="1" opacity="0.28"/>'
      );
    }
    return [
      '<svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      rows.join('\n'),
      '</svg>',
    ].join('\n');
  }

  function injectNeuralTrace(containerEl) {
    if (!containerEl) return;
    var existing = containerEl.querySelector('.oasis-neural-trace');
    if (existing && existing.getAttribute('data-oasis-neural-v') === '2') return;
    if (existing) existing.remove();
    var wrapper = document.createElement('div');
    wrapper.className = 'oasis-neural-trace';
    wrapper.setAttribute('data-oasis-neural-v', '2');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.innerHTML = buildNeuralTraceSvg();
    containerEl.insertBefore(wrapper, containerEl.firstChild);
  }

  // ── D.3 Thinking-engine text morph ──────────────────────────────────────
  // Wraps each character in .oasis-char-reveal with staggered animation-delay.
  // el: the element whose textContent should be character-animated.
  function morphThinkingText(el) {
    if (!el || isReducedMotion()) return;
    var text = el.textContent || '';
    el.innerHTML = '';
    text.split('').forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'oasis-char-reveal';
      span.style.animationDelay = (i * 35) + 'ms'; // 35 ms stagger per char
      span.textContent = ch === ' ' ? '\u00A0' : ch; // preserve spaces
      el.appendChild(span);
    });
  }

  function unmorphThinkingText(el) {
    if (!el) return;
    var text = Array.from(el.querySelectorAll('.oasis-char-reveal'))
      .map(function (s) { return s.textContent; }).join('');
    el.textContent = text;
  }

  // ── D.4 Data-stream dots ──────────────────────────────────────────────
  // Fires N dots from sourceEl centroid toward destEl centroid.
  // Uses CSS custom properties --dot-x0/y0 (0,0 — relative to dot spawn point)
  // and --dot-x1/y1 (delta vector to destination).
  var STREAM_DOT_COLOURS = ['var(--oasis-glow)', 'rgba(255,255,255,0.6)', 'var(--oasis-glow)'];

  function fireDataStreamDots(sourceEl, destEl, count) {
    if (isReducedMotion() || isBrainFogMode()) return;
    count = count || 4;
    var sr = sourceEl.getBoundingClientRect();
    var dr = destEl.getBoundingClientRect();
    var sx = sr.left + sr.width / 2;
    var sy = sr.top + sr.height / 2;
    var dx = (dr.left + dr.width / 2) - sx;
    var dy = (dr.top + dr.height / 2) - sy;

    for (var i = 0; i < count; i++) {
      (function (idx) {
        var jitter = function (mag) { return (Math.random() - 0.5) * mag; };
        var dot = document.createElement('div');
        dot.className = 'oasis-stream-dot';
        dot.style.left = (sx + jitter(20)) + 'px';
        dot.style.top  = (sy + jitter(20)) + 'px';
        dot.style.background = STREAM_DOT_COLOURS[idx % STREAM_DOT_COLOURS.length];
        dot.style.setProperty('--dot-x0', '0px');
        dot.style.setProperty('--dot-y0', '0px');
        dot.style.setProperty('--dot-x1', (dx + jitter(30)) + 'px');
        dot.style.setProperty('--dot-y1', (dy + jitter(30)) + 'px');
        dot.style.animationDelay = (idx * 120) + 'ms';
        document.body.appendChild(dot);
        dot.addEventListener('animationend', function () {
          if (dot.parentNode) dot.parentNode.removeChild(dot);
        }, { once: true });
      })(i);
    }
  }

  // ── E.1 Magnetic CTA ─────────────────────────────────────────────────────
  // Drift factor: 0.12 → max 6px at 50px cursor offset from centre.
  // Spring snap on leave: handled by CSS .oasis-magnet-reset (transition).
  var MAGNET_FACTOR = 0.12;
  var MAGNET_MAX_PX = 6;
  var _magnetListeners = new Map(); // element → { move, leave }

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function attachMagnet(el) {
    if (!el || _magnetListeners.has(el) || isReducedMotion()) return;

    function onMove(e) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top  + r.height / 2;
      var dx = clamp((e.clientX - cx) * MAGNET_FACTOR, -MAGNET_MAX_PX, MAGNET_MAX_PX);
      var dy = clamp((e.clientY - cy) * MAGNET_FACTOR, -MAGNET_MAX_PX, MAGNET_MAX_PX);
      el.classList.remove('oasis-magnet-reset');
      el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    }
    function onLeave() {
      el.style.transform = '';
      el.classList.add('oasis-magnet-reset');
      // Remove reset class after transition completes (180ms = --dur-fast)
      setTimeout(function () { el.classList.remove('oasis-magnet-reset'); }, 200);
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    _magnetListeners.set(el, { move: onMove, leave: onLeave });
  }

  function detachMagnet(el) {
    var ls = _magnetListeners.get(el);
    if (!ls) return;
    el.removeEventListener('mousemove', ls.move);
    el.removeEventListener('mouseleave', ls.leave);
    _magnetListeners.delete(el);
  }

  function initMagneticCTAs() {
    if (isReducedMotion()) return;
    // Scope: .cta-primary buttons and .btn-primary elements only
    document.querySelectorAll('.cta-primary, .btn-primary').forEach(attachMagnet);
  }

  // ── E.2 Check-in shimmer ─────────────────────────────────────────────────
  // Call this after a daily log is successfully saved.
  function triggerCheckInShimmer(cardEl) {
    if (!cardEl || isReducedMotion()) return;
    cardEl.classList.remove('oasis-checkin-shimmer');
    void cardEl.offsetWidth; // reflow
    cardEl.classList.add('oasis-checkin-shimmer');
    cardEl.addEventListener('animationend', function handler(e) {
      if (e.animationName !== 'oasisHoloSweep') return;
      cardEl.classList.remove('oasis-checkin-shimmer');
      cardEl.removeEventListener('animationend', handler);
    }, { once: true });
  }

  // ── E.3 Milestone confetti burst ─────────────────────────────────────────
  // 14 particles. Each gets random trajectory within ±160px x, -260 to -80px y.
  // Animation ceiling: 800ms duration + 20ms stagger (worst case 13*20+800 = 1060ms < 1500ms gate).
  var CONFETTI_COLOURS = ['#7bdf8c','#4fc3f7','#fff176','#f48fb1','#ce93d8','#80deea','#ffcc80'];
  var CONFETTI_COUNT = 14;

  function triggerConfetti(originEl) {
    if (!originEl || isReducedMotion() || isBrainFogMode()) return;
    var r = originEl.getBoundingClientRect();
    var ox = r.left + r.width / 2;
    var oy = r.top  + r.height / 2;

    for (var i = 0; i < CONFETTI_COUNT; i++) {
      var p = document.createElement('span');
      p.className = 'oasis-particle';
      p.style.left = ox + 'px';
      p.style.top  = oy + 'px';
      p.style.background = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length];
      // Random trajectory
      var px = ((Math.random() - 0.5) * 320) + 'px'; // -160 to +160px
      var py = (-(Math.random() * 180 + 80)) + 'px';  //  -80 to -260px (upward)
      var rot = (Math.random() * 720 - 360) + 'deg';
      p.style.setProperty('--px', px);
      p.style.setProperty('--py', py);
      p.style.setProperty('--rot', rot);
      p.style.animationDelay = (i * 20) + 'ms';
      document.body.appendChild(p);
      p.addEventListener('animationend', function () {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, { once: true });
    }
  }

  // ── Metric status data-attribute watcher ─────────────────────────────────
  // Sets data-metric-status on metric card wrappers based on AI insight.
  // Called from app.js after insights are rendered.
  function applyMetricStatus(metricCardEl, status) {
    // status: 'improving' | 'stable' | 'declining'
    if (!metricCardEl) return;
    metricCardEl.setAttribute('data-metric-status', status);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  global.OasisCanvas = {
    init: function oasisInit() { initAmbientBlobs(); initMagneticCTAs(); },
    onTabActivated: onTabActivated,
    triggerCountFlip: triggerCountFlip,
    injectNeuralTrace: injectNeuralTrace,
    morphThinkingText: morphThinkingText,
    unmorphThinkingText: unmorphThinkingText,
    fireDataStreamDots: fireDataStreamDots,
    attachMagnet: attachMagnet,
    detachMagnet: detachMagnet,
    initMagneticCTAs: initMagneticCTAs,
    triggerCheckInShimmer: triggerCheckInShimmer,
    triggerConfetti: triggerConfetti,
    applyMetricStatus: applyMetricStatus,
  };

})(typeof window !== 'undefined' ? window : globalThis);
