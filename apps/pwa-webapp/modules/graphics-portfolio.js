/**
 * graphics-portfolio.js — Avatar entities, metric companions, achievement icons.
 * Namespace: window.RianellGraphicsPortfolio
 */
(function (global) {
  'use strict';

  var PU = global.PerformanceUtils;

  function shared() {
    return global.RianellShared || {};
  }

  var AVATAR_IDS = [
    'voidorb', 'tidewarden', 'leafcircuit', 'prismcore', 'moonthread',
    'emberveil', 'riftecho', 'stonebloom', 'glasswave', 'ashspiral',
    'coralnode', 'starlace', 'mistveil', 'thornloop', 'sunwarden',
    'duskmantle', 'ironbloom', 'vortexseed', 'lumenshard', 'driftmoss',
  ];

  var METRIC_ENTITY_IDS = [
    'mood', 'sleep', 'fatigue', 'pain', 'mobility', 'stiffness',
    'swelling', 'steps', 'hydration', 'bpm', 'flare', 'dailyFunction',
    'irritability', 'weatherSensitivity',
  ];

  var SLIDER_TO_ENTITY = {
    stiffness: 'stiffness',
    jointPain: 'pain',
    mobility: 'mobility',
    swelling: 'swelling',
    fatigue: 'fatigue',
    sleep: 'sleep',
    mood: 'mood',
    irritability: 'irritability',
    weatherSensitivity: 'weatherSensitivity',
    dailyFunction: 'dailyFunction',
  };

  var BADGE_FRAME_IDS = [
    'food_logging', 'exercise_logging', 'medication_logging',
    'milestone_3', 'milestone_30', 'milestone_60', 'milestone_90', 'milestone_180',
    'sleep_pioneer', 'cycle_tracker', 'full_logger',
  ];

  var BADGE_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

  var CYCLE_PHASE_IDS = ['menstrual', 'follicular', 'ovulation', 'luteal'];

  var LEGACY_VIBE_CLASS_IDS = ['calm', 'energy', 'nature', 'clinical', 'dark'];
  var _spritesInjected = false;

  function prefersReducedMotion() {
    try {
      return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function shouldReduceAnimations() {
    if (prefersReducedMotion()) return true;
    if (PU && typeof PU.getDeviceOpts === 'function') {
      var opts = PU.getDeviceOpts();
      if (opts && opts.reduceAnimations) return true;
    }
    return false;
  }

  function normalizeAvatar(avatarId) {
    if (shared().normalizeProfileAvatar) return shared().normalizeProfileAvatar(avatarId);
    var id = typeof avatarId === 'string' ? avatarId.trim() : '';
    return AVATAR_IDS.indexOf(id) >= 0 ? id : 'voidorb';
  }

  function escAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function symbolExists(svg, id) {
    for (var i = 0; i < svg.children.length; i++) {
      if (svg.children[i].id === id) return true;
    }
    return false;
  }

  function appendSymbol(svg, id, viewBox, inner) {
    if (symbolExists(svg, id)) return;
    var sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    sym.setAttribute('id', id);
    sym.setAttribute('viewBox', viewBox);
    sym.innerHTML = inner;
    svg.appendChild(sym);
  }

  /** CSS paint with fallbacks — empty --avatar-secondary must not wipe strokes/fills. */
  var AVATAR_FILL_PRIMARY = 'fill="var(--avatar-primary, var(--primary-color, currentColor))"';
  var AVATAR_FILL_SECONDARY = 'fill="var(--avatar-secondary, var(--avatar-primary, var(--primary-color, currentColor)))"';
  var AVATAR_STROKE_SECONDARY = 'stroke="var(--avatar-secondary, var(--avatar-primary, var(--primary-color, currentColor)))" stroke-width="1.5" fill="none"';
  var AVATAR_FILL_GLOW = 'fill="var(--avatar-glow, var(--avatar-primary, var(--primary-color, currentColor)))"';
  var AVATAR_FILL_EYE = 'fill="var(--avatar-eye, #1a1a1a)"';
  var AVATAR_STROKE_EYE = 'stroke="var(--avatar-eye, #1a1a1a)"';

  function avatarCompanionEyes(cx, cy, gap) {
    gap = gap || 7;
    var eyeFill = AVATAR_FILL_EYE;
    return '<circle cx="' + (cx - gap) + '" cy="' + (cy - 3) + '" r="3.25" ' + eyeFill + '/>' +
      '<circle cx="' + (cx + gap) + '" cy="' + (cy - 3) + '" r="3.25" ' + eyeFill + '/>';
  }

  function avatarCompanionGlow(cx, cy, ry) {
    ry = ry || 9;
    return '<ellipse class="avatar-companion-glow" cx="' + cx + '" cy="' + (cy + 20) + '" rx="22" ry="' + ry + '" ' + AVATAR_FILL_GLOW + ' opacity="0.48"/>';
  }

  function avatarSymbolPathsForId(avatarId) {
    var id = normalizeAvatar(avatarId);
    var f = AVATAR_FILL_PRIMARY;
    var s = AVATAR_STROKE_SECONDARY;
    var cx = 32;
    var cy = 30;
    var glow = avatarCompanionGlow(cx, cy);
    var eyes = avatarCompanionEyes(cx, cy);

    switch (id) {
      case 'voidorb':
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="18" ' + f + '/>' + eyes;
      case 'tidewarden':
        return glow + '<path d="M32 11 C46 18 47 33 32 43 C17 33 18 18 32 11Z" ' + f + '/>' +
          '<path d="M20 39 Q32 48 44 39" ' + s + ' opacity="0.55"/>' + eyes;
      case 'leafcircuit':
        return glow + '<path d="M32 14 C22 22 20 36 32 42 C44 36 42 22 32 14Z" ' + f + '/>' +
          '<path d="M32 18 v20 M26 24 l12 8 M38 24 l-12 8" ' + s + ' opacity="0.45"/>' + eyes;
      case 'prismcore':
        return glow + '<polygon points="32,10 48,22 42,44 22,44 16,22" ' + f + '/>' +
          '<line x1="32" y1="10" x2="32" y2="44" ' + s + ' opacity="0.35"/>' + eyes;
      case 'moonthread':
        return glow + '<path d="M40 18 A16 16 0 1 1 28 40 A11 11 0 1 0 40 18Z" ' + f + '/>' +
          '<path d="M44 24 Q52 30 46 38" ' + s + ' stroke-linecap="round"/>' + avatarCompanionEyes(30, cy, 5);
      case 'emberveil':
        return glow + '<path d="M32 42 C26 34 24 24 32 14 C40 24 38 34 32 42Z" ' + f + '/>' +
          '<path d="M18 20 Q32 8 46 20" ' + s + ' opacity="0.5"/>' + eyes;
      case 'riftecho':
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="17" ' + f + '/>' +
          '<path d="M26 18 L38 42 M38 18 L26 42" ' + s + ' stroke-width="2" opacity="0.65"/>' + eyes;
      case 'stonebloom':
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="14" ' + f + '/>' +
          '<path d="M32 12 L38 22 L48 24 L40 32 L42 42 L32 36 L22 42 L24 32 L16 24 L26 22Z" ' + s + ' opacity="0.4"/>' + eyes;
      case 'glasswave':
        return glow + '<rect x="14" y="16" width="36" height="28" rx="8" ' + f + ' opacity="0.92"/>' +
          '<path d="M16 30 Q24 24 32 30 T48 30" ' + s + ' opacity="0.55"/>' + eyes;
      case 'ashspiral':
        return glow + '<circle cx="32" cy="30" r="10" ' + f + '/>' +
          '<path d="M32 14 A18 18 0 0 1 44 32 A12 12 0 0 1 32 44 A8 8 0 0 1 24 36" ' + s + ' stroke-width="4" stroke-linecap="round"/>' + eyes;
      case 'coralnode':
        return glow + '<path d="M32 42 V28 M32 28 L22 18 M32 28 L42 18 M22 18 L18 12 M42 18 L46 12" ' + s + ' stroke-width="2.25" stroke-linecap="round"/>' +
          '<circle cx="32" cy="30" r="9" ' + f + '/>' + eyes;
      case 'starlace':
        return glow + '<path d="M32 12 L36 24 L48 24 L38 32 L42 44 L32 36 L22 44 L26 32 L16 24 L28 24Z" ' + f + '/>' + eyes;
      case 'mistveil':
        return glow + '<ellipse cx="24" cy="30" rx="11" ry="8" ' + f + ' opacity="0.75"/>' +
          '<ellipse cx="38" cy="28" rx="12" ry="9" ' + f + ' opacity="0.85"/>' +
          '<ellipse cx="32" cy="34" rx="14" ry="10" ' + f + '/>' + eyes;
      case 'thornloop':
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="15" ' + f + '/>' +
          '<path d="M32 10 v6 M32 44 v6 M10 30 h6 M50 30 h6 M18 18 l4 4 M46 18 l-4 4 M18 42 l4-4 M46 42 l-4-4" ' + s + ' stroke-linecap="round"/>' + eyes;
      case 'sunwarden':
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="13" ' + f + '/>' +
          '<path d="M32 8 v5 M32 47 v5 M8 30 h5 M51 30 h5 M15 15 l3.5 3.5 M45.5 45.5 l-3.5-3.5 M49 15 l-3.5 3.5 M15 45 l3.5-3.5" ' + s + ' stroke-linecap="round"/>' + eyes;
      case 'duskmantle':
        return glow + '<path d="M14 34 A18 18 0 0 1 50 34 V44 H14Z" ' + f + '/>' +
          '<path d="M14 34 Q32 18 50 34" ' + s + ' opacity="0.45"/>' + avatarCompanionEyes(cx, 28, 6);
      case 'ironbloom':
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="11" ' + f + '/>' +
          '<path d="M32 12 v6 M32 42 v6 M12 30 h6 M46 30 h6 M18 18 l4 4 M46 18 l-4 4 M18 42 l4-4 M46 42 l-4-4" ' + s + '/>' +
          '<circle cx="32" cy="30" r="16" ' + s + ' opacity="0.35"/>' + eyes;
      case 'vortexseed':
        return glow + '<path d="M32 14 C42 20 44 32 32 42 C20 32 22 20 32 14Z" ' + f + '/>' +
          '<path d="M32 18 C38 22 38 30 32 34 C26 30 26 22 32 18Z" ' + AVATAR_FILL_SECONDARY + ' opacity="0.35"/>' + eyes;
      case 'lumenshard':
        return glow + '<path d="M32 10 L42 44 L32 38 L22 44Z" ' + f + '/>' +
          '<path d="M32 16 L36 36 L32 33 L28 36Z" ' + AVATAR_FILL_SECONDARY + ' opacity="0.3"/>' + eyes;
      case 'driftmoss':
        return glow + '<ellipse cx="' + cx + '" cy="' + (cy + 4) + '" rx="20" ry="12" ' + f + '/>' +
          '<path d="M18 34 Q26 28 32 34 T46 34" ' + s + ' opacity="0.4"/>' + avatarCompanionEyes(cx, 26, 6);
      default:
        return glow + '<circle cx="' + cx + '" cy="' + cy + '" r="16" ' + f + '/>' + eyes;
    }
  }

  function avatarSymbolPaths(idx) {
    var id = AVATAR_IDS[idx];
    return id ? avatarSymbolPathsForId(id) : avatarSymbolPathsForId('voidorb');
  }

  function avatarRngFromSeed(seed) {
    if (shared().createMulberry32 && shared().hashAvatarSeed) {
      return shared().createMulberry32(shared().hashAvatarSeed(seed));
    }
    var n = 0;
    var s = String(seed || '');
    for (var i = 0; i < s.length; i++) n = ((n << 5) - n + s.charCodeAt(i)) | 0;
    return function () {
      n = (n * 1664525 + 1013904223) | 0;
      return ((n >>> 0) & 0xfffffff) / 0x10000000;
    };
  }

  function avatarFaceFeaturesMarkup(rng, cx, faceCy, faceRx, faceRy) {
    var eyeFill = AVATAR_FILL_EYE;
    var strokeEye = AVATAR_STROKE_EYE;
    var gap = 4 + rng() * 4;
    var eyeY = faceCy - 1;
    var eyes = '';
    var eyeStyle = Math.floor(rng() * 4);
    if (eyeStyle === 0) {
      eyes = avatarCompanionEyes(cx, eyeY, gap);
    } else if (eyeStyle === 1) {
      eyes = '<path d="M' + (cx - gap - 2) + ' ' + (eyeY + 1) + ' Q' + (cx - gap) + ' ' + (eyeY - 5) + ' ' + (cx - gap + 2) + ' ' + (eyeY + 1) + '" ' + strokeEye + ' stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (cx + gap - 2) + ' ' + (eyeY + 1) + ' Q' + (cx + gap) + ' ' + (eyeY - 5) + ' ' + (cx + gap + 2) + ' ' + (eyeY + 1) + '" ' + strokeEye + ' stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    } else if (eyeStyle === 2) {
      eyes = '<circle cx="' + (cx - gap) + '" cy="' + eyeY + '" r="' + (2.4 + rng()).toFixed(1) + '" ' + eyeFill + '/>' +
        '<circle cx="' + (cx + gap) + '" cy="' + eyeY + '" r="' + (2.4 + rng()).toFixed(1) + '" ' + eyeFill + '/>' +
        '<circle cx="' + (cx - gap + 1) + '" cy="' + (eyeY - 1) + '" r="0.9" fill="#fff" opacity="0.75"/>';
    } else {
      eyes = '<ellipse cx="' + (cx - gap) + '" cy="' + eyeY + '" rx="2.8" ry="3.4" ' + eyeFill + '/>' +
        '<ellipse cx="' + (cx + gap) + '" cy="' + eyeY + '" rx="2.8" ry="3.4" ' + eyeFill + '/>';
    }

    var mouth = '';
    var mouthType = Math.floor(rng() * 4);
    var mouthY = faceCy + faceRy * 0.42;
    if (mouthType === 0) {
      mouth = '<path d="M' + (cx - 5 - rng() * 2) + ' ' + mouthY + ' Q' + cx + ' ' + (mouthY + 4 + rng() * 2) + ' ' + (cx + 5 + rng() * 2) + ' ' + mouthY + '" ' + strokeEye + ' stroke-width="1.35" fill="none" stroke-linecap="round"/>';
    } else if (mouthType === 1) {
      mouth = '<ellipse cx="' + cx + '" cy="' + (mouthY + 1) + '" rx="2.2" ry="1.6" ' + eyeFill + ' opacity="0.85"/>';
    } else if (mouthType === 2) {
      mouth = '<line x1="' + (cx - 4) + '" y1="' + mouthY + '" x2="' + (cx + 4) + '" y2="' + mouthY + '" ' + strokeEye + ' stroke-width="1.35" stroke-linecap="round"/>';
    }

    return eyes + mouth;
  }

  var AVATAR_MOTION_IDS = ['float', 'breathe', 'tilt', 'sparkle', 'wiggle', 'blink'];

  function pickAvatarAccessoryType(rng) {
    var roll = rng();
    if (roll < 0.35) return 'none';
    if (roll < 0.53) return 'glasses';
    if (roll < 0.65) return 'sunglasses';
    if (roll < 0.77) return rng() > 0.5 ? 'cap' : 'beanie';
    if (roll < 0.85) return rng() > 0.5 ? 'crown' : 'halo';
    if (roll < 0.93) return rng() > 0.5 ? 'scarf' : 'bow';
    return rng() > 0.5 ? 'headphones' : 'sparkleOrbit';
  }

  function avatarAccessoryMarkup(rng, cx, faceCy, faceRx, faceRy, bodyY) {
    var type = pickAvatarAccessoryType(rng);
    var stroke = 'stroke="currentColor" stroke-width="1.45" fill="none" stroke-linecap="round" stroke-linejoin="round"';
    var fill = 'fill="currentColor"';
    var eye = AVATAR_FILL_EYE;
    var topY = faceCy - faceRy;
    var midY = faceCy - 1;
    var leftX = cx - faceRx * 0.62;
    var rightX = cx + faceRx * 0.62;

    switch (type) {
      case 'glasses':
        return '<g class="avatar-accessory avatar-accessory--glasses">' +
          '<circle cx="' + leftX.toFixed(1) + '" cy="' + midY.toFixed(1) + '" r="4.2" ' + stroke + '/>' +
          '<circle cx="' + rightX.toFixed(1) + '" cy="' + midY.toFixed(1) + '" r="4.2" ' + stroke + '/>' +
          '<path d="M' + (leftX + 4.2).toFixed(1) + ' ' + midY.toFixed(1) + ' H' + (rightX - 4.2).toFixed(1) + '" ' + stroke + ' opacity="0.8"/>' +
        '</g>';
      case 'sunglasses':
        return '<g class="avatar-accessory avatar-accessory--sunglasses">' +
          '<path d="M' + (leftX - 5).toFixed(1) + ' ' + (midY - 3).toFixed(1) + ' h9 q2 0 1.2 3.8 q-0.8 3.8-4.8 3.8 q-4 0-5.4-7.6Z" ' + eye + ' opacity="0.88"/>' +
          '<path d="M' + (rightX - 4).toFixed(1) + ' ' + (midY - 3).toFixed(1) + ' h9 q-1.4 7.6-5.4 7.6 q-4 0-4.8-3.8 q-0.8-3.8 1.2-3.8Z" ' + eye + ' opacity="0.88"/>' +
        '</g>';
      case 'cap':
        return '<g class="avatar-accessory avatar-accessory--cap">' +
          '<path d="M' + (cx - faceRx - 2).toFixed(1) + ' ' + (topY + 3).toFixed(1) + ' Q' + cx + ' ' + (topY - 8).toFixed(1) + ' ' + (cx + faceRx + 2).toFixed(1) + ' ' + (topY + 3).toFixed(1) + ' Q' + cx + ' ' + (topY + 9).toFixed(1) + ' ' + (cx - faceRx - 2).toFixed(1) + ' ' + (topY + 3).toFixed(1) + 'Z" ' + fill + ' opacity="0.62"/>' +
        '</g>';
      case 'beanie':
        return '<g class="avatar-accessory avatar-accessory--beanie">' +
          '<path d="M' + (cx - faceRx - 1).toFixed(1) + ' ' + (topY + 4).toFixed(1) + ' Q' + cx + ' ' + (topY - 10).toFixed(1) + ' ' + (cx + faceRx + 1).toFixed(1) + ' ' + (topY + 4).toFixed(1) + ' v5 H' + (cx - faceRx - 1).toFixed(1) + 'Z" ' + fill + ' opacity="0.55"/>' +
          '<circle cx="' + cx + '" cy="' + (topY - 8).toFixed(1) + '" r="2.7" ' + fill + ' opacity="0.72"/>' +
        '</g>';
      case 'crown':
        return '<g class="avatar-accessory avatar-accessory--crown">' +
          '<path d="M' + (cx - 10) + ' ' + (topY + 4).toFixed(1) + ' l4-8 l6 7 l6-7 l4 8 v5 h-20Z" ' + stroke + ' fill="currentColor" fill-opacity="0.18"/>' +
        '</g>';
      case 'halo':
        return '<g class="avatar-accessory avatar-accessory--halo">' +
          '<ellipse cx="' + cx + '" cy="' + (topY - 5).toFixed(1) + '" rx="' + (faceRx * 0.8).toFixed(1) + '" ry="3.2" ' + stroke + ' opacity="0.58"/>' +
        '</g>';
      case 'bow':
        return '<g class="avatar-accessory avatar-accessory--bow">' +
          '<path d="M' + (cx - faceRx).toFixed(1) + ' ' + (topY + 7).toFixed(1) + ' q-7-5-9 2 q3 5 9-2Z" ' + fill + ' opacity="0.55"/>' +
          '<path d="M' + (cx - faceRx).toFixed(1) + ' ' + (topY + 7).toFixed(1) + ' q7-5 9 2 q-3 5-9-2Z" ' + fill + ' opacity="0.75"/>' +
        '</g>';
      case 'scarf':
        return '<g class="avatar-accessory avatar-accessory--scarf">' +
          '<path d="M' + (cx - faceRx * 0.8).toFixed(1) + ' ' + (bodyY + 1).toFixed(1) + ' Q' + cx + ' ' + (bodyY + 5).toFixed(1) + ' ' + (cx + faceRx * 0.8).toFixed(1) + ' ' + (bodyY + 1).toFixed(1) + '" ' + stroke + ' stroke-width="3" opacity="0.58"/>' +
        '</g>';
      case 'headphones':
        return '<g class="avatar-accessory avatar-accessory--headphones">' +
          '<path d="M' + (cx - faceRx - 3).toFixed(1) + ' ' + (midY + 1).toFixed(1) + ' Q' + cx + ' ' + (topY - 9).toFixed(1) + ' ' + (cx + faceRx + 3).toFixed(1) + ' ' + (midY + 1).toFixed(1) + '" ' + stroke + ' opacity="0.62"/>' +
          '<rect x="' + (cx - faceRx - 5).toFixed(1) + '" y="' + (midY - 1).toFixed(1) + '" width="5" height="10" rx="2.4" ' + fill + ' opacity="0.52"/>' +
          '<rect x="' + (cx + faceRx).toFixed(1) + '" y="' + (midY - 1).toFixed(1) + '" width="5" height="10" rx="2.4" ' + fill + ' opacity="0.52"/>' +
        '</g>';
      case 'sparkleOrbit':
        return '<g class="avatar-accessory avatar-accessory--sparkle-orbit">' +
          '<path d="M' + (cx + faceRx + 5).toFixed(1) + ' ' + (topY + 5).toFixed(1) + ' l1.6 3.2 3.4 1.2-3.4 1.2-1.6 3.2-1.6-3.2-3.4-1.2 3.4-1.2Z" ' + fill + ' opacity="0.58"/>' +
        '</g>';
      default:
        return '';
    }
  }

  function avatarMotionFromSeed(seed) {
    var rng = avatarRngFromSeed(String(seed || '') + ':motion');
    return AVATAR_MOTION_IDS[Math.floor(rng() * AVATAR_MOTION_IDS.length)] || 'float';
  }

  function randomRenderMotion() {
    return AVATAR_MOTION_IDS[Math.floor(Math.random() * AVATAR_MOTION_IDS.length)] || 'float';
  }

  function setAvatarMotion(shell, seed, forceNew) {
    if (!shell) return;
    var motion = forceNew ? randomRenderMotion() : avatarMotionFromSeed(seed);
    AVATAR_MOTION_IDS.forEach(function (id) {
      shell.classList.remove('avatar-random-shell--motion-' + id);
    });
    shell.classList.add('avatar-random-shell--motion-' + motion);
    shell.setAttribute('data-avatar-motion', motion);
  }

  function setHeaderAvatarMotion(el, seed) {
    if (!el) return;
    var motion = seed ? avatarMotionFromSeed(seed) : 'float';
    AVATAR_MOTION_IDS.forEach(function (id) {
      el.classList.remove('profile-avatar-header--motion-' + id);
    });
    el.classList.add('profile-avatar-header--motion-' + motion);
    el.setAttribute('data-avatar-motion', motion);
  }

  function avatarSymbolPathsFromSeed(seed) {
    var rng = avatarRngFromSeed(seed);
    var cx = 32;
    var f = AVATAR_FILL_PRIMARY;
    var s = AVATAR_STROKE_SECONDARY;
    var glow = avatarCompanionGlow(cx, 28 + rng() * 4, 7 + rng() * 6);

    var faceRx = 9 + rng() * 5;
    var faceRy = 10 + rng() * 6;
    var faceCy = 22 + rng() * 4;
    var face = '<ellipse class="avatar-generated-face" cx="' + cx + '" cy="' + faceCy.toFixed(1) + '" rx="' + faceRx.toFixed(1) + '" ry="' + faceRy.toFixed(1) + '" ' + f + '/>';
    var features = avatarFaceFeaturesMarkup(rng, cx, faceCy, faceRx, faceRy);

    var bodyType = Math.floor(rng() * 9);
    var bodyY = faceCy + faceRy;
    var body = '';
    switch (bodyType) {
      case 0:
        body = '<ellipse cx="' + cx + '" cy="' + (bodyY + 10).toFixed(1) + '" rx="' + (12 + rng() * 10).toFixed(1) + '" ry="' + (7 + rng() * 6).toFixed(1) + '" ' + f + ' opacity="0.88"/>';
        break;
      case 1:
        body = '<path d="M' + (cx - 16 - rng() * 4) + ' ' + (bodyY + 4) + ' Q' + cx + ' ' + (bodyY - 6) + ' ' + (cx + 16 + rng() * 4) + ' ' + (bodyY + 4) + ' V' + (bodyY + 18 + rng() * 6) + ' H' + (cx - 16) + ' Z" ' + f + '/>';
        break;
      case 2:
        body = '<rect x="' + (cx - 14 - rng() * 4).toFixed(1) + '" y="' + (bodyY - 2).toFixed(1) + '" width="' + (28 + rng() * 8).toFixed(1) + '" height="' + (16 + rng() * 8).toFixed(1) + '" rx="8" ' + f + ' opacity="0.9"/>';
        break;
      case 3:
        body = '<path d="M32 ' + (bodyY - 4).toFixed(1) + ' C' + (cx + 18).toFixed(1) + ' ' + (bodyY + 2).toFixed(1) + ' ' + (cx + 14).toFixed(1) + ' ' + (bodyY + 20).toFixed(1) + ' 32 ' + (bodyY + 20).toFixed(1) +
          ' C' + (cx - 14).toFixed(1) + ' ' + (bodyY + 20).toFixed(1) + ' ' + (cx - 18).toFixed(1) + ' ' + (bodyY + 2).toFixed(1) + ' 32 ' + (bodyY - 4).toFixed(1) + 'Z" ' + f + '/>';
        break;
      case 4:
        body = '<path d="M32 ' + (bodyY - 8).toFixed(1) + ' L' + (cx + 12).toFixed(1) + ' ' + (bodyY + 16).toFixed(1) + ' L' + (cx - 12).toFixed(1) + ' ' + (bodyY + 16).toFixed(1) + ' Z" ' + f + '/>';
        break;
      case 5:
        body = '<ellipse cx="24" cy="' + (bodyY + 8).toFixed(1) + '" rx="' + (8 + rng() * 4).toFixed(1) + '" ry="' + (6 + rng() * 3).toFixed(1) + '" ' + f + ' opacity="0.72"/>' +
          '<ellipse cx="40" cy="' + (bodyY + 6).toFixed(1) + '" rx="' + (9 + rng() * 4).toFixed(1) + '" ry="' + (7 + rng() * 3).toFixed(1) + '" ' + f + ' opacity="0.82"/>' +
          '<ellipse cx="' + cx + '" cy="' + (bodyY + 12).toFixed(1) + '" rx="' + (12 + rng() * 4).toFixed(1) + '" ry="' + (8 + rng() * 3).toFixed(1) + '" ' + f + '/>';
        break;
      case 6:
        body = '<circle cx="' + cx + '" cy="' + (bodyY + 8).toFixed(1) + '" r="' + (10 + rng() * 8).toFixed(1) + '" ' + f + '/>' +
          '<path d="M' + (cx - 10) + ' ' + (bodyY - 2) + ' L' + (cx + 10) + ' ' + (bodyY + 18) + ' M' + (cx + 10) + ' ' + (bodyY - 2) + ' L' + (cx - 10) + ' ' + (bodyY + 18) + '" ' + s + ' opacity="0.55"/>';
        break;
      case 7:
        body = '<path d="M32 ' + (bodyY - 2).toFixed(1) + ' C' + (cx + 20).toFixed(1) + ' ' + (bodyY + 4).toFixed(1) + ' ' + (cx + 16).toFixed(1) + ' ' + (bodyY + 22).toFixed(1) + ' 32 ' + (bodyY + 22).toFixed(1) +
          ' C' + (cx - 16).toFixed(1) + ' ' + (bodyY + 22).toFixed(1) + ' ' + (cx - 20).toFixed(1) + ' ' + (bodyY + 4).toFixed(1) + ' 32 ' + (bodyY - 2).toFixed(1) + 'Z" ' + f + '/>' +
          '<path d="M32 ' + (bodyY + 2).toFixed(1) + ' C' + (cx + 10).toFixed(1) + ' ' + (bodyY + 8).toFixed(1) + ' ' + (cx + 8).toFixed(1) + ' ' + (bodyY + 16).toFixed(1) + ' 32 ' + (bodyY + 16).toFixed(1) +
          ' C' + (cx - 8).toFixed(1) + ' ' + (bodyY + 16).toFixed(1) + ' ' + (cx - 10).toFixed(1) + ' ' + (bodyY + 8).toFixed(1) + ' 32 ' + (bodyY + 2).toFixed(1) + 'Z" ' + AVATAR_FILL_SECONDARY + ' opacity="0.32"/>';
        break;
      default:
        body = '<path d="M32 ' + (bodyY - 6).toFixed(1) + ' L' + (cx + 14).toFixed(1) + ' ' + (bodyY + 14).toFixed(1) + ' L' + (cx - 14).toFixed(1) + ' ' + (bodyY + 14).toFixed(1) + ' Z" ' + f + '/>' +
          '<path d="M32 ' + (bodyY - 2).toFixed(1) + ' L36 ' + (bodyY + 10).toFixed(1) + ' L28 ' + (bodyY + 10).toFixed(1) + ' Z" ' + AVATAR_FILL_SECONDARY + ' opacity="0.28"/>';
        break;
    }

    var accent = '';
    if (rng() > 0.55) {
      var rayCount = 4 + Math.floor(rng() * 5);
      for (var ri = 0; ri < rayCount; ri++) {
        var angle = (ri / rayCount) * Math.PI * 2;
        var x1 = cx + Math.cos(angle) * (faceRy + 6);
        var y1 = faceCy + Math.sin(angle) * (faceRy + 6);
        var x2 = cx + Math.cos(angle) * (faceRy + 12 + rng() * 4);
        var y2 = faceCy + Math.sin(angle) * (faceRy + 12 + rng() * 4);
        accent += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" ' + s + ' stroke-linecap="round" opacity="0.45"/>';
      }
    }

    var accessories = avatarAccessoryMarkup(rng, cx, faceCy, faceRx, faceRy, bodyY);

    return glow +
      '<g class="avatar-generated-character">' +
        '<g class="avatar-generated-body">' + body + '</g>' +
        '<g class="avatar-generated-accent">' + accent + '</g>' +
        face +
        '<g class="avatar-generated-features">' + features + '</g>' +
        accessories +
      '</g>';
  }

  function generatedIconIdFromSeed(seed) {
    var slug = shared().generatedAvatarIconSlug ? shared().generatedAvatarIconSlug(seed) : String(seed || '').replace(/[^a-zA-Z0-9_-]/g, '');
    return 'icon-gen-' + (slug || '0');
  }

  function ensureGeneratedAvatarSymbol(seed) {
    if (!seed) return false;
    var svg = document.querySelector('.rianell-icon-sprite');
    if (!svg) return false;
    appendSymbol(svg, generatedIconIdFromSeed(seed), '0 0 64 64', avatarSymbolPathsFromSeed(seed));
    return true;
  }

  function isGeneratedAvatarId(avatarId) {
    return shared().isGeneratedProfileAvatar ? shared().isGeneratedProfileAvatar(avatarId) : false;
  }

  function parseGeneratedSeed(avatarId) {
    return shared().parseGeneratedAvatarSeed ? shared().parseGeneratedAvatarSeed(avatarId) : null;
  }

  function buildGeneratedAvatarId(seed) {
    return shared().buildGeneratedProfileAvatarId ? shared().buildGeneratedProfileAvatarId(seed) : ('gen:' + seed);
  }

  function createRandomAvatarSeed() {
    return shared().createRandomAvatarSeed ? shared().createRandomAvatarSeed() : String(Date.now());
  }

  function avatarNameFromSeed(seed) {
    return shared().generateAvatarNameFromSeed ? shared().generateAvatarNameFromSeed(seed) : String(seed || 'Companion');
  }

  function metricEntityPaths(id) {
    var stroke = 'stroke="currentColor" stroke-width="1.5" fill="none"';
    var fill = 'fill="currentColor"';
    switch (id) {
      case 'mood': return '<circle cx="16" cy="16" r="10" ' + stroke + '/><path d="M10 14 Q16 20 22 14" ' + stroke + '/>';
      case 'sleep': return '<path d="M22 10 A10 10 0 1 1 12 22" ' + fill + ' opacity="0.85"/>';
      case 'fatigue': return '<rect x="8" y="14" width="16" height="4" rx="2" ' + fill + '/><rect x="10" y="10" width="12" height="4" rx="2" ' + fill + ' opacity="0.6"/>';
      case 'pain': return '<path d="M16 6 L18 14 L26 14 L20 19 L22 27 L16 22 L10 27 L12 19 L6 14 L14 14Z" ' + fill + '/>';
      case 'mobility': return '<circle cx="8" cy="24" r="3" ' + fill + '/><circle cx="24" cy="8" r="3" ' + fill + '/><path d="M10 22 L22 10" ' + stroke + '/>';
      case 'stiffness': return '<path d="M8 8 L24 24 M24 8 L8 24" ' + stroke + '/><circle cx="16" cy="16" r="4" ' + fill + '/>';
      case 'swelling': return '<path d="M14 6 v6 M12 12 C10 16 10 22 12 26" ' + stroke + ' stroke-width="2"/><path d="M13 26 Q14 28 17 30" ' + stroke + ' stroke-width="1.8"/><ellipse cx="15" cy="24" rx="5" ry="6" ' + fill + ' opacity="0.55"/><ellipse cx="18" cy="23" rx="3" ry="4" ' + stroke + '/>';
      case 'steps': return '<path d="M10 22 L14 10 L18 18 L22 6" ' + stroke + ' stroke-linecap="round"/><circle cx="22" cy="6" r="2" ' + fill + '/>';
      case 'hydration': return '<path d="M16 6 C12 14 10 18 10 22 a6 6 0 0 0 12 0 c0-4-2-8-6-16Z" ' + fill + ' opacity="0.8"/>';
      case 'bpm': return '<path d="M6 16 H10 L13 8 L19 24 L22 16 H26" ' + stroke + ' stroke-linecap="round"/>';
      case 'flare': return '<path d="M16 4 L18 14 L28 14 L20 20 L23 30 L16 24 L9 30 L12 20 L4 14 L14 14Z" ' + fill + '/>';
      case 'dailyFunction': return '<rect x="6" y="8" width="20" height="16" rx="2" ' + stroke + '/><path d="M10 14 h12 M10 18 h8" ' + stroke + '/>';
      case 'irritability': return '<circle cx="16" cy="20" r="9" ' + stroke + '/><path d="M12 18 Q16 16 20 18" ' + stroke + '/><ellipse cx="16" cy="10" rx="8" ry="4.5" ' + stroke + '/><path d="M22 6 v4 M22 4 h3" ' + stroke + ' stroke-linecap="round"/>';
      case 'weatherSensitivity': return '<ellipse cx="16" cy="18" rx="10" ry="6" ' + stroke + '/><path d="M10 12 h12" ' + stroke + '/><circle cx="16" cy="10" r="4" ' + fill + ' opacity="0.7"/>';
      default: return '<circle cx="16" cy="16" r="8" ' + fill + '/>';
    }
  }

  function badgeFramePaths(id) {
    var stroke = 'stroke="currentColor" stroke-width="1.5" fill="none"';
    switch (id) {
      case 'food_logging': return '<circle cx="32" cy="32" r="28" ' + stroke + '/><path d="M20 20 h8 v12 h-8z M36 18 h8 v14 h-8z" fill="currentColor"/>';
      case 'exercise_logging': return '<polygon points="32,6 56,20 48,54 16,54 8,20" ' + stroke + '/><path d="M22 32 h20" ' + stroke + '/>';
      case 'medication_logging': return '<rect x="14" y="26" width="36" height="12" rx="6" ' + stroke + '/><line x1="32" y1="27" x2="32" y2="37" ' + stroke + ' opacity="0.45"/>';
      case 'milestone_3': return '<path d="M30 14 v36 L12 36 V18 Z" ' + stroke + '/><path d="M34 14 v36 L52 36 V18 Z" ' + stroke + '/><line x1="32" y1="16" x2="32" y2="48" ' + stroke + ' opacity="0.35"/>';
      case 'milestone_30': return '<circle cx="32" cy="32" r="26" ' + stroke + ' stroke-dasharray="4 3"/><text x="32" y="38" text-anchor="middle" font-size="16" fill="currentColor">30</text>';
      case 'milestone_60': return '<rect x="8" y="8" width="48" height="48" rx="24" ' + stroke + '/><text x="32" y="38" text-anchor="middle" font-size="16" fill="currentColor">60</text>';
      case 'milestone_90': return '<polygon points="32,4 60,32 32,60 4,32" ' + stroke + '/><text x="32" y="38" text-anchor="middle" font-size="16" fill="currentColor">90</text>';
      case 'milestone_180': return '<circle cx="32" cy="32" r="28" ' + stroke + '/><circle cx="32" cy="32" r="20" ' + stroke + '/><text x="32" y="38" text-anchor="middle" font-size="14" fill="currentColor">180</text>';
      case 'sleep_pioneer': return '<path d="M40 14 A14 14 0 1 1 22 34" ' + stroke + '/><circle cx="32" cy="32" r="26" ' + stroke + '/>';
      case 'cycle_tracker': return '<circle cx="32" cy="32" r="26" ' + stroke + '/><path d="M32 6 v8 M32 50 v8 M6 32 h8 M50 32 h8" ' + stroke + '/>';
      case 'full_logger': return '<path d="M32 4 l6 14 h14 l-11 9 4 14-13-8-13 8 4-14-11-9 h14z" fill="currentColor" opacity="0.9"/>';
      default: return '<circle cx="32" cy="32" r="26" ' + stroke + '/>';
    }
  }

  function achCalGridMarkup(ox, oy, cols, rows, cellW, cellH, activeCount, delayOffset) {
    var out = '';
    var total = cols * rows;
    var baseDelay = delayOffset || 0;
    for (var i = 0; i < total; i++) {
      var c = i % cols;
      var r = Math.floor(i / cols);
      var active = i < activeCount;
      var delay = active ? ' style="animation-delay:' + (baseDelay + i * 0.06).toFixed(2) + 's"' : '';
      out += '<rect class="ach-cal-cell' + (active ? ' ach-cal-cell--active' : '') + '"' + delay +
        ' x="' + (ox + c * cellW) + '" y="' + (oy + r * cellH) +
        '" width="' + (cellW - 1.1) + '" height="' + (cellH - 1.1) + '" rx="1"/>';
    }
    return out;
  }

  function achievementIconSvgMarkup(id) {
    var fill = 'fill="currentColor"';
    var stroke = 'stroke="currentColor" stroke-width="1.5" fill="none"';
    switch (id) {
      case 'food_logging':
        return '<g class="ach-icon ach-icon--food_logging">' +
          '<ellipse class="ach-food-plate" cx="32" cy="40" rx="23" ry="7" ' + fill + ' opacity="0.2"/>' +
          '<ellipse class="ach-food-plate-rim" cx="32" cy="38" rx="21" ry="6" ' + stroke + '/>' +
          '<ellipse class="ach-food-mound" cx="32" cy="35" rx="13" ry="6" ' + fill + ' opacity="0.85"/>' +
          '<path class="ach-food-sauce" d="M25 31 Q27 37 24 43" ' + stroke + ' stroke-width="2" stroke-linecap="round"/>' +
          '<path class="ach-food-steam ach-food-steam--1" d="M23 20 Q21 14 23 9" ' + stroke + ' stroke-linecap="round"/>' +
          '<path class="ach-food-steam ach-food-steam--2" d="M32 18 Q30 12 32 6" ' + stroke + ' stroke-linecap="round"/>' +
          '<path class="ach-food-steam ach-food-steam--3" d="M41 20 Q43 14 41 9" ' + stroke + ' stroke-linecap="round"/>' +
          '</g>';
      case 'exercise_logging':
        return '<g class="ach-icon ach-icon--exercise_logging">' +
          '<rect class="ach-pool" x="5" y="26" width="54" height="30" rx="5" ' + stroke + '/>' +
          '<path class="ach-pool-wave ach-pool-wave--1" d="M5 34 Q15 30 25 34 T45 34 T55 34" ' + stroke + ' stroke-width="1.75"/>' +
          '<path class="ach-pool-wave ach-pool-wave--2" d="M5 42 Q15 38 25 42 T45 42 T55 42" ' + stroke + ' stroke-width="1.5" opacity="0.7"/>' +
          '<g class="ach-swimmer">' +
          '<ellipse cx="32" cy="33" rx="6" ry="2.5" ' + fill + ' opacity="0.75"/>' +
          '<circle cx="32" cy="29" r="3.5" ' + fill + '/>' +
          '<path d="M26 33 L20 37" ' + stroke + ' stroke-linecap="round"/>' +
          '<path d="M38 33 L44 37" ' + stroke + ' stroke-linecap="round"/>' +
          '<path d="M28 35 L23 40" ' + stroke + ' stroke-linecap="round"/>' +
          '<path d="M36 35 L41 40" ' + stroke + ' stroke-linecap="round"/>' +
          '</g></g>';
      case 'medication_logging':
        return '<g class="ach-icon ach-icon--medication_logging">' +
          '<g class="ach-pill-spin">' +
          '<rect class="ach-pill-body" x="14" y="26" width="36" height="12" rx="6" ' + stroke + '/>' +
          '<rect class="ach-pill-half ach-pill-half--left" x="15" y="27" width="16" height="10" rx="5" ' + fill + ' opacity="0.72"/>' +
          '<rect class="ach-pill-half ach-pill-half--right" x="31" y="27" width="16" height="10" rx="5" ' + fill + '/>' +
          '<line class="ach-pill-score" x1="32" y1="27" x2="32" y2="37" stroke="rgba(255,255,255,0.55)" stroke-width="0.85"/>' +
          '</g></g>';
      case 'milestone_3':
        return '<g class="ach-icon ach-icon--milestone_3">' +
          '<ellipse class="ach-book-shadow" cx="32" cy="52" rx="20" ry="5" fill="currentColor" opacity="0.12"/>' +
          '<g class="ach-book ach-book--self-opening">' +
          '<path class="ach-book-cover ach-book-cover--left" d="M32 14 L12 18 L12 46 L32 50 Z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.14"/>' +
          '<path class="ach-book-cover ach-book-cover--right" d="M32 14 L52 18 L52 46 L32 50 Z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.14"/>' +
          '<path class="ach-book-pages ach-book-pages--left" d="M30 18 v28 M27 20 v24 M24 22 v20" stroke="currentColor" stroke-width="0.9" opacity="0.35"/>' +
          '<path class="ach-book-pages ach-book-pages--right" d="M34 18 v28 M37 20 v24 M40 22 v20" stroke="currentColor" stroke-width="0.9" opacity="0.35"/>' +
          '<path class="ach-book-page ach-book-page--turning" d="M32 16 v32" stroke="currentColor" stroke-width="1.2" opacity="0.55"/>' +
          '<rect class="ach-book-spine" x="30" y="14" width="4" height="36" rx="1" fill="currentColor" opacity="0.55"/>' +
          '</g></g>';
      case 'milestone_30':
        return '<g class="ach-icon ach-icon--milestone_30">' +
          '<rect class="ach-cal-frame" x="10" y="8" width="44" height="48" rx="3" ' + stroke + '/>' +
          '<rect x="10" y="8" width="44" height="10" rx="3" ' + fill + ' opacity="0.22"/>' +
          achCalGridMarkup(13, 21, 6, 5, 6.5, 6.5, 30) +
          '</g>';
      case 'milestone_60':
        return '<g class="ach-icon ach-icon--milestone_60">' +
          '<g class="ach-cal-duo ach-cal-duo--left">' +
          '<rect x="6" y="14" width="24" height="38" rx="2" ' + stroke + '/>' +
          '<rect x="6" y="14" width="24" height="7" rx="2" ' + fill + ' opacity="0.2"/>' +
          achCalGridMarkup(8, 24, 4, 5, 5, 5.5, 30) +
          '</g>' +
          '<g class="ach-cal-duo ach-cal-duo--right">' +
          '<rect x="34" y="14" width="24" height="38" rx="2" ' + stroke + '/>' +
          '<rect x="34" y="14" width="24" height="7" rx="2" ' + fill + ' opacity="0.2"/>' +
          achCalGridMarkup(36, 24, 4, 5, 5, 5.5, 30, 1.8) +
          '</g></g>';
      case 'milestone_90':
        return '<g class="ach-icon ach-icon--milestone_90">' +
          '<rect class="ach-desk-cal" x="15" y="18" width="34" height="40" rx="2" ' + stroke + '/>' +
          '<rect x="15" y="18" width="34" height="9" rx="2" ' + fill + ' opacity="0.25"/>' +
          '<path d="M21 14 v6 M32 14 v6 M43 14 v6" ' + stroke + ' stroke-linecap="round"/>' +
          '<g class="ach-page ach-page--1"><rect x="17" y="30" width="30" height="24" rx="1" ' + stroke + ' opacity="0.5"/></g>' +
          '<g class="ach-page ach-page--2"><rect x="19" y="28" width="30" height="24" rx="1" ' + stroke + ' opacity="0.35"/></g>' +
          '<g class="ach-page ach-page--fly ach-page--fly-1"><rect x="38" y="22" width="14" height="18" rx="1" ' + stroke + '/></g>' +
          '<g class="ach-page ach-page--fly ach-page--fly-2"><rect x="42" y="18" width="12" height="16" rx="1" ' + stroke + ' opacity="0.6"/></g>' +
          '</g>';
      case 'milestone_180':
        return '<g class="ach-icon ach-icon--milestone_180">' +
          '<rect x="27" y="6" width="10" height="5" rx="2" ' + fill + ' opacity="0.6"/>' +
          '<circle class="ach-stopwatch-face" cx="32" cy="36" r="23" ' + stroke + '/>' +
          '<line class="ach-stopwatch-hand" x1="32" y1="36" x2="32" y2="18" ' + stroke + ' stroke-width="2" stroke-linecap="round"/>' +
          '<circle cx="32" cy="36" r="2.5" ' + fill + '/>' +
          '<text x="32" y="44" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.55">180</text>' +
          '</g>';
      case 'sleep_pioneer':
        return '<g class="ach-icon ach-icon--sleep_pioneer">' +
          '<path class="ach-bed-frame" d="M8 42 h48 v8 H8 Z" ' + stroke + '/>' +
          '<rect x="10" y="32" width="20" height="10" rx="2" ' + fill + ' opacity="0.35"/>' +
          '<path d="M30 40 h22" ' + stroke + ' stroke-linecap="round"/>' +
          '<path d="M12 32 v-4 h16 v4" ' + stroke + '/>' +
          '<text class="ach-zzz ach-zzz--1" x="38" y="26" font-size="9" fill="currentColor">z</text>' +
          '<text class="ach-zzz ach-zzz--2" x="44" y="20" font-size="8" fill="currentColor">z</text>' +
          '<text class="ach-zzz ach-zzz--3" x="34" y="15" font-size="11" font-weight="700" fill="currentColor">Z</text>' +
          '</g>';
      case 'cycle_tracker':
        return '<g class="ach-icon ach-icon--cycle_tracker">' +
          '<rect class="ach-ground" x="6" y="52" width="52" height="4" rx="1" ' + fill + ' opacity="0.25"/>' +
          '<g class="ach-sapling">' +
          '<line x1="32" y1="52" x2="32" y2="44" ' + stroke + ' stroke-width="2"/>' +
          '<circle cx="32" cy="42" r="3.5" ' + fill + ' opacity="0.7"/>' +
          '</g>' +
          '<g class="ach-tree-grow">' +
          '<rect class="ach-trunk" x="30" y="30" width="4" height="22" rx="1" ' + fill + ' opacity="0.65"/>' +
          '<circle class="ach-foliage ach-foliage--1" cx="32" cy="24" r="9" ' + fill + ' opacity="0.55"/>' +
          '<circle class="ach-foliage ach-foliage--2" cx="24" cy="32" r="6" ' + fill + ' opacity="0.45"/>' +
          '<circle class="ach-foliage ach-foliage--3" cx="40" cy="32" r="6" ' + fill + ' opacity="0.45"/>' +
          '</g></g>';
      case 'full_logger':
        return '<g class="ach-icon ach-icon--full_logger">' +
          '<rect class="ach-clipboard" x="13" y="9" width="38" height="46" rx="3" ' + stroke + '/>' +
          '<rect x="23" y="5" width="18" height="7" rx="2" ' + stroke + '/>' +
          '<g class="ach-ticks">' +
          '<path class="ach-tick ach-tick--1" d="M18 24 l4 4 10-10" ' + stroke + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path class="ach-tick ach-tick--2" d="M18 32 l4 4 10-10" ' + stroke + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path class="ach-tick ach-tick--3" d="M18 40 l4 4 10-10" ' + stroke + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path class="ach-tick ach-tick--4" d="M18 48 l4 4 10-10" ' + stroke + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<line class="ach-tick-line ach-tick-line--1" x1="36" y1="24" x2="48" y2="24" ' + stroke + ' opacity="0.35"/>' +
          '<line class="ach-tick-line ach-tick-line--2" x1="36" y1="32" x2="48" y2="32" ' + stroke + ' opacity="0.35"/>' +
          '<line class="ach-tick-line ach-tick-line--3" x1="36" y1="40" x2="48" y2="40" ' + stroke + ' opacity="0.35"/>' +
          '<line class="ach-tick-line ach-tick-line--4" x1="36" y1="48" x2="48" y2="48" ' + stroke + ' opacity="0.35"/>' +
          '</g></g>';
      default:
        return '<circle cx="32" cy="32" r="20" ' + stroke + '/>';
    }
  }

  function renderAchievementIconHTML(achievementId, tier, unlocked) {
    var achId = BADGE_FRAME_IDS.indexOf(achievementId) >= 0 ? achievementId : BADGE_FRAME_IDS[0];
    var tierId = BADGE_TIERS.indexOf(tier) >= 0 ? tier : 'bronze';
    var lockCls = unlocked ? ' graphics-achievement-icon--unlocked' : ' graphics-achievement-icon--locked';
    return '<div class="graphics-achievement-icon graphics-achievement-icon--' + escAttr(achId) +
      ' graphics-achievement-icon--tier-' + escAttr(tierId) + lockCls +
      '" data-achievement="' + escAttr(achId) + '" data-tier="' + escAttr(tierId) + '">' +
      '<svg class="graphics-achievement-icon__svg" viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      achievementIconSvgMarkup(achId) +
      '</svg></div>';
  }

  function tierRingPaths(tier) {
    var stroke = 'stroke="currentColor" stroke-width="2" fill="none"';
    switch (tier) {
      case 'bronze': return '<circle cx="32" cy="32" r="30" ' + stroke + ' opacity="0.9"/>';
      case 'silver': return '<circle cx="32" cy="32" r="30" ' + stroke + '/><circle cx="32" cy="32" r="26" ' + stroke + ' opacity="0.5"/>';
      case 'gold': return '<circle cx="32" cy="32" r="30" ' + stroke + '/><path d="M32 2 L34 8 L40 8 L35 12 L37 18 L32 14 L27 18 L29 12 L24 8 L30 8Z" fill="currentColor" opacity="0.7"/>';
      case 'platinum': return '<circle cx="32" cy="32" r="30" ' + stroke + '/><circle cx="32" cy="32" r="24" ' + stroke + ' stroke-dasharray="3 2"/><circle cx="32" cy="32" r="18" ' + stroke + ' opacity="0.4"/>';
      default: return '<circle cx="32" cy="32" r="30" ' + stroke + '/>';
    }
  }

  function cyclePhasePaths(phase) {
    var stroke = 'stroke="currentColor" stroke-width="1.75" fill="none"';
    switch (phase) {
      case 'menstrual': return '<path d="M16 8 a8 8 0 0 1 0 16 a6 6 0 0 0 0-12 a4 4 0 0 1 0 8" fill="currentColor" opacity="0.85"/>';
      case 'follicular': return '<circle cx="16" cy="16" r="10" ' + stroke + '/><path d="M16 6 v4 M16 22 v4 M6 16 h4 M22 16 h4" ' + stroke + '/>';
      case 'ovulation': return '<circle cx="16" cy="16" r="10" ' + stroke + '/><circle cx="16" cy="16" r="4" fill="currentColor"/>';
      case 'luteal': return '<path d="M16 6 C10 10 8 16 10 22 C12 26 16 28 16 28 S20 26 22 22 C24 16 22 10 16 6Z" fill="currentColor" opacity="0.75"/>';
      default: return '<circle cx="16" cy="16" r="10" ' + stroke + '/>';
    }
  }

  function injectSpriteSymbols() {
    var svg = document.querySelector('.rianell-icon-sprite');
    if (!svg) return false;

    AVATAR_IDS.forEach(function (id, idx) {
      appendSymbol(svg, 'icon-' + id, '0 0 64 64', avatarSymbolPaths(idx));
    });

    METRIC_ENTITY_IDS.forEach(function (id) {
      appendSymbol(svg, 'icon-metric-' + id, '0 0 32 32', metricEntityPaths(id));
    });

    BADGE_FRAME_IDS.forEach(function (id) {
      appendSymbol(svg, 'icon-badge-' + id, '0 0 64 64', badgeFramePaths(id));
    });

    BADGE_TIERS.forEach(function (tier) {
      appendSymbol(svg, 'icon-tier-' + tier, '0 0 64 64', tierRingPaths(tier));
    });

    CYCLE_PHASE_IDS.forEach(function (phase) {
      appendSymbol(svg, 'icon-cycle-' + phase, '0 0 32 32', cyclePhasePaths(phase));
    });

    var settings = global.appSettings || {};
    if (settings.profileAvatar && isGeneratedAvatarId(settings.profileAvatar)) {
      ensureGeneratedAvatarSymbol(parseGeneratedSeed(settings.profileAvatar));
    }

    _spritesInjected = true;
    return true;
  }

  function removeLegacyVibeUi() {
    if (!document.body) return;
    LEGACY_VIBE_CLASS_IDS.forEach(function (id) {
      document.body.classList.remove('vibe-' + id);
    });
    var scene = document.getElementById('vibe-scene');
    if (scene) scene.remove();
  }

  function computeAvatarHealthState(analysis) {
    if (!analysis || typeof analysis !== 'object') return 2;

    var points = 0;
    var count = 0;

    if (analysis.wellbeingScore != null) {
      var ws = Number(analysis.wellbeingScore);
      if (!isNaN(ws)) {
        points += ws >= 75 ? 4 : ws >= 50 ? 3 : ws >= 30 ? 1 : 0;
        count++;
      }
    }

    var flare = analysis.flareRisk
      || (analysis.flareUpRisk && analysis.flareUpRisk.level)
      || null;
    if (flare) {
      var flarePts = flare === 'low' ? 4 : flare === 'moderate' ? 2 : 0;
      points += flarePts;
      count++;
    }

    if (analysis.avgMood != null) {
      var mood = Number(analysis.avgMood);
      if (!isNaN(mood)) {
        points += mood >= 7 ? 4 : mood >= 5 ? 3 : mood >= 3 ? 1 : 0;
        count++;
      }
    }

    if (analysis.avgSleep != null) {
      var sleep = Number(analysis.avgSleep);
      if (!isNaN(sleep)) {
        points += sleep >= 7 ? 4 : sleep >= 5 ? 3 : sleep >= 3 ? 1 : 0;
        count++;
      }
    }

    if (!count) return 2;
    var avg = points / count;
    if (avg >= 3.5) return 4;
    if (avg >= 2.5) return 3;
    if (avg >= 1.5) return 2;
    if (avg >= 0.75) return 1;
    return 0;
  }

  function applyAvatarHealthState(level) {
    var n = Math.max(0, Math.min(4, parseInt(level, 10) || 0));
    document.documentElement.style.setProperty('--avatar-health-state', String(n));
    document.documentElement.setAttribute('data-health-state', String(n));
    return n;
  }

  function renderAvatarSvgUse(avatarId, className, title) {
    var rawId = typeof avatarId === 'string' ? avatarId.trim() : '';
    var cls = className ? ' class="' + escAttr(className) + '"' : '';
    // Glyph SVGs are always decorative: parents expose the companion name via
    // aria-label. Nested image roles previously triggered broken-image chrome
    // above the glyph when CSS paint vars were incomplete.
    var open = '<svg' + cls + ' viewBox="0 0 64 64" aria-hidden="true">';
    if (isGeneratedAvatarId(rawId)) {
      var genSeed = parseGeneratedSeed(rawId);
      ensureGeneratedAvatarSymbol(genSeed);
      return open + avatarSymbolPathsFromSeed(genSeed) + '</svg>';
    }
    var iconRef = normalizeAvatar(rawId);
    return open + '<use href="#icon-' + escAttr(iconRef) + '"></use></svg>';
  }

  function avatarCarouselNavIcon(direction) {
    if (direction === 'left') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 L9 12 L15 18" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 L15 12 L9 18" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function renderAvatarCarouselHTML(selectedId, options) {
    options = options || {};
    var sel = normalizeAvatar(selectedId);
    var variant = options.variant ? String(options.variant) : '';
    var shellCls = 'avatar-carousel-shell' + (variant ? ' avatar-carousel-shell--' + escAttr(variant) : '');
    var prevLabel = tUi('common.back', 'Previous');
    var nextLabel = tUi('common.next', 'Next');
    var html = '<div class="' + shellCls + '">' +
      '<button type="button" class="avatar-carousel-nav avatar-carousel-nav--prev" aria-label="' + escAttr(prevLabel) + '">' +
      avatarCarouselNavIcon('left') + '</button>' +
      '<div class="avatar-carousel" role="listbox" aria-label="' + escAttr(tUi('settings.avatar.title', 'Profile companion')) + '" tabindex="0">';
    AVATAR_IDS.forEach(function (id) {
      var isSel = id === sel;
      var label = avatarLabel(id);
      html += '<button type="button" class="avatar-carousel__item avatar-carousel__item--' + escAttr(id) +
        (isSel ? ' avatar-carousel__item--selected' : '') + '" role="option" aria-selected="' + (isSel ? 'true' : 'false') +
        '" data-avatar-id="' + escAttr(id) + '" aria-label="' + escAttr(label) + '">';
      html += '<span class="avatar-carousel__glyph-wrap"><span class="avatar-carousel__glyph-ring" aria-hidden="true"></span>';
      html += renderAvatarSvgUse(id, 'avatar-carousel__glyph avatar-carousel__glyph--idle', label);
      html += '</span>';
      html += '<span class="avatar-carousel__label">' + escAttr(label) + '</span>';
      html += '</button>';
    });
    html += '</div>' +
      '<button type="button" class="avatar-carousel-nav avatar-carousel-nav--next" aria-label="' + escAttr(nextLabel) + '">' +
      avatarCarouselNavIcon('right') + '</button>' +
      '</div>';
    return html;
  }

  function tUi(key, fallback) {
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      var tr = global.RianellI18n.t(key);
      if (tr && tr !== key) return tr;
    }
    if (typeof global.tUi === 'function') {
      var tu = global.tUi(key);
      if (tu && tu !== key) return tu;
    }
    return fallback || key;
  }

  function avatarLabel(avatarId) {
    if (isGeneratedAvatarId(avatarId)) {
      var settings = global.appSettings || {};
      if (settings.profileAvatar === avatarId && settings.profileAvatarName) {
        return String(settings.profileAvatarName);
      }
      var seed = parseGeneratedSeed(avatarId);
      return seed ? avatarNameFromSeed(seed) : 'Companion';
    }
    return tUi('avatar.' + avatarId, avatarId);
  }

  function shuffleIconSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.5-5.7M20 12a8 8 0 0 1-13.5 5.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M16 4h4v4M8 20H4v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function resolveRandomPickerState(currentId, options) {
    options = options || {};
    var id = typeof currentId === 'string' ? currentId.trim() : '';
    if (isGeneratedAvatarId(id)) {
      var existingSeed = parseGeneratedSeed(id);
      return {
        id: id,
        seed: existingSeed,
        name: avatarNameFromSeed(existingSeed),
      };
    }
    if (id && AVATAR_IDS.indexOf(normalizeAvatar(id)) >= 0 && options.autoSeed === false) {
      var preset = normalizeAvatar(id);
      return { id: preset, seed: null, name: avatarLabel(preset), preset: true };
    }
    var seed = createRandomAvatarSeed();
    return {
      id: buildGeneratedAvatarId(seed),
      seed: seed,
      name: avatarNameFromSeed(seed),
    };
  }

  function renderRandomAvatarPickerHTML(currentId, options) {
    options = options || {};
    var variant = options.variant ? String(options.variant) : 'intro';
    var state = resolveRandomPickerState(currentId, options);
    var motion = state.seed ? avatarMotionFromSeed(state.seed) : randomRenderMotion();
    var shellCls = 'avatar-random-shell avatar-random-shell--motion-' + escAttr(motion) +
      (variant ? ' avatar-random-shell--' + escAttr(variant) : '');
    var shuffleLabel = tUi('onboarding.questionnaire.avatarPick.shuffle', 'Shuffle character');
    return '<div class="' + shellCls + '" data-avatar-id="' + escAttr(state.id) + '" data-avatar-seed="' + escAttr(state.seed || '') + '" data-avatar-motion="' + escAttr(motion) + '">' +
      '<div class="avatar-random-card" role="group" aria-label="' + escAttr(state.name) + '">' +
      '<div class="avatar-random-face-wrap">' +
      '<span class="avatar-random-face-ring" aria-hidden="true"></span>' +
      renderAvatarSvgUse(state.id, 'avatar-random-glyphs avatar-carousel__glyph avatar-carousel__glyph--idle', state.name) +
      '</div>' +
      '<p class="avatar-random-name">' + escAttr(state.name) + '</p>' +
      '</div>' +
      '<button type="button" class="avatar-random-shuffle" aria-label="' + escAttr(shuffleLabel) + '">' +
      shuffleIconSvg() + '<span>' + escAttr(shuffleLabel) + '</span></button>' +
      '</div>';
  }

  function bindRandomAvatarPicker(container, onChange) {
    if (!container) return;
    var shell = container.classList.contains('avatar-random-shell')
      ? container
      : container.querySelector('.avatar-random-shell');
    if (!shell) return;

    function applyState(seed) {
      if (!seed) return;
      var newId = buildGeneratedAvatarId(seed);
      var name = avatarNameFromSeed(seed);
      ensureGeneratedAvatarSymbol(seed);
      shell.setAttribute('data-avatar-id', newId);
      shell.setAttribute('data-avatar-seed', seed);
      var nameEl = shell.querySelector('.avatar-random-name');
      var card = shell.querySelector('.avatar-random-card');
      var wrap = shell.querySelector('.avatar-random-face-wrap');
      if (nameEl) nameEl.textContent = name;
      if (card) card.setAttribute('aria-label', name);
      if (wrap) {
        wrap.innerHTML = '<span class="avatar-random-face-ring" aria-hidden="true"></span>' +
          renderAvatarSvgUse(newId, 'avatar-random-glyphs avatar-carousel__glyph avatar-carousel__glyph--idle', name);
      }
      setAvatarMotion(shell, seed, true);
      if (typeof onChange === 'function') onChange({ id: newId, name: name, seed: seed });
    }

    function shuffle() {
      applyState(createRandomAvatarSeed());
      shell.classList.remove('avatar-random-shell--shuffle');
      void shell.offsetWidth;
      shell.classList.add('avatar-random-shell--shuffle');
    }

    var shuffleBtn = shell.querySelector('.avatar-random-shuffle');
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffle);

    var initialSeed = shell.getAttribute('data-avatar-seed');
    if (initialSeed) {
      applyState(initialSeed);
      setAvatarMotion(shell, initialSeed, false);
    } else {
      shuffle();
    }
  }

  function bindAvatarCarousel(container, onSelect) {
    if (!container) return;
    var shell = container.classList.contains('avatar-carousel-shell')
      ? container
      : container.querySelector('.avatar-carousel-shell');
    var items = container.querySelectorAll('.avatar-carousel__item');
    var carousel = container.querySelector('.avatar-carousel');
    if (!carousel) return;

    function scrollItemIntoView(btn) {
      if (!btn) return;
      btn.scrollIntoView({
        behavior: shouldReduceAnimations() ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    function selectItem(btn) {
      if (!btn) return;
      var id = btn.getAttribute('data-avatar-id');
      items.forEach(function (el) {
        var active = el === btn;
        el.classList.toggle('avatar-carousel__item--selected', active);
        el.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      scrollItemIntoView(btn);
      if (typeof onSelect === 'function') onSelect(id);
    }

    items.forEach(function (btn) {
      btn.addEventListener('click', function () { selectItem(btn); });
    });

    carousel.addEventListener('keydown', function (e) {
      var current = carousel.querySelector('.avatar-carousel__item--selected');
      var idx = current ? Array.prototype.indexOf.call(items, current) : 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        var next = items[Math.min(idx + 1, items.length - 1)];
        selectItem(next);
        if (next) next.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = items[Math.max(idx - 1, 0)];
        selectItem(prev);
        if (prev) prev.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        selectItem(items[0]);
        if (items[0]) items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        selectItem(items[items.length - 1]);
        if (items[items.length - 1]) items[items.length - 1].focus();
      }
    });

    if (shell) {
      var prevBtn = shell.querySelector('.avatar-carousel-nav--prev');
      var nextBtn = shell.querySelector('.avatar-carousel-nav--next');
      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          var current = carousel.querySelector('.avatar-carousel__item--selected');
          var idx = current ? Array.prototype.indexOf.call(items, current) : 0;
          var prev = items[Math.max(idx - 1, 0)];
          selectItem(prev);
          if (prev) prev.focus();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          var current = carousel.querySelector('.avatar-carousel__item--selected');
          var idx = current ? Array.prototype.indexOf.call(items, current) : 0;
          var next = items[Math.min(idx + 1, items.length - 1)];
          selectItem(next);
          if (next) next.focus();
        });
      }
    }

    var initial = carousel.querySelector('.avatar-carousel__item--selected') || items[0];
    requestAnimationFrame(function () { scrollItemIntoView(initial); });
  }

  function renderBadgeCompositeHTML(achievementId, tier, unlocked, avatarId) {
    return renderAchievementIconHTML(achievementId, tier, unlocked);
  }

  function updateHeaderAvatar(avatarId) {
    var raw = avatarId || (global.appSettings && global.appSettings.profileAvatar);
    var id = isGeneratedAvatarId(raw) ? raw : normalizeAvatar(raw);
    if (isGeneratedAvatarId(id)) ensureGeneratedAvatarSymbol(parseGeneratedSeed(id));
    var label = avatarLabel(id);
    var html = '<div class="profile-avatar-header__ring">' +
      renderAvatarSvgUse(id, 'profile-avatar-header__glyph avatar-carousel__glyph--idle', label) +
      '</div>';
    ['profileAvatarHeader', 'logWizardAvatar'].forEach(function (mountId) {
      var el = document.getElementById(mountId);
      if (!el) return;
      el.innerHTML = html;
      el.setAttribute('aria-label', label);
      el.classList.toggle('profile-avatar-header--react', false);
      void el.offsetWidth;
      el.classList.add('profile-avatar-header--visible');
      var seed = isGeneratedAvatarId(id) ? parseGeneratedSeed(id) : null;
      setHeaderAvatarMotion(el, seed);
    });
  }

  function reactHeaderAvatar() {
    ['profileAvatarHeader', 'logWizardAvatar'].forEach(function (mountId) {
      var el = document.getElementById(mountId);
      if (!el) return;
      el.classList.remove('profile-avatar-header--react');
      void el.offsetWidth;
      el.classList.add('profile-avatar-header--react');
    });
  }

  function initGraphicsPortfolioSettings() {
    var settings = global.appSettings || {};
    var avatarMount = document.getElementById('settingsAvatarCarouselMount');
    if (avatarMount) {
      var current = settings.profileAvatar || 'voidorb';
      var useGen = isGeneratedAvatarId(current);
      avatarMount.innerHTML = renderRandomAvatarPickerHTML(current, {
        variant: 'settings',
        autoSeed: !useGen && !current,
      });
      bindRandomAvatarPicker(avatarMount, function (state) {
        settings.profileAvatar = state.id;
        settings.profileAvatarName = state.name;
        if (global.appSettings) {
          global.appSettings.profileAvatar = state.id;
          global.appSettings.profileAvatarName = state.name;
        }
        if (typeof global.saveSettings === 'function') global.saveSettings();
        updateHeaderAvatar(state.id);
        reactHeaderAvatar();
      });
    }
    updateHeaderAvatar(settings.profileAvatar);
  }

  function isLowTierDevice() {
    if (PU && typeof PU.getDeviceOpts === 'function') {
      var opts = PU.getDeviceOpts();
      if (opts && (opts.tier === 0 || opts.reduceAnimations)) return true;
    }
    return false;
  }

  var PAIN_BODY_ABSTRACT_OUTLINE = 'M70 18 L52 38 L48 72 L42 128 L50 220 L58 268 L70 274 L82 268 L90 220 L98 128 L92 72 L88 38 Z';
  var PAIN_BODY_ABSTRACT_GUIDES = 'M48 72 L22 95 L20 175 M92 72 L118 95 L120 175 M54 158 L50 268 M86 158 L90 268';

  function exportFormatArtSvg(format) {
    var f = String(format || 'csv');
    if (f === 'json') {
      return '<svg viewBox="0 0 32 32" class="export-format-art__svg" aria-hidden="true">' +
        '<path d="M8 6h12l6 6v16H8z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<path d="M20 6v6h6M11 16h10M11 20h8" stroke="currentColor" stroke-width="1.25" fill="none"/></svg>';
    }
    if (f === 'pdf') {
      return '<svg viewBox="0 0 32 32" class="export-format-art__svg" aria-hidden="true">' +
        '<path d="M8 4h12l6 6v18H8z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<text x="10" y="24" font-size="7" fill="currentColor">PDF</text></svg>';
    }
    if (f === 'excel') {
      return '<svg viewBox="0 0 32 32" class="export-format-art__svg" aria-hidden="true">' +
        '<rect x="6" y="6" width="20" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<path d="M6 12h20M6 18h20M14 6v20M20 6v20" stroke="currentColor" stroke-width="1"/></svg>';
    }
    return '<svg viewBox="0 0 32 32" class="export-format-art__svg" aria-hidden="true">' +
      '<rect x="6" y="8" width="20" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M6 14h20M6 20h20M14 8v18" stroke="currentColor" stroke-width="1"/></svg>';
  }

  function injectPainBodyAura(svg) {
    if (!svg || svg.querySelector('.pain-body-aura')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var aura = document.createElementNS(ns, 'g');
    aura.setAttribute('class', 'pain-body-aura');
    aura.setAttribute('aria-hidden', 'true');
    aura.innerHTML = '<ellipse class="pain-body-aura__halo" cx="70" cy="140" rx="48" ry="118" fill="var(--avatar-glow)" opacity="0.12"/>' +
      '<path class="pain-body-aura__trace" d="M70 24 Q92 80 70 140 Q48 200 70 256" fill="none" stroke="var(--avatar-primary)" stroke-width="1.25" opacity="0.35"/>';
    svg.insertBefore(aura, svg.firstChild);
  }

  function upgradeBodyMapSvg(svg) {
    if (!svg) return;
    svg.classList.add('pain-body-svg--set-d');
    var outline = svg.querySelector('.pain-body-outline');
    if (outline) {
      outline.setAttribute('d', PAIN_BODY_ABSTRACT_OUTLINE);
      outline.classList.add('pain-body-outline--abstract');
    }
    if (!svg.querySelector('.pain-body-outline__guides')) {
      var ns = 'http://www.w3.org/2000/svg';
      var guides = document.createElementNS(ns, 'path');
      guides.setAttribute('class', 'pain-body-outline__guides');
      guides.setAttribute('d', PAIN_BODY_ABSTRACT_GUIDES);
      guides.setAttribute('fill', 'none');
      guides.setAttribute('stroke', 'var(--avatar-secondary)');
      guides.setAttribute('stroke-width', '1');
      guides.setAttribute('opacity', '0.35');
      guides.setAttribute('aria-hidden', 'true');
      if (outline && outline.parentNode) {
        outline.parentNode.insertBefore(guides, outline.nextSibling);
      }
    }
    injectPainBodyAura(svg);
  }

  function spawnPainRipple(svg, el) {
    if (!svg || !el || shouldReduceAnimations()) return;
    var bbox = el.getBBox();
    var ns = 'http://www.w3.org/2000/svg';
    var ripple = document.createElementNS(ns, 'circle');
    ripple.setAttribute('class', 'pain-region-ripple');
    ripple.setAttribute('cx', String(bbox.x + bbox.width / 2));
    ripple.setAttribute('cy', String(bbox.y + bbox.height / 2));
    ripple.setAttribute('r', '4');
    svg.appendChild(ripple);
    ripple.addEventListener('animationend', function () { ripple.remove(); }, { once: true });
  }

  function bindPainBodyRipples(wrapper) {
    if (!wrapper || wrapper.dataset.painRipplesBound === '1') return;
    wrapper.dataset.painRipplesBound = '1';
    var svg = wrapper.querySelector('.pain-body-svg');
    if (!svg) return;
    wrapper.addEventListener('click', function (evt) {
      var target = evt.target.closest('.pain-region');
      if (!target || !svg.contains(target)) return;
      spawnPainRipple(svg, target);
    });
  }

  function injectBodyMapAura() {
    document.querySelectorAll('.pain-body-wrapper').forEach(function (wrapper) {
      var svg = wrapper.querySelector('.pain-body-svg');
      if (!svg) return;
      upgradeBodyMapSvg(svg);
      bindPainBodyRipples(wrapper);
    });
  }

  function decorateExportFormatCards() {
    document.querySelectorAll('.export-format-btn').forEach(function (btn, idx) {
      if (btn.querySelector('.export-format-art')) return;
      var art = document.createElement('span');
      art.className = 'export-format-art';
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = exportFormatArtSvg(btn.getAttribute('data-format'));
      btn.insertBefore(art, btn.firstChild);
      btn.classList.add('export-format-btn--decorated');
      btn.style.setProperty('--export-art-delay', String(idx * 60) + 'ms');
    });
  }

  function decorateSecurityLockIllustration() {
    var panes = document.querySelectorAll('.settings-carousel-pane');
    panes.forEach(function (pane) {
      if (pane.getAttribute('data-settings-pane-i18n') !== 'settings.security.title') return;
      var section = pane.querySelector('.settings-section');
      if (!section || section.querySelector('.security-lock-illustration')) return;
      var illus = document.createElement('div');
      illus.className = 'security-lock-illustration';
      illus.setAttribute('aria-hidden', 'true');
      illus.innerHTML = '<svg viewBox="0 0 24 24" class="security-lock-illustration__svg ui-svg-icon"><use href="#icon-lock"></use></svg>';
      section.insertBefore(illus, section.firstChild.nextSibling);
      if (!section.querySelector('.security-pin-dots')) {
        var dots = document.createElement('div');
        dots.className = 'security-pin-dots';
        dots.setAttribute('aria-hidden', 'true');
        dots.innerHTML = '<span></span><span></span><span></span><span></span>';
        section.insertBefore(dots, illus.nextSibling);
      }
    });
  }

  function decorateWellbeingHalo() {
    document.querySelectorAll('.ai-wellbeing-ring-wrap').forEach(function (wrap) {
      if (wrap.querySelector('.ai-wellbeing-halo')) return;
      var halo = document.createElement('div');
      halo.className = 'ai-wellbeing-halo';
      halo.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(halo, wrap.firstChild);
      wrap.classList.add('ai-wellbeing-ring-wrap--halo');
    });
  }

  function decorateFlareNeedle() {
    document.querySelectorAll('.ai-flare-arc-gauge').forEach(function (gauge) {
      if (gauge.querySelector('.ai-flare-needle')) return;
      var needle = document.createElement('div');
      needle.className = 'ai-flare-needle';
      needle.setAttribute('aria-hidden', 'true');
      gauge.appendChild(needle);
      gauge.classList.add('ai-flare-arc-gauge--portfolio');
    });
  }

  function decorateTrendCards() {
    document.querySelectorAll('.ai-trend-card').forEach(function (card, idx) {
      if (card.classList.contains('ai-trend-card--portfolio')) return;
      card.classList.add('ai-trend-card--portfolio');
      card.style.setProperty('--trend-reveal-delay', String(idx * 40) + 'ms');
    });
  }

  function decorateInsightsArtwork() {
    decorateWellbeingHalo();
    decorateFlareNeedle();
    decorateTrendCards();
    document.querySelectorAll('.ai-quick-stat').forEach(function (stat, idx) {
      if (stat.classList.contains('ai-quick-stat--decorated')) return;
      stat.classList.add('ai-quick-stat--decorated');
      stat.style.setProperty('--ai-stat-delay', String(idx * 40) + 'ms');
    });
  }

  function decorateConnectors() {
    document.querySelectorAll('.connector-row').forEach(function (row) {
      if (!row.querySelector('.connector-flow-dots')) {
        var flow = document.createElement('span');
        flow.className = 'connector-flow-dots';
        flow.setAttribute('aria-hidden', 'true');
        flow.innerHTML = '<span></span><span></span><span></span>';
        row.appendChild(flow);
      }
      var existingIcon = row.querySelector('.connector-icon');
      var legacyArt = row.querySelector('.connector-art');
      if (existingIcon) {
        existingIcon.classList.add('connector-icon--decorated');
        if (legacyArt) legacyArt.remove();
        row.classList.add('connector-row--decorated');
        return;
      }
      if (legacyArt) return;
      var id = row.getAttribute('data-connector') || 'strava';
      var icon = id === 'withings' ? 'heart-pulse' : 'run';
      var art = document.createElement('span');
      art.className = 'connector-art';
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = '<svg viewBox="0 0 32 32" class="connector-art__svg"><use href="#icon-' + escAttr(icon) + '"></use></svg>';
      var name = row.querySelector('.connector-name');
      if (name) name.insertBefore(art, name.firstChild);
      else row.insertBefore(art, row.firstChild);
      row.classList.add('connector-row--decorated');
    });
  }

  function decorateGoalsProgress() {
    var block = document.getElementById('goalsProgressBlock');
    if (!block || block.style.display === 'none') return;
    block.classList.add('goals-progress-block--portfolio');
    block.querySelectorAll('.goals-status-pill.below').forEach(function (pill) {
      pill.classList.add('goals-status-pill--pulse-ring');
    });
    /* Remove legacy static trail dots so day chips alone reflect target vs result. */
    block.querySelectorAll('.goals-days-trail').forEach(function (trail) {
      trail.remove();
    });
  }

  function decorateStressorChips() {
    document.querySelectorAll('.stressor-chip, .ai-stressor-chip').forEach(function (chip) {
      chip.classList.add('stressor-chip--portfolio');
    });
    document.querySelectorAll('.stressor-chips, .ai-stressor-list, #stressorChips').forEach(function (root) {
      if (root.dataset.stressorRippleBound === '1') return;
      root.dataset.stressorRippleBound = '1';
      root.addEventListener('click', function (evt) {
        var chip = evt.target.closest('.stressor-chip, .ai-stressor-chip');
        if (!chip) return;
        chip.classList.remove('stressor-chip--ripple');
        void chip.offsetWidth;
        chip.classList.add('stressor-chip--ripple');
      });
    });
  }

  function decorateSymptomChips(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.symptom-chip').forEach(function (chip) {
      chip.classList.add('symptom-chip--portfolio');
    });
    var containers = scope && scope.classList && scope.classList.contains('symptom-tiles-container')
      ? [scope]
      : Array.prototype.slice.call(root.querySelectorAll('.symptom-tiles-container, .symptom-chips, #tilePickerSheetBody'));
    containers.forEach(function (container) {
      if (container.dataset.symptomRippleBound === '1') return;
      container.dataset.symptomRippleBound = '1';
      container.addEventListener('click', function (evt) {
        var chip = evt.target.closest('.symptom-chip');
        if (!chip) return;
        chip.classList.remove('symptom-chip--ripple');
        void chip.offsetWidth;
        chip.classList.add('symptom-chip--ripple');
      });
    });
  }

  function decorateCycleBeacon() {
    document.querySelectorAll('.cycle-day-beacon').forEach(function (beacon) {
      var parent = beacon.parentElement;
      if (!parent || !parent.classList.contains('cycle-day-node--active')) {
        beacon.remove();
      }
    });
    document.querySelectorAll('.cycle-day-node--active').forEach(function (node) {
      if (node.querySelector('.cycle-day-beacon')) return;
      var beacon = document.createElement('span');
      beacon.className = 'cycle-day-beacon';
      beacon.setAttribute('aria-hidden', 'true');
      node.appendChild(beacon);
    });
  }

  function decorateLifestyleVitals() {
    var stepsSlider = document.getElementById('stepsSlider');
    if (stepsSlider) {
      var stepsWrap = stepsSlider.closest('.vital-widget') || stepsSlider.closest('.slider-container');
      if (stepsWrap) stepsWrap.classList.add('vital-widget--portfolio');
    }
    var hydrationSlider = document.getElementById('hydrationSlider');
    if (hydrationSlider) {
      var hydWrap = hydrationSlider.closest('.vital-widget') || hydrationSlider.closest('.slider-container');
      if (hydWrap) hydWrap.classList.add('vital-widget--portfolio');
    }
    document.querySelectorAll('.bbt-thermo-widget').forEach(function (widget) {
      widget.classList.add('bbt-thermo-widget--portfolio');
    });
    document.querySelectorAll('[id*="bpm"], .vital-widget--heart, .bp-reading-widget').forEach(function (widget) {
      widget.classList.add('vital-widget--portfolio');
    });
  }

  function decoratePainLegend() {
    document.querySelectorAll('.pain-body-legend-chips li').forEach(function (li) {
      if (li.classList.contains('pain-legend-chip--decorated')) return;
      li.classList.add('pain-legend-chip--decorated');
      var swatch = li.querySelector('[class*="pain-legend-"]');
      if (swatch) swatch.classList.add('pain-legend-swatch--glow');
    });
  }

  function decorateBristolStrip() {
    document.querySelectorAll('.bristol-slider-container').forEach(function (container) {
      if (container.querySelector('.bristol-type-strip')) return;
      var strip = document.createElement('div');
      strip.className = 'bristol-type-strip';
      strip.setAttribute('aria-hidden', 'true');
      for (var i = 1; i <= 7; i++) {
        strip.innerHTML += '<span class="bristol-type-glyph" data-bristol-type="' + i + '"></span>';
      }
      container.insertBefore(strip, container.firstChild);
      var slider = container.querySelector('#bristol');
      function syncBristol() {
        var v = slider ? parseInt(slider.value, 10) : 4;
        strip.querySelectorAll('.bristol-type-glyph').forEach(function (g) {
          g.classList.toggle('bristol-type-glyph--active', parseInt(g.getAttribute('data-bristol-type'), 10) === v);
        });
      }
      if (slider) {
        slider.addEventListener('input', syncBristol);
        syncBristol();
      }
    });
  }

  function decorateMoodTab() {
    var mood = document.getElementById('moodTabContent');
    if (!mood || mood.querySelector('.mood-portfolio-art')) return;
    var art = document.createElement('div');
    art.className = 'mood-portfolio-art';
    art.setAttribute('aria-hidden', 'true');
    art.innerHTML = '<svg viewBox="0 0 32 32" class="mood-portfolio-art__svg"><use href="#icon-metric-mood"></use></svg>';
    mood.insertBefore(art, mood.firstChild);
    mood.querySelectorAll('.mood-readings-summary-card, .mood-reading-card, .mood-metric-card, .mood-empty-state').forEach(function (card, idx) {
      card.classList.add('mood-card--portfolio-reveal');
      card.style.setProperty('--mood-reveal-delay', String(idx * 50) + 'ms');
    });
  }

  function animateAchievementDayChips(root) {
    if (!root || shouldReduceAnimations()) return;
    root.querySelectorAll('.achievement-day-chip').forEach(function (chip, idx) {
      chip.classList.remove('achievement-day-chip--flip');
      void chip.offsetWidth;
      chip.style.setProperty('--chip-flip-delay', String(idx * 70) + 'ms');
      chip.classList.add('achievement-day-chip--flip');
    });
  }

  function playAchievementUnlockSequence(newlyUnlocked) {
    if (!newlyUnlocked || !newlyUnlocked.length) return;
    if (typeof global.triggerMilestoneConfetti === 'function') {
      var origin = document.getElementById('achievementsGrid') || document.querySelector('.achievement-card--unlocked');
      global.triggerMilestoneConfetti(origin || document.body);
    }
    newlyUnlocked.forEach(function (snap) {
      var card = document.querySelector('.achievement-card[data-achievement-id="' + escAttr(snap.id) + '"]');
      if (!card) return;
      card.classList.add('achievement-card--just-unlocked');
      var composite = card.querySelector('.graphics-achievement-icon, .graphics-badge-composite');
      if (composite) {
        composite.classList.remove('graphics-achievement-icon--unlock-sweep', 'graphics-badge-composite--unlock-sweep');
        void composite.offsetWidth;
        composite.classList.add('graphics-achievement-icon--unlock-sweep');
      }
    });
    animateAchievementDayChips(document.getElementById('achievementsGrid'));
    reactHeaderAvatar();
  }

  function widgetHasDedicatedVisual(widgetEl) {
    return !!(widgetEl && widgetEl.querySelector('.metric-widget__visual, .vital-widget__visual'));
  }

  function removeMisplacedMetricEntityStages() {
    document.querySelectorAll(
      '.section-content > .metric-entity-stage, ' +
      '.metric-widget + .metric-entity-stage, ' +
      '.vital-widget + .metric-entity-stage, ' +
      '.slider-container.metric-widget + .metric-entity-stage'
    ).forEach(function (stage) {
      stage.remove();
    });
    document.querySelectorAll('.metric-widget, .vital-widget').forEach(function (widget) {
      if (!widgetHasDedicatedVisual(widget)) return;
      widget.querySelectorAll('.metric-entity-stage').forEach(function (stage) {
        stage.remove();
      });
    });
  }

  function decorateLogScreens() {
    removeMisplacedMetricEntityStages();
    document.querySelectorAll('.metric-widget').forEach(function (widget) {
      widget.classList.add('metric-widget--portfolio');
    });
  }

  function decorateAllScreens() {
    if (isLowTierDevice()) {
      document.body.classList.add('graphics-portfolio--low-tier');
    }
    injectBodyMapAura();
    decoratePainLegend();
    decorateExportFormatCards();
    decorateSecurityLockIllustration();
    decorateConnectors();
    decorateInsightsArtwork();
    decorateLogScreens();
    decorateBristolStrip();
    decorateGoalsProgress();
    decorateMoodTab();
    decorateStressorChips();
    decorateSymptomChips();
    decorateCycleBeacon();
    decorateLifestyleVitals();
  }

  function syncMetricEntityZone(stage, zoneId) {
    if (!stage) return;
    var zone = zoneId === 'good' || zoneId === 'bad' ? zoneId : 'neutral';
    stage.className = 'metric-entity-stage metric-entity-stage--zone-' + zone;
    stage.setAttribute('data-zone', zone);
    var entity = stage.querySelector('.metric-entity');
    if (entity) {
      entity.classList.remove('metric-entity--zone-good', 'metric-entity--zone-neutral', 'metric-entity--zone-bad');
      entity.classList.add('metric-entity--zone-' + zone);
    }
  }

  function injectMetricEntityCompanion(widgetEl, metricId, zoneId) {
    if (isLowTierDevice()) return null;
    if (!widgetEl || METRIC_ENTITY_IDS.indexOf(metricId) < 0) return null;
    if (widgetHasDedicatedVisual(widgetEl)) return null;

    var existing = widgetEl.querySelector('.metric-entity-stage[data-metric="' + metricId + '"]');
    if (existing) {
      syncMetricEntityZone(existing, zoneId);
      return existing;
    }

    var zone = zoneId === 'good' || zoneId === 'bad' ? zoneId : 'neutral';
    var stage = document.createElement('div');
    stage.className = 'metric-entity-stage metric-entity-stage--zone-' + zone;
    stage.setAttribute('data-metric', metricId);
    stage.setAttribute('data-zone', zone);
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '<svg class="metric-entity metric-entity--' + escAttr(metricId) + '" viewBox="0 0 32 32"><use href="#icon-metric-' + escAttr(metricId) + '"></use></svg>';

    widgetEl.classList.add('metric-companion-host');
    widgetEl.appendChild(stage);
    return stage;
  }

  function init(opts) {
    injectSpriteSymbols();
    removeLegacyVibeUi();

    var settings = global.appSettings || {};
    var level = 2;
    if (opts && opts.analysis) {
      level = computeAvatarHealthState(opts.analysis);
    } else if (settings.avatarHealthState != null) {
      level = settings.avatarHealthState;
    }
    applyAvatarHealthState(level);
    updateHeaderAvatar(settings.profileAvatar);
    decorateAllScreens();

    return {
      healthState: level,
      spritesInjected: _spritesInjected,
    };
  }

  global.RianellGraphicsPortfolio = {
    AVATAR_IDS: AVATAR_IDS.slice(),
    METRIC_ENTITY_IDS: METRIC_ENTITY_IDS.slice(),
    SLIDER_TO_ENTITY: Object.assign({}, SLIDER_TO_ENTITY),
    BADGE_FRAME_IDS: BADGE_FRAME_IDS.slice(),
    BADGE_TIERS: BADGE_TIERS.slice(),
    CYCLE_PHASE_IDS: CYCLE_PHASE_IDS.slice(),
    injectSpriteSymbols: injectSpriteSymbols,
    computeAvatarHealthState: computeAvatarHealthState,
    applyAvatarHealthState: applyAvatarHealthState,
    renderAvatarCarouselHTML: renderAvatarCarouselHTML,
    bindAvatarCarousel: bindAvatarCarousel,
    renderRandomAvatarPickerHTML: renderRandomAvatarPickerHTML,
    bindRandomAvatarPicker: bindRandomAvatarPicker,
    avatarSymbolPathsFromSeed: avatarSymbolPathsFromSeed,
    renderAvatarSvgUse: renderAvatarSvgUse,
    renderBadgeCompositeHTML: renderBadgeCompositeHTML,
    renderAchievementIconHTML: renderAchievementIconHTML,
    injectMetricEntityCompanion: injectMetricEntityCompanion,
    initGraphicsPortfolioSettings: initGraphicsPortfolioSettings,
    updateHeaderAvatar: updateHeaderAvatar,
    reactHeaderAvatar: reactHeaderAvatar,
    injectBodyMapAura: injectBodyMapAura,
    decorateAllScreens: decorateAllScreens,
    decorateInsightsArtwork: decorateInsightsArtwork,
    decorateLogScreens: decorateLogScreens,
    decorateGoalsProgress: decorateGoalsProgress,
    decorateMoodTab: decorateMoodTab,
    decorateSymptomChips: decorateSymptomChips,
    animateAchievementDayChips: animateAchievementDayChips,
    playAchievementUnlockSequence: playAchievementUnlockSequence,
    decorateLifestyleVitals: decorateLifestyleVitals,
    decorateCycleBeacon: decorateCycleBeacon,
    syncMetricEntityZone: syncMetricEntityZone,
    avatarLabel: avatarLabel,
    init: init,
    shouldReduceAnimations: shouldReduceAnimations,
    normalizeAvatar: normalizeAvatar,
    removeLegacyVibeUi: removeLegacyVibeUi,
  };

})(typeof window !== 'undefined' ? window : globalThis);
