/**
 * Rianell 3D weather orb — a miniature living sky rendered inside the
 * "enable local weather" button and, once enabled, inside the weather strip's
 * condition slot. Powered by three.js, lazy-imported from vendor/three only
 * when the orb is actually visible.
 *
 * Behaviour contract (mirrors modules/webgl-scene.js tier gating):
 * - prefers-reduced-motion, `reducedMotion` pref, brain-fog-mode, clinical
 *   vibe, or a low DeviceBenchmark tier -> module refuses; the flat CSS
 *   button keeps working untouched.
 * - The orb mirrors the user's real sky: sun by day, moon and stars by night;
 *   after enabling, the scene morphs to the fetched condition (rain falls,
 *   snow drifts, thunder flashes).
 * - States: idle (drift + occasional sun peek), hover (tilts toward pointer,
 *   sun brightens, cloud slides aside), press (squash), loading (sky spins,
 *   particle swirl orbit), success (sun burst), error (shake + desaturate).
 */
(function (global) {
  'use strict';

  var THREE = null;
  var threePromise = null;

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

  function isNightNow() {
    var h = new Date().getHours();
    return h < 6 || h >= 20;
  }

  function accentColor() {
    try {
      var css = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
      return css || '#7bdf8c';
    } catch (e) {
      return '#7bdf8c';
    }
  }

  /**
   * Builds one orb scene. `variant` is 'prompt' (interactive button) or a
   * condition id: weather-clear | weather-partly-cloudy | weather-cloudy |
   * weather-fog | weather-rain | weather-snow | weather-thunder.
   */
  function createOrb(host, variant, opts) {
    if (!host || !canUse3D() || !THREE) return null;
    opts = opts || {};
    var night = isNightNow();
    var interactive = variant === 'prompt';

    var canvas = document.createElement('canvas');
    canvas.className = 'weather-orb-canvas';
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
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 12);
    camera.position.z = 3.4;

    scene.add(new THREE.AmbientLight(night ? 0x8aa3c8 : 0xd9f2e0, night ? 1.0 : 1.35));
    var keyLight = new THREE.DirectionalLight(0xffffff, night ? 0.8 : 1.5);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    var sky = new THREE.Group();
    scene.add(sky);

    // --- Celestial body: sun by day, moon by night --------------------------
    var isMoon = night && (variant === 'prompt' || variant === 'weather-clear' || variant === 'weather-partly-cloudy');
    var sunMat = new THREE.MeshStandardMaterial(isMoon
      ? { color: 0xdde4f0, roughness: 0.9, metalness: 0, emissive: 0x9db4d8, emissiveIntensity: 0.35 }
      : { color: 0xffd27a, roughness: 0.55, metalness: 0, emissive: 0xffb347, emissiveIntensity: 1.1 });
    var sun = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), sunMat);
    sun.position.set(-0.42, 0.34, -0.35);
    var sunLight = new THREE.PointLight(isMoon ? 0xa9c2e8 : 0xffc76b, isMoon ? 0.9 : 2.0, 5);
    sun.add(sunLight);
    sky.add(sun);

    // Sun rays / moon halo: thin torus that pulses.
    var haloMat = new THREE.MeshBasicMaterial({
      color: isMoon ? 0xa9c2e8 : 0xffd27a, transparent: true, opacity: 0.35,
    });
    var halo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 8, 40), haloMat);
    halo.position.copy(sun.position);
    sky.add(halo);

    // --- Cloud: overlapping soft spheres ------------------------------------
    var showCloud = variant !== 'weather-clear';
    var stormy = variant === 'weather-thunder';
    var grey = stormy ? 0x9aa3ad : (variant === 'weather-cloudy' || variant === 'weather-fog' ? 0xdfe5ea : 0xffffff);
    var cloudMat = new THREE.MeshStandardMaterial({ color: grey, roughness: 0.9, metalness: 0 });
    var cloud = new THREE.Group();
    [
      [0, 0, 0, 0.38],
      [-0.34, -0.06, 0.08, 0.27],
      [0.33, -0.05, 0.05, 0.29],
      [0.05, 0.2, -0.06, 0.26],
    ].forEach(function (p) {
      var puff = new THREE.Mesh(new THREE.SphereGeometry(p[3], 20, 20), cloudMat);
      puff.position.set(p[0], p[1], p[2]);
      cloud.add(puff);
    });
    cloud.position.set(0.22, -0.1, 0.25);
    cloud.visible = showCloud;
    sky.add(cloud);

    // --- Fog banks: translucent flat lozenges drifting sideways -------------
    var fogBanks = null;
    if (variant === 'weather-fog') {
      fogBanks = new THREE.Group();
      for (var f = 0; f < 3; f++) {
        var bank = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.05, 0.9, 4, 10),
          new THREE.MeshBasicMaterial({ color: 0xe8eef2, transparent: true, opacity: 0.4 - f * 0.08 })
        );
        bank.rotation.z = Math.PI / 2;
        bank.position.set((f % 2 ? -0.15 : 0.1), -0.28 - f * 0.22, 0.4);
        fogBanks.add(bank);
      }
      sky.add(fogBanks);
    }

    // --- Precipitation / swirl particles -------------------------------------
    var accent = new THREE.Color(accentColor());
    var isRain = variant === 'weather-rain' || stormy;
    var isSnow = variant === 'weather-snow';
    var dropCount = 42;
    var dropPos = new Float32Array(dropCount * 3);
    var dropSeed = new Float32Array(dropCount);
    for (var i = 0; i < dropCount; i++) {
      dropPos[i * 3] = cloud.position.x + (Math.random() - 0.5) * 0.9;
      dropPos[i * 3 + 1] = cloud.position.y - 0.2 - Math.random() * 0.9;
      dropPos[i * 3 + 2] = cloud.position.z + (Math.random() - 0.5) * 0.3;
      dropSeed[i] = Math.random();
    }
    var dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
    var dropMat = new THREE.PointsMaterial({
      color: isSnow ? 0xffffff : (isRain ? 0x9ecbff : accent),
      size: isSnow ? 0.075 : 0.055,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    var drops = new THREE.Points(dropGeo, dropMat);
    drops.visible = isRain || isSnow;
    sky.add(drops);

    // --- Stars at night (prompt / clear variants) ----------------------------
    var stars = null;
    if (isMoon) {
      var starCount = 16;
      var starPos = new Float32Array(starCount * 3);
      for (var s = 0; s < starCount; s++) {
        starPos[s * 3] = (Math.random() - 0.5) * 2.2;
        starPos[s * 3 + 1] = (Math.random() - 0.3) * 1.6;
        starPos[s * 3 + 2] = -0.6 - Math.random() * 0.5;
      }
      var starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xf3f7ff, size: 0.045, transparent: true, opacity: 0.9, depthWrite: false,
      }));
      sky.add(stars);
    }

    // --- Runtime state --------------------------------------------------------
    var state = 'idle'; // idle | loading | success | error
    var pointer = { x: 0, y: 0, hover: false, down: false };
    var shakeT = 0;
    var burstT = 0;
    var flashT = Math.random() * 4;
    var disposed = false;
    var visible = true;
    var raf = 0;
    var clock = new THREE.Clock();

    function resize() {
      var w = host.clientWidth || 44;
      var h = host.clientHeight || 44;
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

    function onVisibility() {
      if (!document.hidden && visible && !raf && !disposed) raf = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Pointer interaction: tilt the sky toward the cursor (prompt only).
    var interactEl = opts.interactEl || host;
    function onMove(e) {
      var rect = interactEl.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    function onEnter() { pointer.hover = true; }
    function onLeave() { pointer.hover = false; pointer.x = 0; pointer.y = 0; }
    function onDown() { pointer.down = true; }
    function onUp() { pointer.down = false; }
    if (interactive) {
      interactEl.addEventListener('pointermove', onMove);
      interactEl.addEventListener('pointerenter', onEnter);
      interactEl.addEventListener('pointerleave', onLeave);
      interactEl.addEventListener('pointerdown', onDown);
      interactEl.addEventListener('pointerup', onUp);
    }

    var baseSunPos = sun.position.clone();
    var baseCloudX = cloud.position.x;

    function tick() {
      raf = 0;
      if (disposed) return;
      if (!host.isConnected) { dispose(); return; }
      if (document.hidden || !visible) return; // resumes via observers
      raf = requestAnimationFrame(tick);

      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;

      // Base drift: the sky slowly breathes and sways.
      var driftY = Math.sin(t * 0.6) * 0.05;
      var targetRotY = Math.sin(t * 0.25) * 0.18;
      var targetRotX = Math.cos(t * 0.2) * 0.08;

      if (interactive && (pointer.hover || pointer.x || pointer.y)) {
        targetRotY += pointer.x * 0.5;
        targetRotX += pointer.y * 0.35;
      }
      if (state === 'loading') {
        sky.rotation.y += dt * 2.6; // spin while locating / fetching
      } else {
        sky.rotation.y += (targetRotY - sky.rotation.y) * Math.min(1, dt * 5);
      }
      sky.rotation.x += (targetRotX - sky.rotation.x) * Math.min(1, dt * 5);
      sky.position.y = driftY;

      // Error shake: decaying jitter.
      if (shakeT > 0) {
        shakeT -= dt;
        sky.rotation.z = Math.sin(shakeT * 40) * shakeT * 0.55;
        var deSat = Math.max(0, Math.min(1, shakeT / 1.2));
        sunMat.emissiveIntensity = (isMoon ? 0.35 : 1.1) * (1 - deSat * 0.8);
        cloudMat.color.setHex(grey).lerp(new THREE.Color(0x8a8f94), deSat);
      } else {
        sky.rotation.z += (0 - sky.rotation.z) * Math.min(1, dt * 6);
      }

      // Hover: sun brightens and the cloud politely slides aside (a "peek").
      var hoverBoost = interactive && pointer.hover ? 1 : 0;
      var peek = interactive && !pointer.hover ? (Math.sin(t * 0.45) > 0.92 ? 1 : 0) : 0;
      var slide = Math.max(hoverBoost, peek);
      cloud.position.x += ((baseCloudX + slide * 0.28) - cloud.position.x) * Math.min(1, dt * 4);
      if (shakeT <= 0) {
        var targetGlow = (isMoon ? 0.35 : 1.1) + hoverBoost * (isMoon ? 0.3 : 0.9);
        sunMat.emissiveIntensity += (targetGlow - sunMat.emissiveIntensity) * Math.min(1, dt * 6);
      }

      // Success burst: sun flares and scales, particles fly outward.
      if (burstT > 0) {
        burstT -= dt;
        var k = 1 - Math.max(0, burstT / 0.9);
        sun.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.55);
        sunMat.emissiveIntensity = (isMoon ? 0.35 : 1.1) + Math.sin(k * Math.PI) * 2.2;
        halo.scale.setScalar(1 + k * 1.6);
        haloMat.opacity = 0.35 * (1 - k);
      } else if (state !== 'error') {
        sun.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 4));
        halo.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 4));
        haloMat.opacity += ((0.28 + Math.sin(t * 1.4) * 0.08) - haloMat.opacity) * Math.min(1, dt * 3);
      }

      // Cloud bob + press squash.
      cloud.position.y = -0.1 + Math.sin(t * 0.9 + 1.3) * 0.04;
      var press = interactive && pointer.down ? 0.9 : 1;
      var targetScale = press * (state === 'loading' ? 0.94 : 1);
      sky.scale.x += (targetScale - sky.scale.x) * Math.min(1, dt * 8);
      sky.scale.y = sky.scale.z = sky.scale.x;

      // Halo slow spin so the ring catches light.
      halo.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.4;
      halo.rotation.y = t * 0.4;

      // Precipitation loop / loading swirl.
      var pos = dropGeo.attributes.position.array;
      if (state === 'loading') {
        drops.visible = true;
        dropMat.color.set(accent);
        for (var i = 0; i < dropCount; i++) {
          var a = t * 2.2 + dropSeed[i] * Math.PI * 2;
          var r = 0.55 + dropSeed[i] * 0.35;
          pos[i * 3] = Math.cos(a) * r;
          pos[i * 3 + 1] = Math.sin(a * 1.3) * 0.5;
          pos[i * 3 + 2] = Math.sin(a) * r * 0.6;
        }
        dropGeo.attributes.position.needsUpdate = true;
      } else if (isRain || isSnow) {
        drops.visible = true;
        var fall = isSnow ? 0.35 : 1.5;
        for (var j = 0; j < dropCount; j++) {
          pos[j * 3 + 1] -= dt * fall * (0.6 + dropSeed[j] * 0.8);
          if (isSnow) pos[j * 3] += Math.sin(t * 1.5 + dropSeed[j] * 9) * dt * 0.12;
          if (pos[j * 3 + 1] < cloud.position.y - 1.15) {
            pos[j * 3 + 1] = cloud.position.y - 0.25;
            pos[j * 3] = cloud.position.x + (Math.random() - 0.5) * 0.9;
          }
        }
        dropGeo.attributes.position.needsUpdate = true;
      } else if (burstT > 0) {
        drops.visible = true;
        dropMat.color.set(accent);
        var kk = 1 - Math.max(0, burstT / 0.9);
        for (var m = 0; m < dropCount; m++) {
          var ang = dropSeed[m] * Math.PI * 2;
          var rad = kk * (0.5 + dropSeed[m] * 0.9);
          pos[m * 3] = Math.cos(ang) * rad;
          pos[m * 3 + 1] = Math.sin(ang) * rad;
          pos[m * 3 + 2] = 0.3;
        }
        dropMat.opacity = 0.85 * (1 - kk);
        dropGeo.attributes.position.needsUpdate = true;
      } else {
        drops.visible = false;
        dropMat.opacity = 0.85;
      }

      // Thunder: random lightning flashes.
      if (stormy) {
        flashT -= dt;
        if (flashT <= 0) flashT = 2.5 + Math.random() * 4;
        var flashOn = flashT < 0.14 || (flashT > 0.2 && flashT < 0.3);
        sunLight.intensity = flashOn ? 6 : 0.4;
        sunLight.color.setHex(flashOn ? 0xeef3ff : 0xffc76b);
        cloudMat.emissive.setHex(flashOn ? 0x39414d : 0x000000);
      }

      // Fog banks drift horizontally.
      if (fogBanks) {
        fogBanks.children.forEach(function (bank, bi) {
          bank.position.x = Math.sin(t * 0.35 + bi * 2.1) * 0.22;
        });
      }

      // Star twinkle.
      if (stars) stars.material.opacity = 0.65 + Math.sin(t * 2.3) * 0.25;

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (interactive) {
        interactEl.removeEventListener('pointermove', onMove);
        interactEl.removeEventListener('pointerenter', onEnter);
        interactEl.removeEventListener('pointerleave', onLeave);
        interactEl.removeEventListener('pointerdown', onDown);
        interactEl.removeEventListener('pointerup', onUp);
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

    return {
      setState: function (next) {
        if (disposed) return;
        state = next;
        if (next === 'error') { shakeT = 1.2; state = 'idle'; }
        if (next === 'success') { burstT = 0.9; state = 'idle'; }
        if (visible && !raf) raf = requestAnimationFrame(tick);
      },
      dispose: dispose,
      get disposed() { return disposed; },
    };
  }

  var activePrompt = null;
  var activeCondition = null;

  /**
   * Upgrades the flat enable button into the 3D orb. Safe to call on every
   * re-render; stale instances self-dispose when their host leaves the DOM.
   */
  function enhancePrompt(btn) {
    if (!btn || !canUse3D()) return Promise.resolve(null);
    return loadThree().then(function (mod) {
      if (!mod || !btn.isConnected) return null;
      if (activePrompt && !activePrompt.disposed) activePrompt.dispose();
      var slot = document.createElement('span');
      slot.className = 'weather-orb-slot';
      slot.setAttribute('aria-hidden', 'true');
      btn.appendChild(slot);
      var ctrl = createOrb(slot, 'prompt', { interactEl: btn });
      if (!ctrl) { slot.remove(); return null; }
      btn.classList.add('home-weather-enable-prompt--orb');
      activePrompt = ctrl;
      return ctrl;
    });
  }

  /** Replaces the flat condition SVG in the enabled strip with a live scene. */
  function enhanceCondition(hostEl, conditionId) {
    if (!hostEl || !conditionId || conditionId === 'weather-unknown' || !canUse3D()) {
      return Promise.resolve(null);
    }
    return loadThree().then(function (mod) {
      if (!mod || !hostEl.isConnected) return null;
      if (activeCondition && !activeCondition.disposed) activeCondition.dispose();
      var slot = document.createElement('span');
      slot.className = 'weather-orb-slot weather-orb-slot--condition';
      slot.setAttribute('aria-hidden', 'true');
      hostEl.appendChild(slot);
      var ctrl = createOrb(slot, conditionId, {});
      if (!ctrl) { slot.remove(); return null; }
      hostEl.classList.add('home-weather-strip__condition--orb');
      activeCondition = ctrl;
      return ctrl;
    });
  }

  function notifyPromptState(state) {
    if (activePrompt && !activePrompt.disposed) activePrompt.setState(state);
  }

  global.RianellWeatherOrb3D = {
    canUse3D: canUse3D,
    enhancePrompt: enhancePrompt,
    enhanceCondition: enhanceCondition,
    notifyPromptState: notifyPromptState,
  };
})(typeof window !== 'undefined' ? window : globalThis);
