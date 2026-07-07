/**
 * Rianell 3D goals depth — seven-day pillar charts inside each metric row.
 * Lazy-imports three.js; tier-gated like weather-orb-3d.js.
 */
(function (global) {
  'use strict';

  var THREE = null;
  var threePromise = null;
  var activeScenes = [];

  function isReducedMotion() {
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (document.body && document.body.classList.contains('reduce-motion')) return true;
    var prefs = global.RianellPrefs && typeof global.RianellPrefs.get === 'function'
      ? global.RianellPrefs.get('reducedMotion') : false;
    return prefs === true || prefs === 'true';
  }

  function canUse3D() {
    if (isReducedMotion()) return false;
    if (document.body && document.body.classList.contains('vibe-clinical')) return false;
    if (document.body && document.body.classList.contains('brain-fog-mode')) return false;
    var bench = global.DeviceBenchmark && global.DeviceBenchmark.getTier
      ? global.DeviceBenchmark.getTier() : 'medium';
    if (bench === 'low' || bench === 'very-low') return false;
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  function loadThree() {
    if (THREE) return Promise.resolve(THREE);
    if (threePromise) return threePromise;
    var url = new URL('vendor/three/three.module.min.js', document.baseURI).href;
    threePromise = import(url).then(function (mod) {
      THREE = mod;
      return mod;
    }).catch(function () {
      threePromise = null;
      return null;
    });
    return threePromise;
  }

  function accentColor() {
    try {
      return getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#7bdf8c';
    } catch (e) {
      return '#7bdf8c';
    }
  }

  function metricHue(metric) {
    switch (metric) {
      case 'hydration': return 0x6ec8ff;
      case 'sleep': return 0xb8a0ff;
      case 'goodDays': return 0xffc76b;
      default: return null;
    }
  }

  function createRowScene(host, metric, dailyPcts) {
    if (!host || !THREE || !canUse3D()) return null;

    var canvas = document.createElement('canvas');
    canvas.className = 'goals-3d-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power',
      });
    } catch (e) {
      canvas.remove();
      return null;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    camera.position.set(0, 1.1, 4.2);
    camera.lookAt(0, 0.35, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    var key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2, 4, 3);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xa8d4ff, 0.45);
    rim.position.set(-2, 1, -2);
    scene.add(rim);

    var accent = new THREE.Color(accentColor());
    var metricTint = metricHue(metric);
    var fillColor = metricTint ? new THREE.Color(metricTint) : accent.clone();
    var emptyColor = new THREE.Color(0x888888);

    var group = new THREE.Group();
    scene.add(group);

    var bars = [];
    var pcts = Array.isArray(dailyPcts) ? dailyPcts : [];
    while (pcts.length < 7) pcts.push(0);

    var spacing = 0.52;
    var startX = -((7 - 1) * spacing) / 2;

    for (var i = 0; i < 7; i++) {
      var pct = Math.max(0, Math.min(100, Number(pcts[i]) || 0));
      var targetH = 0.12 + (pct / 100) * 1.05;
      var geo = new THREE.BoxGeometry(0.34, 0.08, 0.34);
      var mat = new THREE.MeshStandardMaterial({
        color: pct > 0 ? fillColor : emptyColor,
        roughness: 0.55,
        metalness: 0.08,
        emissive: pct >= 100 ? fillColor.clone().multiplyScalar(0.35) : 0x000000,
        emissiveIntensity: pct >= 100 ? 0.6 : 0,
        transparent: pct === 0,
        opacity: pct === 0 ? 0.35 : 1,
      });
      var bar = new THREE.Mesh(geo, mat);
      bar.position.set(startX + i * spacing, targetH / 2, 0);
      bar.scale.y = 0.01;
      bar.userData.targetH = targetH;
      bar.userData.targetPct = pct;
      group.add(bar);
      bars.push(bar);

      var base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.85, metalness: 0, transparent: true, opacity: 0.25 })
      );
      base.position.set(startX + i * spacing, 0.02, 0);
      group.add(base);
    }

    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.06, 0.9),
      new THREE.MeshStandardMaterial({
        color: accent.clone().multiplyScalar(0.35),
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0.35,
      })
    );
    platform.position.y = -0.02;
    group.add(platform);

    var disposed = false;
    var visible = true;
    var raf = 0;
    var clock = new THREE.Clock();
    var growT = 0;
    var pointer = { x: 0, hover: false };
    var rowEl = host.closest('.goals-metric-row');

    function resize() {
      var w = host.clientWidth || 120;
      var h = host.clientHeight || 48;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host);

    var io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(function (entries) {
        visible = entries.some(function (e) { return e.isIntersecting; });
        if (visible && !raf && !disposed) {
          growT = 0;
          raf = requestAnimationFrame(tick);
        }
      }, { threshold: 0.2 })
      : null;
    if (io) io.observe(host);

    function onEnter() { pointer.hover = true; }
    function onLeave() { pointer.hover = false; pointer.x = 0; }
    function onMove(e) {
      if (!rowEl) return;
      var rect = rowEl.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    }
    if (rowEl) {
      rowEl.addEventListener('pointerenter', onEnter);
      rowEl.addEventListener('pointerleave', onLeave);
      rowEl.addEventListener('pointermove', onMove);
    }

    function tick() {
      raf = 0;
      if (disposed) return;
      if (!host.isConnected) { dispose(); return; }
      if (document.hidden || !visible) return;
      raf = requestAnimationFrame(tick);

      var dt = Math.min(clock.getDelta(), 0.05);
      growT = Math.min(1, growT + dt * 1.8);

      var tiltY = pointer.hover ? pointer.x * 0.22 : Math.sin(clock.elapsedTime * 0.35) * 0.08;
      var tiltX = pointer.hover ? -0.06 : Math.cos(clock.elapsedTime * 0.28) * 0.04;
      group.rotation.y += (tiltY - group.rotation.y) * Math.min(1, dt * 5);
      group.rotation.x += (tiltX - group.rotation.x) * Math.min(1, dt * 5);

      bars.forEach(function (bar, idx) {
        var eased = 1 - Math.pow(1 - growT, 3);
        var delay = idx * 0.06;
        var local = Math.max(0, Math.min(1, (growT - delay) / (1 - delay * 0.8)));
        var localEased = 1 - Math.pow(1 - local, 3);
        var h = bar.userData.targetH * localEased;
        bar.scale.y = Math.max(0.01, h / 0.08);
        bar.position.y = h / 2;
        if (bar.userData.targetPct >= 100) {
          bar.material.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 2 + idx) * 0.2;
        }
      });

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      if (rowEl) {
        rowEl.removeEventListener('pointerenter', onEnter);
        rowEl.removeEventListener('pointerleave', onLeave);
        rowEl.removeEventListener('pointermove', onMove);
      }
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(function (m) { m.dispose(); });
        }
      });
      renderer.dispose();
      canvas.remove();
    }

    return { dispose: dispose, get disposed() { return disposed; } };
  }

  function disposeAll() {
    activeScenes.forEach(function (s) {
      if (s && !s.disposed) s.dispose();
    });
    activeScenes = [];
  }

  function enhanceBlock(block) {
    if (!block || !canUse3D()) return Promise.resolve(null);
    return loadThree().then(function (mod) {
      if (!mod || !block.isConnected) return null;
      disposeAll();
      block.classList.add('goals-progress-block--3d');
      var rows = block.querySelectorAll('.goals-metric-row');
      rows.forEach(function (row) {
        var slot = row.querySelector('.goals-3d-slot');
        if (!slot) return;
        var metric = row.getAttribute('data-metric') || 'steps';
        var raw = row.getAttribute('data-daily-pcts') || '[]';
        var pcts;
        try { pcts = JSON.parse(raw); } catch (e) { pcts = []; }
        var ctrl = createRowScene(slot, metric, pcts);
        if (ctrl) activeScenes.push(ctrl);
      });
      return activeScenes;
    });
  }

  global.RianellGoalsProgress3D = {
    canUse3D: canUse3D,
    enhanceBlock: enhanceBlock,
    disposeAll: disposeAll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
