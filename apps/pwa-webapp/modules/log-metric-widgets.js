/**
 * Log wizard metric sliders → animated SVG widgets (symptoms, energy, stress, lifestyle).
 * Keeps native range inputs for form compatibility; enhances visuals + steppers.
 */
(function (global) {
  'use strict';

  var METRIC_IDS = [
    'stiffness', 'jointPain', 'mobility', 'swelling',
    'fatigue', 'sleep', 'mood',
    'irritability', 'weatherSensitivity',
    'dailyFunction',
  ];

  var HIGHER_IS_BETTER = { sleep: 1, mobility: 1, dailyFunction: 1, mood: 1 };

  function wellnessFromRaw(id, raw) {
    var r = clamp(parseInt(raw, 10) || 5, 1, 10);
    return HIGHER_IS_BETTER[id] ? r : (11 - r);
  }

  function rawFromWellness(id, wellness) {
    var w = clamp(parseInt(wellness, 10) || 5, 1, 10);
    return HIGHER_IS_BETTER[id] ? w : (11 - w);
  }

  var VISUAL = {
    stiffness: 'stiffness',
    jointPain: 'jointPain',
    mobility: 'mobility',
    swelling: 'swelling',
    fatigue: 'fatigue',
    sleep: 'sleep',
    mood: 'mood',
    irritability: 'irritability',
    weatherSensitivity: 'weather',
    dailyFunction: 'dailyFunction',
  };

  function t(key, fallback) {
    if (typeof global.tUi === 'function') {
      var v = global.tUi(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function ratio(val, min, max) {
    if (max <= min) return 0;
    return clamp((val - min) / (max - min), 0, 1);
  }

  function classifyZone(id, wellnessValue) {
    var v = parseInt(wellnessValue, 10);
    if (isNaN(v)) v = 5;
    v = clamp(v, 1, 10);
    if (v >= 8) return { id: 'good', color: '#7bdf8c', label: t('common.good', 'Good') };
    if (v >= 4) return { id: 'moderate', color: '#ffb74d', label: t('wizard.lifestyle.steps.moderate', 'Moderate') };
    return { id: 'bad', color: '#ff8a65', label: t('common.bad', 'Bad') };
  }

  function deriveMetricStatus(zoneId) {
    if (zoneId === 'good') return 'improving';
    if (zoneId === 'bad') return 'declining';
    return 'stable';
  }

  function applyOasisMetricFeedback(widget, display, zoneId) {
    if (!global.OasisCanvas || !widget) return;
    global.OasisCanvas.applyMetricStatus(widget, deriveMetricStatus(zoneId));
    if (display) global.OasisCanvas.triggerCountFlip(display);
  }

  function visualHtml(kind) {
    switch (kind) {
      case 'stiffness':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<circle class="metric-stiffness-hub" cx="32" cy="32" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' +
          '<g class="metric-stiffness-gear"><path d="M32 10v6M32 48v6M10 32h6M48 32h6M16.8 16.8l4.2 4.2M43 43l4.2 4.2M16.8 47.2l4.2-4.2M43 21l4.2-4.2" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M32 14a18 18 0 1 1 0 36a18 18 0 0 1 0-36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 5"/></g></svg>';
      case 'jointPain':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<path class="metric-pain-bone" d="M22 44 Q32 28 42 44" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4" stroke-linecap="round"/>' +
          '<circle class="metric-pain-ring metric-pain-ring--2" cx="32" cy="36" r="20" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
          '<circle class="metric-pain-ring metric-pain-ring--1" cx="32" cy="36" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
          '<circle class="metric-pain-core" cx="32" cy="36" r="9" fill="currentColor" opacity="0.35"/></svg>';
      case 'mobility':
        return '<svg class="metric-svg metric-svg--mobility" viewBox="0 0 72 88" focusable="false" aria-hidden="true">' +
          '<defs>' +
          '<linearGradient id="metricMobilityTrailGrad" x1="36" y1="10" x2="36" y2="78" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-mobility-grad-top"/><stop offset="100%" class="metric-mobility-grad-bot"/>' +
          '</linearGradient>' +
          '</defs>' +
          '<path class="metric-mobility-trail-bg" d="M36 10 C44 24 28 38 44 52 C32 66 38 78 36 86" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 6"/>' +
          '<path class="metric-mobility-trail-fill" d="M36 10 C44 24 28 38 44 52 C32 66 38 78 36 86" fill="none" stroke="url(#metricMobilityTrailGrad)" stroke-width="2.5" stroke-linecap="round"/>' +
          '<g class="metric-mobility-print metric-mobility-print--1" transform="translate(28 4) rotate(-14)">' +
          '<ellipse class="metric-mobility-sole" cx="10" cy="14" rx="7.5" ry="9" fill="currentColor"/>' +
          '<circle cx="5.5" cy="5" r="2.3" fill="currentColor"/><circle cx="10" cy="3.2" r="2.1" fill="currentColor"/>' +
          '<circle cx="14.5" cy="5" r="2.2" fill="currentColor"/><circle cx="17" cy="8.5" r="1.9" fill="currentColor"/>' +
          '</g>' +
          '<g class="metric-mobility-print metric-mobility-print--2" transform="translate(44 20) rotate(16)">' +
          '<ellipse class="metric-mobility-sole" cx="10" cy="14" rx="7.5" ry="9" fill="currentColor"/>' +
          '<circle cx="5.5" cy="5" r="2.3" fill="currentColor"/><circle cx="10" cy="3.2" r="2.1" fill="currentColor"/>' +
          '<circle cx="14.5" cy="5" r="2.2" fill="currentColor"/><circle cx="17" cy="8.5" r="1.9" fill="currentColor"/>' +
          '</g>' +
          '<g class="metric-mobility-print metric-mobility-print--3" transform="translate(22 36) rotate(-14)">' +
          '<ellipse class="metric-mobility-sole" cx="10" cy="14" rx="7.5" ry="9" fill="currentColor"/>' +
          '<circle cx="5.5" cy="5" r="2.3" fill="currentColor"/><circle cx="10" cy="3.2" r="2.1" fill="currentColor"/>' +
          '<circle cx="14.5" cy="5" r="2.2" fill="currentColor"/><circle cx="17" cy="8.5" r="1.9" fill="currentColor"/>' +
          '</g>' +
          '<g class="metric-mobility-print metric-mobility-print--4" transform="translate(42 52) rotate(16)">' +
          '<ellipse class="metric-mobility-sole" cx="10" cy="14" rx="7.5" ry="9" fill="currentColor"/>' +
          '<circle cx="5.5" cy="5" r="2.3" fill="currentColor"/><circle cx="10" cy="3.2" r="2.1" fill="currentColor"/>' +
          '<circle cx="14.5" cy="5" r="2.2" fill="currentColor"/><circle cx="17" cy="8.5" r="1.9" fill="currentColor"/>' +
          '</g>' +
          '<g class="metric-mobility-print metric-mobility-print--5" transform="translate(26 68) rotate(-14)">' +
          '<ellipse class="metric-mobility-sole" cx="10" cy="14" rx="7.5" ry="9" fill="currentColor"/>' +
          '<circle cx="5.5" cy="5" r="2.3" fill="currentColor"/><circle cx="10" cy="3.2" r="2.1" fill="currentColor"/>' +
          '<circle cx="14.5" cy="5" r="2.2" fill="currentColor"/><circle cx="17" cy="8.5" r="1.9" fill="currentColor"/>' +
          '</g>' +
          '<g class="metric-mobility-walker">' +
          '<circle class="metric-mobility-head" cx="0" cy="0" r="5" fill="currentColor"/>' +
          '<path class="metric-mobility-torso" d="M0 5 v16" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>' +
          '<path class="metric-mobility-leg metric-mobility-leg--L" d="M0 21 L-7 36" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path class="metric-mobility-leg metric-mobility-leg--R" d="M0 21 L7 36" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path class="metric-mobility-arm metric-mobility-arm--L" d="M0 9 L-9 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
          '<path class="metric-mobility-arm metric-mobility-arm--R" d="M0 9 L9 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
          '</g>' +
          '<g class="metric-mobility-speed" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
          '<line class="metric-mobility-speed-line metric-mobility-speed-line--1" x1="4" y1="44" x2="14" y2="44"/>' +
          '<line class="metric-mobility-speed-line metric-mobility-speed-line--2" x1="2" y1="50" x2="12" y2="50"/>' +
          '<line class="metric-mobility-speed-line metric-mobility-speed-line--3" x1="6" y1="56" x2="16" y2="56"/>' +
          '</g></svg>';
      case 'swelling':
        return '<svg class="metric-svg metric-svg--swelling" viewBox="0 0 64 72" focusable="false" aria-hidden="true">' +
          '<defs>' +
          '<radialGradient id="metricKneeSwellGrad" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox">' +
          '<stop offset="0%" class="metric-knee-swell-grad-core"/>' +
          '<stop offset="68%" class="metric-knee-swell-grad-mid"/>' +
          '<stop offset="100%" class="metric-knee-swell-grad-edge"/>' +
          '</radialGradient>' +
          '</defs>' +
          '<path class="metric-knee-femur" d="M31 8 v4 M29 12 C26 18 25 30 28 41" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path class="metric-knee-tibia" d="M30 43 Q31 45 34 68" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="4.2" stroke-linecap="round"/>' +
          '<path class="metric-knee-fibula" d="M35 45 L37 66" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-linecap="round"/>' +
          '<g class="metric-knee-swell-group" transform="translate(32 43)">' +
          '<ellipse class="metric-knee-swell-ring metric-knee-swell-ring--3" cx="0" cy="0" rx="18" ry="20" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
          '<ellipse class="metric-knee-swell-ring metric-knee-swell-ring--2" cx="0" cy="0" rx="13" ry="15" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
          '<ellipse class="metric-knee-swell-ring metric-knee-swell-ring--1" cx="0" cy="0" rx="9" ry="11" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
          '<ellipse class="metric-knee-swell-fluid" cx="0" cy="0" rx="7" ry="8.5" fill="url(#metricKneeSwellGrad)"/>' +
          '<ellipse class="metric-knee-swell-shine" cx="-2" cy="-2" rx="2.2" ry="2.8" fill="rgba(255,255,255,0.24)"/>' +
          '</g>' +
          '<ellipse class="metric-knee-patella" cx="37" cy="41" rx="5" ry="6.5" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.38)" stroke-width="1.4"/>' +
          '</svg>';
      case 'fatigue':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<rect class="metric-battery-cap" x="28" y="14" width="8" height="4" rx="1" fill="rgba(255,255,255,0.35)"/>' +
          '<rect class="metric-battery-body" x="18" y="18" width="28" height="40" rx="5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>' +
          '<rect class="metric-battery-fill" x="22" y="22" width="20" height="32" rx="3" fill="currentColor"/></svg>';
      case 'sleep':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<rect class="metric-sleep-sky" x="8" y="8" width="48" height="48" rx="12" fill="rgba(255,255,255,0.04)"/>' +
          '<path class="metric-sleep-moon" d="M38 18a16 16 0 1 0 8 26a12 12 0 1 1 0-26" fill="currentColor" opacity="0.85"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--1" cx="20" cy="22" r="1.8" fill="currentColor"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--2" cx="26" cy="14" r="1.2" fill="currentColor"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--3" cx="16" cy="32" r="1.4" fill="currentColor"/>' +
          '<circle class="metric-sleep-star metric-sleep-star--4" cx="22" cy="40" r="1" fill="currentColor"/></svg>';
      case 'mood':
        return '<svg class="metric-svg metric-svg--mood" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<defs>' +
          '<radialGradient id="metricMoodFaceGrad" cx="32" cy="28" r="30" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-mood-grad-top"/><stop offset="100%" class="metric-mood-grad-bot"/>' +
          '</radialGradient>' +
          '</defs>' +
          '<circle class="metric-mood-head" cx="32" cy="32" r="27" fill="url(#metricMoodFaceGrad)" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/>' +
          '<ellipse class="metric-mood-cheek metric-mood-cheek--L" cx="18" cy="38" rx="5.5" ry="3.2" fill="currentColor"/>' +
          '<ellipse class="metric-mood-cheek metric-mood-cheek--R" cx="46" cy="38" rx="5.5" ry="3.2" fill="currentColor"/>' +
          '<path class="metric-mood-brow metric-mood-brow--L" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path class="metric-mood-brow metric-mood-brow--R" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
          '<ellipse class="metric-mood-eye metric-mood-eye--L" cx="22" cy="28" rx="3.6" ry="4.2" fill="currentColor"/>' +
          '<ellipse class="metric-mood-eye metric-mood-eye--R" cx="42" cy="28" rx="3.6" ry="4.2" fill="currentColor"/>' +
          '<circle class="metric-mood-shine metric-mood-shine--L" cx="23.2" cy="26.4" r="1.3" fill="rgba(255,255,255,0.75)"/>' +
          '<circle class="metric-mood-shine metric-mood-shine--R" cx="43.2" cy="26.4" r="1.3" fill="rgba(255,255,255,0.75)"/>' +
          '<path class="metric-mood-mouth" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>' +
          '<path class="metric-mood-tear metric-mood-tear--L" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path class="metric-mood-tear metric-mood-tear--R" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<g class="metric-mood-sparkles" fill="currentColor">' +
          '<path class="metric-mood-spark metric-mood-spark--1" d="M52 12 l1.8 3.6 l3.6 1.8 l-3.6 1.8 l-1.8 3.6 l-1.8-3.6 l-3.6-1.8 l3.6-1.8z"/>' +
          '<path class="metric-mood-spark metric-mood-spark--2" d="M10 18 l1.2 2.4 l2.4 1.2 l-2.4 1.2 l-1.2 2.4 l-1.2-2.4 l-2.4-1.2 l2.4-1.2z"/>' +
          '</g></svg>';
      case 'irritability':
        return '<svg class="metric-svg metric-svg--irritability" viewBox="0 0 64 72" focusable="false" aria-hidden="true">' +
          '<defs>' +
          '<radialGradient id="metricIrritFaceGrad" cx="32" cy="46" r="18" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-irrit-face-top"/><stop offset="100%" class="metric-irrit-face-bot"/>' +
          '</radialGradient>' +
          '</defs>' +
          '<g class="metric-irrit-thought">' +
          '<ellipse class="metric-irrit-cloud-main" cx="32" cy="14" rx="20" ry="10.5" fill="rgba(255,255,255,0.1)" stroke="currentColor" stroke-width="1.4"/>' +
          '<circle class="metric-irrit-cloud-tail metric-irrit-cloud-tail--1" cx="27" cy="23" r="3.6" fill="rgba(255,255,255,0.08)" stroke="currentColor" stroke-width="1"/>' +
          '<circle class="metric-irrit-cloud-tail metric-irrit-cloud-tail--2" cx="23" cy="29" r="2.3" fill="rgba(255,255,255,0.06)" stroke="currentColor" stroke-width="0.9"/>' +
          '<path class="metric-irrit-scribble metric-irrit-scribble--1" d="M21 11 L27 17 M27 11 L21 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
          '<path class="metric-irrit-scribble metric-irrit-scribble--2" d="M33 9 Q37 13 33 17 Q29 13 33 9" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
          '<path class="metric-irrit-scribble metric-irrit-scribble--3" d="M38 10 C42 12 42 16 38 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path class="metric-irrit-symbol metric-irrit-symbol--bang" d="M41 10 v7 M41 19 v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '</g>' +
          '<g class="metric-irrit-escape">' +
          '<g class="metric-irrit-escape-burst metric-irrit-escape-burst--1"><path d="M48 8 v6 M46 12 h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></g>' +
          '<g class="metric-irrit-escape-burst metric-irrit-escape-burst--2"><path d="M52 16 h-3 M52 16 h3 M52 19 h-2 M52 19 h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></g>' +
          '<g class="metric-irrit-escape-burst metric-irrit-escape-burst--3"><path d="M46 24 Q49 20 52 24 Q49 28 46 24" fill="none" stroke="currentColor" stroke-width="1.3"/></g>' +
          '<g class="metric-irrit-escape-burst metric-irrit-escape-burst--4"><path d="M10 10 v5 M10 10 Q14 12 10 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></g>' +
          '<g class="metric-irrit-escape-burst metric-irrit-escape-burst--5"><path d="M8 20 L12 26 M12 20 L8 26" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></g>' +
          '</g>' +
          '<g class="metric-irrit-face">' +
          '<circle class="metric-irrit-head" cx="32" cy="46" r="17" fill="url(#metricIrritFaceGrad)" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>' +
          '<path class="metric-irrit-vein" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path class="metric-irrit-brow metric-irrit-brow--L" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>' +
          '<path class="metric-irrit-brow metric-irrit-brow--R" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>' +
          '<path class="metric-irrit-eye-chill metric-irrit-eye-chill--L" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path class="metric-irrit-eye-chill metric-irrit-eye-chill--R" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<ellipse class="metric-irrit-eye-open metric-irrit-eye-open--L" cx="25" cy="44" rx="2.8" ry="3.4" fill="currentColor"/>' +
          '<ellipse class="metric-irrit-eye-open metric-irrit-eye-open--R" cx="39" cy="44" rx="2.8" ry="3.4" fill="currentColor"/>' +
          '<g class="metric-irrit-shades" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
          '<path d="M18 43 Q25 40 32 43 Q39 40 46 43"/>' +
          '<line x1="18" y1="43" x2="16" y2="41"/><line x1="46" y1="43" x2="48" y2="41"/>' +
          '</g>' +
          '<path class="metric-irrit-mouth" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</g>' +
          '<g class="metric-irrit-steam" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
          '<path class="metric-irrit-steam-puff metric-irrit-steam-puff--1" d="M20 34 Q18 30 20 26"/>' +
          '<path class="metric-irrit-steam-puff metric-irrit-steam-puff--2" d="M44 34 Q46 30 44 26"/>' +
          '</g>' +
          '</svg>';
      case 'weather':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<path class="metric-weather-cloud" d="M46 30h-3a12 12 0 1 0-4-22a10 10 0 0 0-18 4a8 8 0 0 0 2 15h23z" fill="rgba(255,255,255,0.08)" stroke="currentColor" stroke-width="1.5"/>' +
          '<path class="metric-weather-lightning" d="M34 26 L30 36 H34 L31 46 L40 32 H35 Z" fill="currentColor"/>' +
          '<line class="metric-rain metric-rain--1" x1="24" y1="36" x2="22" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--2" x1="32" y1="36" x2="30" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--3" x1="40" y1="36" x2="38" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--4" x1="28" y1="40" x2="26" y2="50" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<line class="metric-rain metric-rain--5" x1="36" y1="40" x2="34" y2="52" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      case 'dailyFunction':
        return '<svg class="metric-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
          '<circle class="metric-ring-track" cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="5"/>' +
          '<circle class="metric-ring-progress" cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" transform="rotate(-90 32 32)"/>' +
          '<path class="metric-ring-check" d="M24 32l6 6 12-14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg>';
      default:
        return '';
    }
  }

  var MOBILITY_WALKER = [
    { x: 38, y: 12, rot: -14 },
    { x: 54, y: 28, rot: 16 },
    { x: 32, y: 44, rot: -14 },
    { x: 52, y: 60, rot: 16 },
    { x: 36, y: 76, rot: -14 },
  ];

  function stampMobilityPrints(visual, prevLit, nextLit) {
    if (nextLit <= prevLit) return;
    visual.querySelectorAll('.metric-mobility-print').forEach(function (print, i) {
      if (i >= prevLit && i < nextLit) {
        print.classList.remove('metric-mobility-print--stamping');
        void print.offsetWidth;
        print.classList.add('metric-mobility-print--stamping');
        global.setTimeout(function () {
          print.classList.remove('metric-mobility-print--stamping');
        }, 520);
      }
    });
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function updateMoodFace(visual, r) {
    var mouth = visual.querySelector('.metric-mood-mouth');
    if (mouth) {
      var midY = lerp(33, 47, r);
      var wingY = lerp(40, 38, r);
      mouth.setAttribute('d', 'M19 ' + wingY.toFixed(1) + ' Q32 ' + midY.toFixed(1) + ' 45 ' + wingY.toFixed(1));
    }
    visual.querySelectorAll('.metric-mood-eye').forEach(function (eye) {
      eye.setAttribute('ry', lerp(1.8, 4.6, r).toFixed(2));
      eye.setAttribute('cy', lerp(30, 28, r).toFixed(2));
    });
    var browL = visual.querySelector('.metric-mood-brow--L');
    var browR = visual.querySelector('.metric-mood-brow--R');
    if (browL) {
      browL.setAttribute('d', 'M16 ' + lerp(24, 21, r).toFixed(1) + ' Q22 ' + lerp(22, 18, r).toFixed(1) + ' 28 ' + lerp(24, 21, r).toFixed(1));
    }
    if (browR) {
      browR.setAttribute('d', 'M36 ' + lerp(24, 21, r).toFixed(1) + ' Q42 ' + lerp(22, 18, r).toFixed(1) + ' 48 ' + lerp(24, 21, r).toFixed(1));
    }
    visual.querySelectorAll('.metric-mood-cheek').forEach(function (cheek) {
      cheek.style.opacity = String(clamp((r - 0.45) / 0.55, 0, 0.55));
    });
    var tearL = visual.querySelector('.metric-mood-tear--L');
    var tearR = visual.querySelector('.metric-mood-tear--R');
    var tearOn = clamp((0.42 - r) / 0.42, 0, 1);
    if (tearL) tearL.setAttribute('d', tearOn > 0.05 ? 'M22 33 Q21 38 22 42' : 'M22 33');
    if (tearR) tearR.setAttribute('d', tearOn > 0.05 ? 'M42 33 Q43 38 42 42' : 'M42 33');
    if (tearL) tearL.style.opacity = String(tearOn);
    if (tearR) tearR.style.opacity = String(tearOn);
    var sparkles = visual.querySelector('.metric-mood-sparkles');
    if (sparkles) sparkles.style.opacity = String(clamp((r - 0.55) / 0.45, 0, 1));
  }

  function updateIrritabilityVisual(visual, r) {
    var anger = clamp(r, 0, 1);
    var chill = 1 - anger;

    var browL = visual.querySelector('.metric-irrit-brow--L');
    var browR = visual.querySelector('.metric-irrit-brow--R');
    if (browL) {
      browL.setAttribute('d', 'M20 ' + lerp(38, 35, anger).toFixed(1) + ' Q24 ' + lerp(36, 31, anger).toFixed(1) + ' 28 ' + lerp(38, 37, anger).toFixed(1));
    }
    if (browR) {
      browR.setAttribute('d', 'M36 ' + lerp(38, 37, anger).toFixed(1) + ' Q40 ' + lerp(36, 31, anger).toFixed(1) + ' 44 ' + lerp(38, 35, anger).toFixed(1));
    }

    var chillL = visual.querySelector('.metric-irrit-eye-chill--L');
    var chillR = visual.querySelector('.metric-irrit-eye-chill--R');
    if (chillL) {
      chillL.setAttribute('d', 'M22 ' + lerp(45, 43, anger).toFixed(1) + ' Q25 ' + lerp(47, 44, anger).toFixed(1) + ' 28 ' + lerp(45, 43, anger).toFixed(1));
      chillL.style.opacity = String(clamp(chill * 1.15, 0, 1));
    }
    if (chillR) {
      chillR.setAttribute('d', 'M36 ' + lerp(45, 43, anger).toFixed(1) + ' Q39 ' + lerp(47, 44, anger).toFixed(1) + ' 42 ' + lerp(45, 43, anger).toFixed(1));
      chillR.style.opacity = String(clamp(chill * 1.15, 0, 1));
    }

    visual.querySelectorAll('.metric-irrit-eye-open').forEach(function (eye) {
      eye.style.opacity = String(clamp((anger - 0.2) / 0.8, 0, 1));
      eye.setAttribute('ry', lerp(2.2, 4.2, anger).toFixed(2));
    });

    var shades = visual.querySelector('.metric-irrit-shades');
    if (shades) shades.style.opacity = String(clamp(chill * 1.1 - 0.05, 0, 1));

    var mouth = visual.querySelector('.metric-irrit-mouth');
    if (mouth) {
      if (anger < 0.55) {
        mouth.setAttribute('d', 'M24 ' + lerp(53, 52, anger).toFixed(1) + ' Q32 ' + lerp(54, 53, anger).toFixed(1) + ' 40 ' + lerp(53, 52, anger).toFixed(1));
      } else {
        var t = (anger - 0.55) / 0.45;
        mouth.setAttribute('d', 'M24 52 L28 ' + lerp(52, 49, t).toFixed(1) + ' L32 ' + lerp(53, 55, t).toFixed(1) + ' L36 ' + lerp(52, 49, t).toFixed(1) + ' L40 52');
      }
    }

    var vein = visual.querySelector('.metric-irrit-vein');
    if (vein) {
      vein.setAttribute('d', 'M32 30 Q34 ' + lerp(32, 28, anger).toFixed(1) + ' 36 ' + lerp(30, 27, anger).toFixed(1));
      vein.style.opacity = String(clamp((anger - 0.55) / 0.45, 0, 0.9));
    }

    var thought = visual.querySelector('.metric-irrit-thought');
    if (thought) {
      var thoughtOn = clamp((anger - 0.22) / 0.78, 0, 1);
      thought.style.opacity = String(thoughtOn);
      var cloudScale = 0.55 + anger * 0.5;
      thought.setAttribute('transform', 'translate(32 16) scale(' + cloudScale.toFixed(3) + ') translate(-32 -16)');
    }

    visual.querySelectorAll('.metric-irrit-scribble, .metric-irrit-symbol').forEach(function (mark, i) {
      mark.style.opacity = String(clamp((anger - 0.35 - i * 0.08) / 0.55, 0, 1));
    });

    visual.querySelectorAll('.metric-irrit-escape-burst').forEach(function (burst, i) {
      var threshold = 0.4 + i * 0.1;
      var on = anger >= threshold;
      burst.classList.toggle('metric-irrit-escape-burst--on', on);
      burst.style.opacity = on ? String(clamp((anger - threshold) / 0.45, 0.35, 1)) : '0';
    });

    visual.querySelectorAll('.metric-irrit-steam-puff').forEach(function (puff, i) {
      var puffOn = anger >= 0.5 + i * 0.08;
      puff.classList.toggle('metric-irrit-steam-puff--on', puffOn);
      puff.style.opacity = puffOn ? String(clamp((anger - 0.45) / 0.55, 0.25, 1)) : String(clamp(chill * 0.35, 0, 0.35));
    });
  }

  function applyVisualState(widget, id, rawValue) {
    var v = parseInt(rawValue, 10);
    if (isNaN(v)) v = 5;
    var r = ratio(v, 0, 10);
    var kind = VISUAL[id];
    var visual = widget.querySelector('.metric-widget__visual');
    if (!visual) return;

    if (kind === 'stiffness') {
      var gear = visual.querySelector('.metric-stiffness-gear');
      if (gear) {
        var dur = (0.6 + r * 2.8).toFixed(2);
        gear.style.animationDuration = dur + 's';
        widget.style.setProperty('--metric-stiffness-speed', dur + 's');
      }
    } else if (kind === 'jointPain') {
      var sev = r;
      visual.querySelectorAll('.metric-pain-ring').forEach(function (ring, i) {
        ring.style.opacity = String(clamp(sev * 1.2 - i * 0.25, 0, 1));
      });
      var core = visual.querySelector('.metric-pain-core');
      if (core) core.setAttribute('opacity', String(0.2 + sev * 0.75));
    } else if (kind === 'mobility') {
      var lit = Math.max(1, Math.ceil(r * 5));
      var prevLit = parseInt(widget.dataset.mobilityLit || '0', 10);
      stampMobilityPrints(visual, prevLit, lit);
      widget.dataset.mobilityLit = String(lit);
      visual.querySelectorAll('.metric-mobility-print').forEach(function (print, i) {
        print.classList.toggle('metric-mobility-print--lit', i < lit);
      });
      var trail = visual.querySelector('.metric-mobility-trail-fill');
      if (trail) {
        var trailLen = trail.getTotalLength ? trail.getTotalLength() : 120;
        trail.style.strokeDasharray = trailLen.toFixed(1);
        trail.style.strokeDashoffset = String(trailLen * (1 - r));
      }
      var walker = visual.querySelector('.metric-mobility-walker');
      if (walker) {
        var pos = MOBILITY_WALKER[Math.min(lit, MOBILITY_WALKER.length) - 1];
        walker.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ') rotate(' + pos.rot + ')');
        walker.style.opacity = r > 0.08 ? '1' : '0.35';
      }
      var speed = visual.querySelector('.metric-mobility-speed');
      if (speed) speed.style.opacity = String(clamp((r - 0.35) / 0.65, 0, 1));
    } else if (kind === 'swelling') {
      var swellScale = 1 + r * 0.95;
      var swellGroup = visual.querySelector('.metric-knee-swell-group');
      if (swellGroup) {
        swellGroup.setAttribute('transform', 'translate(32 43) scale(' + swellScale.toFixed(3) + ')');
      }
      var shine = visual.querySelector('.metric-knee-swell-shine');
      if (shine) shine.style.opacity = r > 0.15 ? String(0.12 + r * 0.4) : '0';
      var patella = visual.querySelector('.metric-knee-patella');
      if (patella) {
        patella.setAttribute('cx', (36 + r * 2.5).toFixed(1));
        patella.setAttribute('cy', (41 + r * 1.2).toFixed(1));
        patella.setAttribute('rx', (4.2 + r * 3.2).toFixed(1));
        patella.setAttribute('ry', (5.5 + r * 3.8).toFixed(1));
      }
      var tibia = visual.querySelector('.metric-knee-tibia');
      if (tibia) {
        var flex = r * 7;
        tibia.setAttribute('transform', 'rotate(' + flex.toFixed(1) + ' 30 43)');
      }
      visual.querySelectorAll('.metric-knee-swell-ring').forEach(function (ring, i) {
        var threshold = 0.18 + i * 0.2;
        var on = r >= threshold;
        ring.classList.toggle('metric-knee-swell-ring--on', on);
        ring.style.opacity = on ? String(0.35 + (r - threshold) * 0.75) : '0.1';
      });
      widget.style.setProperty('--metric-knee-pulse-dur', (2.1 - r * 0.85).toFixed(2) + 's');
      widget.style.setProperty('--metric-knee-swell-scale', swellScale.toFixed(3));
    } else if (kind === 'fatigue') {
      var fill = visual.querySelector('.metric-battery-fill');
      if (fill) {
        var h = Math.max(2, (1 - r) * 32);
        fill.setAttribute('y', String(54 - h));
        fill.setAttribute('height', String(h));
      }
    } else if (kind === 'sleep') {
      var moon = visual.querySelector('.metric-sleep-moon');
      if (moon) moon.setAttribute('opacity', String(0.35 + r * 0.65));
      visual.querySelectorAll('.metric-sleep-star').forEach(function (star, i) {
        star.style.opacity = r >= (i + 1) * 0.22 ? '1' : '0.15';
      });
    } else if (kind === 'mood') {
      updateMoodFace(visual, r);
      widget.classList.toggle('metric-widget--mood-happy', r >= 0.72);
      widget.classList.toggle('metric-widget--mood-sad', r <= 0.28);
    } else if (kind === 'irritability') {
      updateIrritabilityVisual(visual, r);
      widget.style.setProperty('--irrit-anger', r.toFixed(3));
      widget.classList.toggle('metric-widget--irrit-chill', r <= 0.35);
      widget.classList.toggle('metric-widget--irrit-moderate', r > 0.35 && r < 0.65);
      widget.classList.toggle('metric-widget--irrit-storm', r >= 0.65);
    } else if (kind === 'weather') {
      var drops = Math.ceil(r * 5);
      visual.querySelectorAll('.metric-rain').forEach(function (drop, i) {
        drop.classList.toggle('metric-rain--on', i < drops);
      });
      widget.classList.toggle('metric-widget--weather-storm', r >= 0.62);
      var lightning = visual.querySelector('.metric-weather-lightning');
      if (lightning) lightning.classList.toggle('metric-weather-lightning--on', r >= 0.62);
    } else if (kind === 'dailyFunction') {
      var prog = visual.querySelector('.metric-ring-progress');
      var check = visual.querySelector('.metric-ring-check');
      var circ = 2 * Math.PI * 22;
      if (prog) prog.style.strokeDasharray = circ.toFixed(1);
      if (prog) prog.style.strokeDashoffset = String(circ * (1 - r));
      if (check) check.setAttribute('opacity', r >= 0.65 ? '1' : String(r * 0.5));
    }
  }

  function refreshSlider(slider) {
    if (!slider || !slider.id) return;
    var widget = slider.closest('.metric-widget');
    if (!widget) return;
    var wellness = parseInt(slider.value, 10);
    if (isNaN(wellness)) wellness = 5;
    wellness = clamp(wellness, 1, 10);
    var raw = rawFromWellness(slider.id, wellness);
    var zone = classifyZone(slider.id, wellness);
    widget.setAttribute('data-metric-zone', zone.id);
    widget.style.setProperty('--metric-color', zone.color);
    widget.setAttribute('data-metric-active', 'true');
    var display = widget.querySelector('.metric-readout__value');
    if (display) {
      display.textContent = String(wellness);
      display.classList.add('metric-readout--pulse');
      global.setTimeout(function () { display.classList.remove('metric-readout--pulse'); }, 220);
    }
    applyOasisMetricFeedback(widget, display, zone.id);
    var badge = widget.querySelector('.metric-zone-badge');
    if (badge) badge.textContent = zone.label;
    var pct = ((wellness - 1) / 9) * 100;
    slider.style.setProperty('--metric-fill-pct', pct.toFixed(1) + '%');
    slider.style.setProperty('--metric-fill-color', zone.color);
    applyVisualState(widget, slider.id, raw);
  }

  function nudgeSlider(id, delta) {
    var slider = document.getElementById(id);
    if (!slider) return;
    var min = parseInt(slider.min, 10) || 1;
    var max = parseInt(slider.max, 10) || 10;
    slider.value = String(clamp(parseInt(slider.value, 10) + delta, min, max));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof global.updateSliderColor === 'function') global.updateSliderColor(slider);
    else refreshSlider(slider);
  }

  function buildWidget(slider) {
    if (!slider || slider.dataset.metricBuilt === '1') return;
    var container = slider.closest('.slider-container');
    if (!container) return;
    slider.dataset.metricBuilt = '1';
    var id = slider.id;
    var kind = VISUAL[id] || 'dailyFunction';

    container.classList.add('metric-widget', 'metric-widget--' + id);
    container.setAttribute('data-metric-id', id);
    container.setAttribute('data-metric-active', 'false');

    var label = container.querySelector('label[for="' + id + '"]');
    var goodBad = container.querySelector('.slider-good-bad');

    var body = document.createElement('div');
    body.className = 'metric-widget__body';

    var visualWrap = document.createElement('div');
    visualWrap.className = 'metric-widget__visual';
    visualWrap.innerHTML = visualHtml(kind);
    body.appendChild(visualWrap);

    var controls = document.createElement('div');
    controls.className = 'metric-widget__controls';

    var readout = document.createElement('div');
    readout.className = 'metric-readout';
    readout.setAttribute('aria-live', 'polite');
    readout.innerHTML = '<span class="metric-readout__value">5</span><span class="metric-readout__scale">/10</span>';
    controls.appendChild(readout);

    var badge = document.createElement('span');
    badge.className = 'metric-zone-badge';
    controls.appendChild(badge);

    slider.classList.add('metric-slider');
    slider.parentNode.removeChild(slider);
    controls.appendChild(slider);

    var stepper = document.createElement('div');
    stepper.className = 'metric-stepper-row';
    stepper.innerHTML =
      '<button type="button" class="metric-stepper-btn" data-metric-nudge="' + id + '" data-delta="-1" aria-label="Decrease">−</button>' +
      '<button type="button" class="metric-stepper-btn" data-metric-nudge="' + id + '" data-delta="1" aria-label="Increase">+</button>';
    controls.appendChild(stepper);

    if (goodBad) controls.appendChild(goodBad);
    body.appendChild(controls);

    if (label) {
      label.classList.add('metric-widget__label');
      container.insertBefore(label, container.firstChild);
    }
    container.appendChild(body);

    slider.addEventListener('focus', function () {
      container.classList.add('metric-widget--focused');
    });
    slider.addEventListener('blur', function () {
      container.classList.remove('metric-widget--focused');
    });
  }

  function bindSteppers(root) {
    (root || document).querySelectorAll('[data-metric-nudge]').forEach(function (btn) {
      if (btn.dataset.metricBound === '1') return;
      btn.dataset.metricBound = '1';
      btn.addEventListener('click', function () {
        nudgeSlider(btn.getAttribute('data-metric-nudge'), parseInt(btn.getAttribute('data-delta'), 10));
      });
    });
  }

  function buildAll() {
    METRIC_IDS.forEach(function (id) {
      var slider = document.getElementById(id);
      if (slider) buildWidget(slider);
    });
    bindSteppers(document);
    if (global.RianellGraphicsPortfolio && typeof global.RianellGraphicsPortfolio.decorateLogScreens === 'function') {
      global.RianellGraphicsPortfolio.decorateLogScreens();
    }
  }

  function refreshAll() {
    METRIC_IDS.forEach(function (id) {
      var slider = document.getElementById(id);
      if (slider) refreshSlider(slider);
    });
  }

  global.RianellLogMetrics = {
    buildAll: buildAll,
    refreshSlider: refreshSlider,
    refreshAll: refreshAll,
    classifyZone: classifyZone,
    METRIC_IDS: METRIC_IDS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
