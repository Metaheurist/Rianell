/**
 * graphics-portfolio.js — Avatar entities, vibes, metric companions, badge composites.
 * Namespace: window.RianellGraphicsPortfolio
 */
(function (global) {
  'use strict';

  var PU = global.PerformanceUtils;
  var S = global.RianellShared || {};

  var AVATAR_IDS = [
    'voidorb', 'tidewarden', 'leafcircuit', 'prismcore', 'moonthread',
    'emberveil', 'riftecho', 'stonebloom', 'glasswave', 'ashspiral',
    'coralnode', 'starlace', 'mistveil', 'thornloop', 'sunwarden',
    'duskmantle', 'ironbloom', 'vortexseed', 'lumenshard', 'driftmoss',
  ];

  var VIBE_IDS = ['calm', 'energy', 'nature', 'clinical', 'dark'];

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

  var VIBE_CLASS_PREFIX = 'vibe-';
  var _spritesInjected = false;
  var _vibeSceneInjected = false;

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

  function normalizeVibe(vibeId) {
    if (S.normalizeUserVibe) return S.normalizeUserVibe(vibeId);
    var v = typeof vibeId === 'string' ? vibeId.trim() : '';
    return VIBE_IDS.indexOf(v) >= 0 ? v : 'calm';
  }

  function normalizeAvatar(avatarId) {
    if (S.normalizeProfileAvatar) return S.normalizeProfileAvatar(avatarId);
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

  function avatarSymbolPaths(idx) {
    var fill = 'fill="var(--avatar-primary)"';
    var stroke = 'stroke="var(--avatar-secondary)" stroke-width="1.75" fill="none"';
    var a = idx * 17;
    var r = 14 + (idx % 5);
    var cx = 32 + ((idx % 3) - 1) * 2;
    var cy = 32 + ((idx % 4) - 1.5) * 2;
    var parts = [];

    switch (idx % 7) {
      case 0:
        parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + fill + '/>');
        parts.push('<circle cx="' + (cx - 6) + '" cy="' + (cy - 4) + '" r="3" fill="var(--avatar-secondary)"/>');
        parts.push('<circle cx="' + (cx + 6) + '" cy="' + (cy - 4) + '" r="3" fill="var(--avatar-secondary)"/>');
        break;
      case 1:
        parts.push('<polygon points="' + cx + ',' + (cy - r) + ' ' + (cx + r) + ',' + (cy + r) + ' ' + (cx - r) + ',' + (cy + r) + '" ' + fill + '/>');
        parts.push('<line x1="' + (cx - 8) + '" y1="' + cy + '" x2="' + (cx + 8) + '" y2="' + cy + '" ' + stroke + '/>');
        break;
      case 2:
        parts.push('<rect x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + (r * 2) + '" height="' + (r * 2) + '" rx="4" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')" ' + fill + '/>');
        parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="var(--avatar-secondary)"/>');
        break;
      case 3:
        parts.push('<path d="M' + (cx - r) + ',' + cy + ' A' + r + ',' + r + ' 0 1 1 ' + (cx + r) + ',' + cy + ' A' + (r - 5) + ',' + (r - 5) + ' 0 1 0 ' + (cx - r) + ',' + cy + 'Z" ' + fill + '/>');
        break;
      case 4:
        parts.push('<path d="M' + cx + ',' + (cy - r) + ' L' + (cx + r) + ',' + cy + ' L' + cx + ',' + (cy + r) + ' L' + (cx - r) + ',' + cy + 'Z" ' + fill + '/>');
        parts.push('<path d="M' + cx + ',' + (cy - 6) + ' L' + (cx + 6) + ',' + cy + ' L' + cx + ',' + (cy + 6) + ' L' + (cx - 6) + ',' + cy + 'Z" fill="var(--avatar-secondary)"/>');
        break;
      case 5:
        parts.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (r + 2) + '" ry="' + (r - 2) + '" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')" ' + fill + '/>');
        parts.push('<path d="M' + (cx - 10) + ',' + (cy + 8) + ' Q' + cx + ',' + (cy + 16) + ' ' + (cx + 10) + ',' + (cy + 8) + '" ' + stroke + '/>');
        break;
      default:
        parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + stroke + '/>');
        parts.push('<path d="M' + (cx - r + 2) + ',' + (cy - 2) + ' L' + (cx + r - 2) + ',' + (cy - 2) + ' M' + cx + ',' + (cy - r + 2) + ' L' + cx + ',' + (cy + r - 2) + '" ' + stroke + '/>');
        parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="4" ' + fill + '/>');
    }
    return parts.join('');
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
      case 'swelling': return '<ellipse cx="16" cy="16" rx="12" ry="8" ' + stroke + '/><ellipse cx="16" cy="16" rx="6" ry="4" ' + fill + '/>';
      case 'steps': return '<path d="M10 22 L14 10 L18 18 L22 6" ' + stroke + ' stroke-linecap="round"/><circle cx="22" cy="6" r="2" ' + fill + '/>';
      case 'hydration': return '<path d="M16 6 C12 14 10 18 10 22 a6 6 0 0 0 12 0 c0-4-2-8-6-16Z" ' + fill + ' opacity="0.8"/>';
      case 'bpm': return '<path d="M6 16 H10 L13 8 L19 24 L22 16 H26" ' + stroke + ' stroke-linecap="round"/>';
      case 'flare': return '<path d="M16 4 L18 14 L28 14 L20 20 L23 30 L16 24 L9 30 L12 20 L4 14 L14 14Z" ' + fill + '/>';
      case 'dailyFunction': return '<rect x="6" y="8" width="20" height="16" rx="2" ' + stroke + '/><path d="M10 14 h12 M10 18 h8" ' + stroke + '/>';
      case 'irritability': return '<path d="M8 20 Q16 8 24 20" ' + stroke + '/><circle cx="12" cy="14" r="2" ' + fill + '/><circle cx="20" cy="14" r="2" ' + fill + '/>';
      case 'weatherSensitivity': return '<ellipse cx="16" cy="18" rx="10" ry="6" ' + stroke + '/><path d="M10 12 h12" ' + stroke + '/><circle cx="16" cy="10" r="4" ' + fill + ' opacity="0.7"/>';
      default: return '<circle cx="16" cy="16" r="8" ' + fill + '/>';
    }
  }

  function badgeFramePaths(id) {
    var stroke = 'stroke="currentColor" stroke-width="1.5" fill="none"';
    switch (id) {
      case 'food_logging': return '<circle cx="32" cy="32" r="28" ' + stroke + '/><path d="M20 20 h8 v12 h-8z M36 18 h8 v14 h-8z" fill="currentColor"/>';
      case 'exercise_logging': return '<polygon points="32,6 56,20 48,54 16,54 8,20" ' + stroke + '/><path d="M22 32 h20" ' + stroke + '/>';
      case 'medication_logging': return '<rect x="10" y="10" width="44" height="44" rx="8" ' + stroke + '/><circle cx="32" cy="32" r="10" ' + stroke + '/>';
      case 'milestone_3': return '<circle cx="32" cy="32" r="26" ' + stroke + '/><text x="32" y="38" text-anchor="middle" font-size="18" fill="currentColor">3</text>';
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

    _spritesInjected = true;
    return true;
  }

  function stripVibeClasses() {
    if (!document.body) return;
    VIBE_IDS.forEach(function (id) {
      document.body.classList.remove(VIBE_CLASS_PREFIX + id);
    });
  }

  function applyUserVibe(vibeId) {
    var vibe = normalizeVibe(vibeId);
    stripVibeClasses();
    if (document.body) document.body.classList.add(VIBE_CLASS_PREFIX + vibe);
    if (global.appSettings && typeof global.appSettings === 'object') {
      global.appSettings.userVibe = vibe;
    }
    var scene = document.getElementById('vibe-scene');
    if (scene) {
      scene.setAttribute('data-vibe', vibe);
      scene.classList.toggle('vibe-scene--static', shouldReduceAnimations());
      refreshVibeSceneArt(vibe);
    }
    return vibe;
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
    var id = normalizeAvatar(avatarId);
    var cls = className ? ' class="' + escAttr(className) + '"' : '';
    var titleTag = title ? '<title>' + escAttr(title) + '</title>' : '';
    return '<svg' + cls + ' viewBox="0 0 64 64" aria-hidden="' + (title ? 'false' : 'true') + '" role="img">' +
      titleTag +
      '<use href="#icon-' + escAttr(id) + '"></use></svg>';
  }

  function renderAvatarCarouselHTML(selectedId) {
    var sel = normalizeAvatar(selectedId);
    var html = '<div class="avatar-carousel" role="listbox" aria-label="Profile avatar" tabindex="0">';
    AVATAR_IDS.forEach(function (id) {
      var isSel = id === sel;
      var label = avatarLabel(id);
      html += '<button type="button" class="avatar-carousel__item' + (isSel ? ' avatar-carousel__item--selected' : '') + '" role="option" aria-selected="' + (isSel ? 'true' : 'false') + '" data-avatar-id="' + escAttr(id) + '" aria-label="' + escAttr(label) + '">';
      html += renderAvatarSvgUse(id, 'avatar-carousel__glyph avatar-carousel__glyph--idle', label);
      html += '<span class="avatar-carousel__label">' + escAttr(label) + '</span>';
      html += '</button>';
    });
    html += '</div>';
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
    return tUi('avatar.' + avatarId, avatarId);
  }

  function vibeLabel(vibeId) {
    var key = 'settings.vibe.' + vibeId;
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      var t = global.RianellI18n.t(key);
      if (t && t !== key) return t;
    }
    return vibeId.charAt(0).toUpperCase() + vibeId.slice(1);
  }

  function renderVibePickerHTML(selectedVibe) {
    var sel = normalizeVibe(selectedVibe);
    var html = '<div class="vibe-picker" role="radiogroup" aria-label="Ambient vibe">';
    VIBE_IDS.forEach(function (id) {
      var isSel = id === sel;
      html += '<button type="button" class="vibe-picker__card' + (isSel ? ' vibe-picker__card--selected' : '') + '" role="radio" aria-checked="' + (isSel ? 'true' : 'false') + '" data-vibe-id="' + escAttr(id) + '">';
      html += '<span class="vibe-picker__swatch vibe-picker__swatch--' + escAttr(id) + '" aria-hidden="true"></span>';
      html += '<span class="vibe-picker__name">' + escAttr(vibeLabel(id)) + '</span>';
      html += '</button>';
    });
    html += '</div>';
    return html;
  }

  function bindAvatarCarousel(container, onSelect) {
    if (!container) return;
    var items = container.querySelectorAll('.avatar-carousel__item');
    var carousel = container.classList.contains('avatar-carousel') ? container : container.querySelector('.avatar-carousel');
    if (!carousel) carousel = container;

    function selectItem(btn) {
      if (!btn) return;
      var id = btn.getAttribute('data-avatar-id');
      items.forEach(function (el) {
        var active = el === btn;
        el.classList.toggle('avatar-carousel__item--selected', active);
        el.setAttribute('aria-selected', active ? 'true' : 'false');
      });
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
  }

  function bindVibePicker(container, onSelect) {
    if (!container) return;
    var cards = container.querySelectorAll('.vibe-picker__card');

    function selectCard(card) {
      if (!card) return;
      var vibeId = card.getAttribute('data-vibe-id');
      var apply = function () {
        applyUserVibe(vibeId);
        cards.forEach(function (el) {
          var active = el === card;
          el.classList.toggle('vibe-picker__card--selected', active);
          el.setAttribute('aria-checked', active ? 'true' : 'false');
        });
        if (typeof onSelect === 'function') onSelect(vibeId);
      };
      if (typeof global.applyThemeCrossfade === 'function') {
        global.applyThemeCrossfade(apply);
      } else {
        apply();
      }
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () { selectCard(card); });
    });
  }

  function renderBadgeCompositeHTML(achievementId, tier, unlocked, avatarId) {
    var achId = BADGE_FRAME_IDS.indexOf(achievementId) >= 0 ? achievementId : BADGE_FRAME_IDS[0];
    var tierId = BADGE_TIERS.indexOf(tier) >= 0 ? tier : 'bronze';
    var avId = normalizeAvatar(avatarId);
    var lockedCls = unlocked ? '' : ' graphics-badge-composite--locked';
    var clipId = 'badge-clip-' + achId + '-' + tierId;

    return '<div class="graphics-badge-composite' + lockedCls + '" data-achievement="' + escAttr(achId) + '" data-tier="' + escAttr(tierId) + '">' +
      '<svg class="graphics-badge-composite__svg" viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<defs><clipPath id="' + escAttr(clipId) + '"><circle cx="32" cy="32" r="14"/></clipPath></defs>' +
      '<use href="#icon-tier-' + escAttr(tierId) + '" class="graphics-badge-composite__ring"></use>' +
      '<use href="#icon-badge-' + escAttr(achId) + '" class="graphics-badge-composite__frame"></use>' +
      '<g clip-path="url(#' + escAttr(clipId) + ')"><use href="#icon-' + escAttr(avId) + '" class="graphics-badge-composite__avatar"></use></g>' +
      '<circle class="graphics-badge-composite__progress" cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="188.5" stroke-dashoffset="' + (unlocked ? '0' : '94') + '" transform="rotate(-90 32 32)"/>' +
      '</svg></div>';
  }

  function updateHeaderAvatar(avatarId) {
    var id = normalizeAvatar(avatarId || (global.appSettings && global.appSettings.profileAvatar));
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
    var vibeMount = document.getElementById('settingsVibePickerMount');
    if (avatarMount) {
      avatarMount.innerHTML = renderAvatarCarouselHTML(settings.profileAvatar);
      bindAvatarCarousel(avatarMount, function (id) {
        settings.profileAvatar = normalizeAvatar(id);
        if (global.appSettings) global.appSettings.profileAvatar = settings.profileAvatar;
        if (typeof global.saveSettings === 'function') global.saveSettings();
        updateHeaderAvatar(settings.profileAvatar);
        reactHeaderAvatar();
      });
    }
    if (vibeMount) {
      vibeMount.innerHTML = renderVibePickerHTML(settings.userVibe);
      bindVibePicker(vibeMount, function (vibeId) {
        settings.userVibe = normalizeVibe(vibeId);
        if (global.appSettings) global.appSettings.userVibe = settings.userVibe;
        if (typeof global.saveSettings === 'function') global.saveSettings();
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

  function vibeSceneSvgMarkup(vibeId) {
    var stroke = 'stroke="var(--avatar-primary)" stroke-width="1" fill="none" opacity="0.35"';
    var fill = 'fill="var(--avatar-glow)" opacity="0.25"';
    switch (normalizeVibe(vibeId)) {
      case 'energy':
        return '<svg class="vibe-scene__svg" viewBox="0 0 400 240" aria-hidden="true"><circle cx="80" cy="60" r="28" ' + stroke + '/><circle cx="320" cy="100" r="18" ' + fill + '/><path d="M40 180 Q120 120 200 160 T360 140" ' + stroke + '/></svg>';
      case 'nature':
        return '<svg class="vibe-scene__svg" viewBox="0 0 400 240" aria-hidden="true"><path d="M60 200 Q90 120 120 200" ' + stroke + '/><path d="M280 210 Q310 100 340 210" ' + stroke + '/><ellipse cx="200" cy="80" rx="40" ry="12" ' + fill + '/></svg>';
      case 'clinical':
        return '';
      case 'dark':
        return '<svg class="vibe-scene__svg" viewBox="0 0 400 240" aria-hidden="true"><circle cx="100" cy="180" r="3" ' + fill + '/><circle cx="240" cy="120" r="2" ' + fill + '/><circle cx="330" cy="200" r="2.5" ' + fill + '/></svg>';
      default:
        return '<svg class="vibe-scene__svg" viewBox="0 0 400 240" aria-hidden="true"><circle cx="120" cy="80" r="20" ' + fill + '/><circle cx="300" cy="140" r="14" ' + fill + '/><circle cx="200" cy="200" r="10" ' + fill + '/></svg>';
    }
  }

  function refreshVibeSceneArt(vibeId) {
    var scene = document.getElementById('vibe-scene');
    if (!scene) return;
    var fg = scene.querySelector('.vibe-scene__layer--fg');
    if (!fg) return;
    var existing = fg.querySelector('.vibe-scene__svg-wrap');
    if (existing) existing.remove();
    var markup = vibeSceneSvgMarkup(vibeId);
    if (!markup) return;
    var wrap = document.createElement('div');
    wrap.className = 'vibe-scene__svg-wrap';
    wrap.innerHTML = markup;
    fg.appendChild(wrap);
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
      illus.innerHTML = '<svg viewBox="0 0 64 64" class="security-lock-illustration__svg"><use href="#icon-lock"></use></svg>';
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
      card.style.setProperty('--trend-reveal-delay', String(idx * 45) + 'ms');
      if (card.querySelector('.ai-trend-entity')) return;
      var metricKey = card.getAttribute('data-metric') || '';
      var entityId = metricKey === 'pain' ? 'pain' : metricKey === 'sleep' ? 'sleep' : metricKey === 'mood' ? 'mood' : '';
      if (!entityId || METRIC_ENTITY_IDS.indexOf(entityId) < 0) return;
      var corner = document.createElement('span');
      corner.className = 'ai-trend-entity';
      corner.setAttribute('aria-hidden', 'true');
      corner.innerHTML = '<svg viewBox="0 0 32 32"><use href="#icon-metric-' + escAttr(entityId) + '"></use></svg>';
      card.appendChild(corner);
    });
  }

  function decorateInsightsArtwork() {
    var hero = document.querySelector('.ai-hero-row');
    if (hero && !hero.querySelector('.ai-wellbeing-art')) {
      var art = document.createElement('div');
      art.className = 'ai-wellbeing-art';
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = '<svg viewBox="0 0 64 64"><use href="#icon-gauge"></use></svg>';
      hero.appendChild(art);
    }
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
      if (row.querySelector('.connector-art')) return;
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
    block.querySelectorAll('.goals-days').forEach(function (daysEl) {
      if (daysEl.querySelector('.goals-days-trail')) return;
      var trail = document.createElement('span');
      trail.className = 'goals-days-trail';
      trail.setAttribute('aria-hidden', 'true');
      trail.innerHTML = '<svg viewBox="0 0 120 8" class="goals-days-trail__svg">' +
        '<circle cx="8" cy="4" r="2"/><circle cx="40" cy="4" r="2"/><circle cx="72" cy="4" r="2"/><circle cx="104" cy="4" r="2"/></svg>';
      daysEl.appendChild(trail);
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

  function decorateCycleBeacon() {
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
      if (stepsWrap) {
        stepsWrap.classList.add('vital-widget--portfolio');
        var stepsVal = parseInt(stepsSlider.value, 10) || 0;
        var stepsZone = stepsVal >= 8000 ? 'good' : stepsVal >= 3000 ? 'neutral' : 'bad';
        injectMetricEntityCompanion(stepsWrap, 'steps', stepsZone);
      }
    }
    var hydrationSlider = document.getElementById('hydrationSlider');
    if (hydrationSlider) {
      var hydWrap = hydrationSlider.closest('.vital-widget') || hydrationSlider.closest('.slider-container');
      if (hydWrap) {
        hydWrap.classList.add('vital-widget--portfolio');
        var hydVal = parseFloat(hydrationSlider.value) || 0;
        var hydZone = hydVal >= 6 ? 'good' : hydVal >= 3 ? 'neutral' : 'bad';
        injectMetricEntityCompanion(hydWrap, 'hydration', hydZone);
      }
    }
    document.querySelectorAll('.bbt-thermo-widget').forEach(function (widget) {
      widget.classList.add('bbt-thermo-widget--portfolio');
    });
    document.querySelectorAll('[id*="bpm"], .vital-widget--heart, .bp-reading-widget').forEach(function (widget) {
      widget.classList.add('vital-widget--portfolio');
      if (!widget.querySelector('.metric-entity-stage[data-metric="bpm"]')) {
        injectMetricEntityCompanion(widget, 'bpm', 'neutral');
      }
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
      var composite = card.querySelector('.graphics-badge-composite');
      if (composite) {
        composite.classList.remove('graphics-badge-composite--unlock-sweep');
        void composite.offsetWidth;
        composite.classList.add('graphics-badge-composite--unlock-sweep');
      }
    });
    animateAchievementDayChips(document.getElementById('achievementsGrid'));
    reactHeaderAvatar();
  }

  function decorateLogScreens() {
    document.querySelectorAll('.metric-widget').forEach(function (widget) {
      widget.classList.add('metric-widget--portfolio');
    });
    document.querySelectorAll('.bristol-slider-container').forEach(function (el) {
      if (el.querySelector('.log-screen-art')) return;
      var art = document.createElement('div');
      art.className = 'log-screen-art log-screen-art--bristol';
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = '<svg viewBox="0 0 32 32"><use href="#icon-gut"></use></svg>';
      el.insertBefore(art, el.firstChild);
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
    var parent = widgetEl.parentElement;
    if (!parent) return null;
    if (parent.querySelector('.metric-entity-stage[data-metric="' + metricId + '"]')) {
      var existing = parent.querySelector('.metric-entity-stage[data-metric="' + metricId + '"]');
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

    if (widgetEl.nextSibling) {
      parent.insertBefore(stage, widgetEl.nextSibling);
    } else {
      parent.appendChild(stage);
    }
    return stage;
  }

  function injectVibeScene() {
    if (_vibeSceneInjected || !document.body) return null;
    if (document.getElementById('vibe-scene')) {
      _vibeSceneInjected = true;
      return document.getElementById('vibe-scene');
    }

    var reduced = shouldReduceAnimations();
    var scene = document.createElement('div');
    scene.id = 'vibe-scene';
    scene.className = 'vibe-scene' + (reduced ? ' vibe-scene--static' : '');
    scene.setAttribute('aria-hidden', 'true');

    var layers = [
      { cls: 'vibe-scene__layer vibe-scene__layer--bg' },
      { cls: 'vibe-scene__layer vibe-scene__layer--mid' },
      { cls: 'vibe-scene__layer vibe-scene__layer--fg' },
    ];
    layers.forEach(function (layer) {
      var el = document.createElement('div');
      el.className = layer.cls;
      scene.appendChild(el);
    });

    document.body.insertBefore(scene, document.body.firstChild);
    _vibeSceneInjected = true;
    refreshVibeSceneArt((global.appSettings && global.appSettings.userVibe) || 'calm');

    if (!reduced) {
      var ticking = false;
      global.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = global.scrollY || 0;
          var mult = reduced ? 0 : 1;
          scene.style.setProperty('--vibe-parallax-y', String(y * 0.15 * mult));
          scene.style.setProperty('--vibe-parallax-mid', String(y * 0.08 * mult));
          scene.style.setProperty('--vibe-parallax-fg', String(y * 0.04 * mult));
          ticking = false;
        });
      }, { passive: true });
    }

    return scene;
  }

  function init(opts) {
    injectSpriteSymbols();
    injectVibeScene();

    var settings = global.appSettings || {};
    var vibe = settings.userVibe || 'calm';
    applyUserVibe(vibe);

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
      vibe: vibe,
      healthState: level,
      spritesInjected: _spritesInjected,
    };
  }

  global.RianellGraphicsPortfolio = {
    AVATAR_IDS: AVATAR_IDS.slice(),
    VIBE_IDS: VIBE_IDS.slice(),
    METRIC_ENTITY_IDS: METRIC_ENTITY_IDS.slice(),
    SLIDER_TO_ENTITY: Object.assign({}, SLIDER_TO_ENTITY),
    BADGE_FRAME_IDS: BADGE_FRAME_IDS.slice(),
    BADGE_TIERS: BADGE_TIERS.slice(),
    CYCLE_PHASE_IDS: CYCLE_PHASE_IDS.slice(),
    injectSpriteSymbols: injectSpriteSymbols,
    applyUserVibe: applyUserVibe,
    computeAvatarHealthState: computeAvatarHealthState,
    applyAvatarHealthState: applyAvatarHealthState,
    renderAvatarCarouselHTML: renderAvatarCarouselHTML,
    renderVibePickerHTML: renderVibePickerHTML,
    bindAvatarCarousel: bindAvatarCarousel,
    bindVibePicker: bindVibePicker,
    renderAvatarSvgUse: renderAvatarSvgUse,
    renderBadgeCompositeHTML: renderBadgeCompositeHTML,
    injectMetricEntityCompanion: injectMetricEntityCompanion,
    injectVibeScene: injectVibeScene,
    initGraphicsPortfolioSettings: initGraphicsPortfolioSettings,
    updateHeaderAvatar: updateHeaderAvatar,
    reactHeaderAvatar: reactHeaderAvatar,
    injectBodyMapAura: injectBodyMapAura,
    decorateAllScreens: decorateAllScreens,
    decorateInsightsArtwork: decorateInsightsArtwork,
    decorateLogScreens: decorateLogScreens,
    decorateGoalsProgress: decorateGoalsProgress,
    decorateMoodTab: decorateMoodTab,
    animateAchievementDayChips: animateAchievementDayChips,
    playAchievementUnlockSequence: playAchievementUnlockSequence,
    decorateLifestyleVitals: decorateLifestyleVitals,
    decorateCycleBeacon: decorateCycleBeacon,
    syncMetricEntityZone: syncMetricEntityZone,
    avatarLabel: avatarLabel,
    init: init,
    shouldReduceAnimations: shouldReduceAnimations,
    normalizeAvatar: normalizeAvatar,
    normalizeVibe: normalizeVibe,
  };

})(typeof window !== 'undefined' ? window : globalThis);
