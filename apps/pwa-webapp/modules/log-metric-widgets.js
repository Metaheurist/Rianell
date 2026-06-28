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
    var r = clamp(parseInt(raw, 10) || 0, 0, 10);
    return HIGHER_IS_BETTER[id] ? r : (10 - r);
  }

  function rawFromWellness(id, wellness) {
    var w = clamp(parseInt(wellness, 10) || 0, 0, 10);
    return HIGHER_IS_BETTER[id] ? w : (10 - w);
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
    v = clamp(v, 0, 10);
    if (v >= 8) return { id: 'good', color: '#7bdf8c', label: t('common.good', 'Good') };
    if (v >= 4) return { id: 'moderate', color: '#ffb74d', label: t('wizard.lifestyle.steps.moderate', 'Moderate') };
    return { id: 'bad', color: '#ff8a65', label: t('common.bad', 'Bad') };
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
          '<radialGradient id="metricSwellFluidGrad" cx="32" cy="40" r="18" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-swell-grad-core"/><stop offset="72%" class="metric-swell-grad-mid"/><stop offset="100%" class="metric-swell-grad-edge"/>' +
          '</radialGradient>' +
          '</defs>' +
          '<ellipse class="metric-swell-ring metric-swell-ring--3" cx="32" cy="40" rx="22" ry="26" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
          '<ellipse class="metric-swell-ring metric-swell-ring--2" cx="32" cy="40" rx="17" ry="21" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
          '<ellipse class="metric-swell-ring metric-swell-ring--1" cx="32" cy="40" rx="12" ry="15" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
          '<path class="metric-swell-bone-h" d="M6 40 H58" stroke="rgba(255,255,255,0.28)" stroke-width="3" stroke-linecap="round"/>' +
          '<path class="metric-swell-bone-v" d="M32 16 V64" stroke="rgba(255,255,255,0.28)" stroke-width="3" stroke-linecap="round"/>' +
          '<ellipse class="metric-swell-fluid" cx="32" cy="40" rx="8" ry="10" fill="url(#metricSwellFluidGrad)"/>' +
          '<ellipse class="metric-swell-shine" cx="28" cy="36" rx="3" ry="4" fill="rgba(255,255,255,0.22)"/>' +
          '<g class="metric-swell-heat" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
          '<path class="metric-swell-heat-line metric-swell-heat-line--1" d="M32 8 Q28 4 24 8"/>' +
          '<path class="metric-swell-heat-line metric-swell-heat-line--2" d="M48 18 Q52 14 48 10"/>' +
          '<path class="metric-swell-heat-line metric-swell-heat-line--3" d="M16 18 Q12 14 16 10"/>' +
          '<path class="metric-swell-heat-line metric-swell-heat-line--4" d="M52 40 Q56 40 56 36"/>' +
          '<path class="metric-swell-heat-line metric-swell-heat-line--5" d="M12 40 Q8 40 8 36"/>' +
          '</g></svg>';
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
        return '<svg class="metric-svg metric-svg--ocean" viewBox="0 0 88 72" focusable="false" aria-hidden="true">' +
          '<defs>' +
          '<linearGradient id="metricOceanSkyGrad" x1="44" y1="0" x2="44" y2="32" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-ocean-sky-top"/><stop offset="100%" class="metric-ocean-sky-bot"/>' +
          '</linearGradient>' +
          '<linearGradient id="metricOceanBackGrad" x1="44" y1="34" x2="44" y2="72" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-ocean-back-top"/><stop offset="100%" class="metric-ocean-back-bot"/>' +
          '</linearGradient>' +
          '<linearGradient id="metricOceanFrontGrad" x1="44" y1="42" x2="44" y2="72" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" class="metric-ocean-front-top"/><stop offset="100%" class="metric-ocean-front-bot"/>' +
          '</linearGradient>' +
          '<clipPath id="metricOceanClip"><rect x="0" y="24" width="88" height="48"/></clipPath>' +
          '</defs>' +
          '<rect class="metric-ocean-sky" x="0" y="0" width="88" height="32" fill="url(#metricOceanSkyGrad)"/>' +
          '<circle class="metric-ocean-sun" cx="68" cy="11" r="5.5" fill="currentColor"/>' +
          '<g class="metric-ocean-clouds">' +
          '<ellipse class="metric-ocean-cloud metric-ocean-cloud--1" cx="20" cy="13" rx="13" ry="4.5"/>' +
          '<ellipse class="metric-ocean-cloud metric-ocean-cloud--2" cx="34" cy="11" rx="10" ry="3.8"/>' +
          '<ellipse class="metric-ocean-cloud metric-ocean-cloud--3" cx="48" cy="14" rx="11" ry="4"/>' +
          '</g>' +
          '<g class="metric-ocean-sea" clip-path="url(#metricOceanClip)">' +
          '<rect class="metric-ocean-deep" x="0" y="32" width="88" height="40" fill="url(#metricOceanBackGrad)"/>' +
          '<g class="metric-ocean-wave-track metric-ocean-wave-track--back">' +
          '<g class="metric-ocean-wave-bob">' +
          '<path class="metric-ocean-wave metric-ocean-wave--back" d="M-1 40 C10 34 20 40 30 40 S50 46 60 40 S80 34 89 40 V72 H-1 Z"/>' +
          '<path class="metric-ocean-wave metric-ocean-wave--back" d="M-1 40 C10 34 20 40 30 40 S50 46 60 40 S80 34 89 40 V72 H-1 Z" transform="translate(44 0)"/>' +
          '</g></g>' +
          '<g class="metric-ocean-wave-track metric-ocean-wave-track--mid">' +
          '<g class="metric-ocean-wave-bob">' +
          '<path class="metric-ocean-wave metric-ocean-wave--mid" d="M-1 46 C12 40 22 46 32 46 S52 52 62 46 S82 40 89 46 V72 H-1 Z"/>' +
          '<path class="metric-ocean-wave metric-ocean-wave--mid" d="M-1 46 C12 40 22 46 32 46 S52 52 62 46 S82 40 89 46 V72 H-1 Z" transform="translate(44 0)"/>' +
          '</g></g>' +
          '<g class="metric-ocean-wave-track metric-ocean-wave-track--front">' +
          '<g class="metric-ocean-wave-bob">' +
          '<path class="metric-ocean-wave metric-ocean-wave--front" d="M-1 52 C11 46 21 52 31 52 S51 58 61 52 S81 46 89 52 V72 H-1 Z" fill="url(#metricOceanFrontGrad)"/>' +
          '<path class="metric-ocean-wave metric-ocean-wave--front" d="M-1 52 C11 46 21 52 31 52 S51 58 61 52 S81 46 89 52 V72 H-1 Z" fill="url(#metricOceanFrontGrad)" transform="translate(44 0)"/>' +
          '</g></g>' +
          '</g>' +
          '<g class="metric-ocean-rain">' +
          '<line class="metric-ocean-rain-drop metric-ocean-rain-drop--1" x1="14" y1="28" x2="11" y2="38"/>' +
          '<line class="metric-ocean-rain-drop metric-ocean-rain-drop--2" x1="28" y1="26" x2="25" y2="40"/>' +
          '<line class="metric-ocean-rain-drop metric-ocean-rain-drop--3" x1="42" y1="28" x2="39" y2="42"/>' +
          '<line class="metric-ocean-rain-drop metric-ocean-rain-drop--4" x1="56" y1="27" x2="53" y2="39"/>' +
          '<line class="metric-ocean-rain-drop metric-ocean-rain-drop--5" x1="70" y1="29" x2="67" y2="41"/>' +
          '<line class="metric-ocean-rain-drop metric-ocean-rain-drop--6" x1="82" y1="27" x2="79" y2="38"/>' +
          '</g>' +
          '<path class="metric-ocean-lightning" d="M48 18 L44 30 H49 L45 44 L54 28 H49 Z" fill="currentColor"/>' +
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
      var fluid = visual.querySelector('.metric-swell-fluid');
      var shine = visual.querySelector('.metric-swell-shine');
      if (fluid) {
        var rx = 4 + r * 14;
        var ry = 5 + r * 16;
        fluid.setAttribute('rx', rx.toFixed(1));
        fluid.setAttribute('ry', ry.toFixed(1));
      }
      if (shine) shine.style.opacity = r > 0.25 ? String(0.15 + r * 0.35) : '0';
      visual.querySelectorAll('.metric-swell-ring').forEach(function (ring, i) {
        var threshold = 0.22 + i * 0.22;
        var on = r >= threshold;
        ring.classList.toggle('metric-swell-ring--on', on);
        if (on) {
          var scale = 0.88 + (r - threshold) * 0.35;
          ring.setAttribute('transform', 'translate(32 40) scale(' + scale.toFixed(2) + ') translate(-32 -40)');
        } else {
          ring.removeAttribute('transform');
        }
      });
      var heatLines = Math.ceil(r * 5);
      visual.querySelectorAll('.metric-swell-heat-line').forEach(function (line, i) {
        line.classList.toggle('metric-swell-heat-line--on', i < heatLines);
      });
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
      var storm = r;
      widget.style.setProperty('--ocean-storm', storm.toFixed(3));
      widget.classList.toggle('metric-widget--ocean-calm', storm <= 0.28);
      widget.classList.toggle('metric-widget--ocean-moderate', storm > 0.28 && storm < 0.62);
      widget.classList.toggle('metric-widget--ocean-storm', storm >= 0.62);
      var rain = visual.querySelector('.metric-ocean-rain');
      if (rain) rain.style.opacity = String(clamp((storm - 0.38) / 0.62, 0, 1));
      var lightning = visual.querySelector('.metric-ocean-lightning');
      if (lightning) lightning.style.opacity = String(clamp((storm - 0.68) / 0.32, 0, 1));
      var sun = visual.querySelector('.metric-ocean-sun');
      if (sun) sun.style.opacity = String(clamp(1 - storm * 1.4, 0, 1));
      var clouds = visual.querySelector('.metric-ocean-clouds');
      if (clouds) clouds.style.opacity = String(clamp(0.15 + storm * 0.85, 0.15, 1));
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
    wellness = clamp(wellness, 0, 10);
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
    var badge = widget.querySelector('.metric-zone-badge');
    if (badge) badge.textContent = zone.label;
    var pct = (wellness / 10) * 100;
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
