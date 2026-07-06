/**
 * Tier-gated WebGL ambient scenes (home hero depth field, mood orb, achievement burst).
 * Uses WebGL2 point sprites — no Three.js bundle to stay within CWV budget.
 */
(function (global) {
  'use strict';

  var activeScenes = new Map();

  function isReducedMotion() {
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (document.body && document.body.classList.contains('reduce-motion')) return true;
    var prefs = global.RianellPrefs && typeof global.RianellPrefs.get === 'function'
      ? global.RianellPrefs.get('reducedMotion') : false;
    return prefs === true || prefs === 'true';
  }

  function canUseWebGL() {
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

  function parseColor(css) {
    var el = document.createElement('span');
    el.style.color = css || '#7bdf8c';
    document.body.appendChild(el);
    var rgb = getComputedStyle(el).color.match(/\d+/g) || [123, 223, 140];
    document.body.removeChild(el);
    return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
  }

  function createScene(host, opts) {
    if (!host || !canUseWebGL()) return null;
    var canvas = document.createElement('canvas');
    canvas.className = 'rianell-webgl-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.55;';
    host.style.position = host.style.position || 'relative';
    host.insertBefore(canvas, host.firstChild);

    var gl = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' })
      || canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) {
      canvas.remove();
      return null;
    }

    var count = opts.particleCount || 48;
    var positions = new Float32Array(count * 3);
    var velocities = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    var vs = 'attribute vec3 aPos; uniform float uTime; uniform vec2 uParallax; void main(){ vec3 p=aPos; p.xy+=uParallax*0.15; p.z+=sin(uTime+p.x*3.0)*0.08; gl_Position=vec4(p,1.0); gl_PointSize=2.0+sin(uTime+p.y*2.0)*1.2; }';
    var fs = 'precision mediump float; uniform vec3 uColor; void main(){ float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5) discard; gl_FragColor=vec4(uColor,0.35*(1.0-d*2.0)); }';
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uColor = gl.getUniformLocation(prog, 'uColor');
    var uParallax = gl.getUniformLocation(prog, 'uParallax');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var color = parseColor(opts.color || 'var(--primary-color)');
    var raf = 0;
    var start = performance.now();
    var parallax = { x: 0, y: 0 };
    var disposed = false;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = host.clientWidth || 300;
      var h = host.clientHeight || 200;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function tick(now) {
      if (disposed) return;
      raf = requestAnimationFrame(tick);
      var t = (now - start) * 0.001;
      for (var j = 0; j < count; j++) {
        positions[j * 3] += velocities[j * 3];
        positions[j * 3 + 1] += velocities[j * 3 + 1];
        if (Math.abs(positions[j * 3]) > 1.2) velocities[j * 3] *= -1;
        if (Math.abs(positions[j * 3 + 1]) > 1.2) velocities[j * 3 + 1] *= -1;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform3fv(uColor, color);
      gl.uniform2f(uParallax, parallax.x, parallax.y);
      gl.drawArrays(gl.POINTS, 0, count);
    }

    function onPointer(e) {
      if (!opts.parallax) return;
      var rect = host.getBoundingClientRect();
      parallax.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      parallax.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    resize();
    window.addEventListener('resize', resize);
    if (opts.parallax && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      host.addEventListener('pointermove', onPointer, { passive: true });
    }
    raf = requestAnimationFrame(tick);

    var scene = {
      dispose: function () {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        host.removeEventListener('pointermove', onPointer);
        canvas.remove();
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      },
      setMood: function (score) {
        var s = Math.max(0, Math.min(10, Number(score) || 5));
        color[1] = 0.4 + s * 0.06;
        color[0] = 0.3 + (10 - s) * 0.04;
      },
    };
    return scene;
  }

  function mountScene(hostId, sceneKey, opts) {
    if (!canUseWebGL()) return null;
    var host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
    if (!host) return null;
    if (activeScenes.has(sceneKey)) return activeScenes.get(sceneKey);
    var scene = createScene(host, opts || {});
    if (scene) activeScenes.set(sceneKey, scene);
    return scene;
  }

  function disposeScene(sceneKey) {
    var s = activeScenes.get(sceneKey);
    if (s) {
      s.dispose();
      activeScenes.delete(sceneKey);
    }
  }

  function initHomeAmbient() {
    return mountScene('homeTab', 'home-ambient', {
      particleCount: 56,
      color: 'var(--primary-color)',
      parallax: true,
    });
  }

  function initMoodOrb(score) {
    var host = document.querySelector('#moodTab .mood-control-deck') || document.getElementById('moodTab');
    var scene = mountScene(host, 'mood-orb', { particleCount: 40, color: 'var(--color-ai-accent)' });
    if (scene && typeof score === 'number') scene.setMood(score);
    return scene;
  }

  function burstAchievement(host) {
    var scene = mountScene(host, 'achievement-burst', {
      particleCount: 72,
      color: 'var(--primary-color)',
      parallax: false,
    });
    if (scene) {
      setTimeout(function () { disposeScene('achievement-burst'); }, 2400);
    }
    return scene;
  }

  var api = {
    canUseWebGL: canUseWebGL,
    mountScene: mountScene,
    disposeScene: disposeScene,
    initHomeAmbient: initHomeAmbient,
    initMoodOrb: initMoodOrb,
    burstAchievement: burstAchievement,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.RianellWebGL = api;
})(typeof window !== 'undefined' ? window : globalThis);
