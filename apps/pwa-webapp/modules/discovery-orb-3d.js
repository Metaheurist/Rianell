/**
 * Rianell 3D discovery orb — neural pulse for the Ask Rianell header.
 * Lazy-imports three.js; tier-gated like weather-orb-3d.js.
 */
(function (global) {
  'use strict';

  var THREE = null;
  var threePromise = null;
  var activeScene = null;

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

  function createOrb(host) {
    if (!host || !THREE || !canUse3D()) return null;

    var canvas = document.createElement('canvas');
    canvas.className = 'discovery-orb-canvas';
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
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 12);
    camera.position.z = 2.8;

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    var key = new THREE.PointLight(0xffffff, 1.4, 8);
    key.position.set(1, 2, 2);
    scene.add(key);

    var accent = new THREE.Color(accentColor());
    var coreMat = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.35,
      metalness: 0.15,
      emissive: accent.clone().multiplyScalar(0.55),
      emissiveIntensity: 0.85,
    });
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), coreMat);
    scene.add(core);

    var ringMat = new THREE.MeshBasicMaterial({
      color: accent, transparent: true, opacity: 0.28, wireframe: true,
    });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 8, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    var nodeCount = 10;
    var nodes = [];
    var nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    for (var i = 0; i < nodeCount; i++) {
      var theta = (i / nodeCount) * Math.PI * 2;
      var r = 0.72 + (i % 3) * 0.08;
      var y = Math.sin(theta * 2.1) * 0.28;
      var node = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        new THREE.MeshStandardMaterial({
          color: accent,
          emissive: accent,
          emissiveIntensity: 0.7,
          roughness: 0.4,
          metalness: 0.1,
        })
      );
      node.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      node.userData.phase = Math.random() * Math.PI * 2;
      nodeGroup.add(node);
      nodes.push(node);
    }

    var lineGeo = new THREE.BufferGeometry();
    var linePos = new Float32Array(nodeCount * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    var lines = new THREE.LineLoop(lineGeo, new THREE.LineBasicMaterial({
      color: accent, transparent: true, opacity: 0.45,
    }));
    nodeGroup.add(lines);

    var disposed = false;
    var visible = true;
    var raf = 0;
    var clock = new THREE.Clock();
    var pointer = { hover: false };
    var section = host.closest('.home-discovery-section');

    function resize() {
      var w = host.clientWidth || 40;
      var h = host.clientHeight || 40;
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
        if (visible && !raf && !disposed) raf = requestAnimationFrame(tick);
      })
      : null;
    if (io) io.observe(host);

    function onEnter() { pointer.hover = true; }
    function onLeave() { pointer.hover = false; }
    if (section) {
      section.addEventListener('pointerenter', onEnter);
      section.addEventListener('pointerleave', onLeave);
    }

    function tick() {
      raf = 0;
      if (disposed) return;
      if (!host.isConnected) { dispose(); return; }
      if (document.hidden || !visible) return;
      raf = requestAnimationFrame(tick);

      var t = clock.elapsedTime;
      var dt = Math.min(clock.getDelta(), 0.05);
      var pulse = pointer.hover ? 1.35 : 1;
      core.rotation.x += dt * 0.35 * pulse;
      core.rotation.y += dt * 0.55 * pulse;
      core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04 * pulse);
      coreMat.emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.25 * pulse;

      ring.rotation.z = t * 0.5;
      ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.25;
      ringMat.opacity = 0.2 + Math.sin(t * 1.8) * 0.1;

      nodes.forEach(function (node, idx) {
        var ph = node.userData.phase + t * (1.2 + idx * 0.05);
        node.position.y = Math.sin(ph) * 0.32;
        node.material.emissiveIntensity = 0.45 + Math.sin(ph * 2) * 0.35;
        linePos[idx * 3] = node.position.x;
        linePos[idx * 3 + 1] = node.position.y;
        linePos[idx * 3 + 2] = node.position.z;
      });
      lineGeo.attributes.position.needsUpdate = true;

      nodeGroup.rotation.y = Math.sin(t * 0.25) * 0.35;

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      if (section) {
        section.removeEventListener('pointerenter', onEnter);
        section.removeEventListener('pointerleave', onLeave);
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

  function enhanceSection(section) {
    if (!section || !canUse3D()) return Promise.resolve(null);
    return loadThree().then(function (mod) {
      if (!mod || !section.isConnected) return null;
      if (activeScene && !activeScene.disposed) activeScene.dispose();
      var host = section.querySelector('.home-discovery-orb-host');
      if (!host) return null;
      host.innerHTML = '';
      var ctrl = createOrb(host);
      if (!ctrl) return null;
      section.classList.add('home-discovery-section--orb');
      activeScene = ctrl;
      return ctrl;
    });
  }

  global.RianellDiscoveryOrb3D = {
    canUse3D: canUse3D,
    enhanceSection: enhanceSection,
  };
})(typeof window !== 'undefined' ? window : globalThis);
