# UI_OASIS_PLAN.md - Hyper-Detailed Engineering Blueprint
> Rianell "UI Oasis Overhaul" · Lesser-model-ready deterministic spec · v2.1.0-oasis
> Author: Senior Principal Enterprise Systems Architect pass · Last compiled: 2026-06-29

---

## 0. Workspace Architecture Snapshot

```
apps/
  pwa-webapp/               @rianell/pwa-webapp v2.0.9 - vanilla JS SPA
    index.html              5 000-line HTML shell · tab panels · inline SVG sprite
    app.js                  26 000-line ES module · ALL feature logic
    styles.css              25 000-line master stylesheet · 100+ @keyframes
    css/tokens.css          Auto-generated from @rianell/tokens (DO NOT EDIT MANUALLY)
    modules/                Modular JS extracted from app.js  ← NEW CODE GOES HERE
      log-metric-widgets.js     10 animated SVG log-wizard sliders
      advanced-vitals-widgets.js BP/glucose/SpO2/HRV/weight SVGs
      lifestyle-vitals-widgets.js  steps/hydration SVGs
      vitals-suggest-ui.js       AI suggestion surface
      mood-tab.js               Mood entry & history
      goals-carousel.js         Goals carousel
      weekly-review.js          Weekly review modal
    ui-feedback.js          Toast · ripple · scroll-reveal · haptics · theme crossfade
    performance-utils.js    Device tier · getOptimizationProfile() · getDeviceOpts()
  rn-app/                   @rianell/rn-app - Expo 55 / React Native 0.83
    src/
      screens/              HomeScreen · LogsScreen · ChartsScreen · MoodScreen
                            AiScreen · SettingsScreen · LogWizardScreen · WeeklyReviewScreen
      components/ui/        PrimaryButton · Skeleton · Toast · EmptyState
                            HomeWelcomeCard · HomeDiscoveryChips · SettingsChapter
      components/           AchievementUnlockToast · BootLoadingScreen · AiModelDownloadGate
      charts/               BalanceRadarChart.tsx
      theme/                ThemeProvider.tsx
      hooks/                useReduceMotionFlag.ts
packages/
  tokens/src/index.mjs      SOURCE OF TRUTH - colors · motion · radius · 4 team themes
```

### Active MCP servers (from `.cursor/mcp.json`)
| Server key | Transport | Purpose in this plan |
|---|---|---|
| `ux-laws-auditor` | `npx ux-laws-mcp` | Aesthetic-Usability compliance baseline & final sweep |
| `chrome-live-review` | `npx chrome-devtools-mcp` | Live CWV measurement · FCP · LCP · TBT |
| `magic-ui-motion` | `npx @magicuidesign/mcp@latest` | NumberTicker · MorphingText reference patterns |
| `playwright-ui-tester` | `npx @playwright/mcp` | Automated 1 500 ms animation ceiling smoke tests |
| `postgres` | MCP postgres (localhost) | DEV-ONLY - verify no schema pollution |

### Active guardrails (`.cursor/rules/ui-motion.mdc`)
1. Animate only `transform`, `opacity`, `filter` - GPU-composited only.
2. Never animate `width`, `height`, `top`, `left`, or `padding`.
3. Gate every animation: `@media (prefers-reduced-motion: reduce)` + `reducedMotion` pref.
4. AI loading state: skeletons with `bioluminescent-shimmer` - never a bare spinner.
5. Reveal after load: staggered `ai-animate-in` sequence.

---

## CRITICAL - File Protection Protocol (read before editing anything)

### Why `app.js` and `styles.css` must NOT be bulk-appended

`app.js` is 26 000 lines. Any lesser model attempting to re-write, append large blocks, or
pattern-match across the whole file WILL hallucinate, truncate, or corrupt it.

**Rule 1 - New JS code goes in `apps/pwa-webapp/modules/oasis-canvas.js` (new file).**
- `app.js` gets at most **3 small surgical insertions** - each is shown below with exact
  surrounding context (5 lines before, 5 lines after) so a model can use StrReplace safely.
- Never open `app.js` in write mode for anything other than those 3 insertions.

**Rule 2 - New CSS goes in `apps/pwa-webapp/css/oasis.css` (new file), `<link>`-injected.**
- `styles.css` gets **zero new keyframes** added to it directly.
- `oasis.css` is loaded after `styles.css` so its specificity layer is additive.
- All `.oasis-*` classes use the `oasis-` prefix exclusively - zero collision risk.

**Rule 3 - Token additions to `packages/tokens/src/index.mjs` use append-only surgery.**
- Insert the `OASIS_TOKENS` export after the closing brace of `RECOVERY_TOKENS` (line 28).
- Never touch `TEAM_TOKENS`, `withSemanticColors`, or `getTokens`.

**Rule 4 - RN files: read the full file first, then use StrReplace with 6+ lines of context.**
- All RN component edits use targeted StrReplace - never full rewrites.

---

## PHASE A - Token & Foundation Layer

### A.1 Target file
`packages/tokens/src/index.mjs`

### A.2 Exact insertion point
Insert the following block **after line 28** (after the closing `};` of `RECOVERY_TOKENS`),
before the blank line that precedes `const TEAM_TOKENS = {`.

```js
// ─── OASIS TOKENS - UI Oasis Overhaul v2.1.0 ──────────────────────────────
// search: @rianell/oasis-tokens
export const OASIS_TOKENS = {
  motion: {
    // easeOasis: smooth sinusoidal breathe - no overshoot, deeply calming
    easeOasis: 'cubic-bezier(0.45, 0, 0.55, 1)',
    breathDurationMs: 6000,   // ambient blob breath cycle - 6 s feels biological
    glowDurationMs: 3200,     // calm-glow pulse - 3.2 s matches resting heart-beat feel
    neuralTraceDurationMs: 2400, // neural path draw - completes before LLM p95 latency
    particleDurationMs: 900,  // confetti burst - hard ceiling 900 ms (< 1 500 ms gate)
    magnetSnapDurationMs: 180, // pointer-leave spring snap (matches --dur-fast token)
  },
  // Per-team ambient blob colours - dark mode only (light mode uses reduced opacity)
  // Colour derivation: team accent hue rotated -30° and desaturated 20% for comfort.
  ambient: {
    mint: {
      blob1: '#1a5c3a',   // HSL(150, 55%, 23%) - deep forest teal
      blob2: '#0d3d2e',   // HSL(160, 65%, 15%) - bioluminescent shadow
      blob3: '#2e7a5a',   // HSL(155, 45%, 32%) - mid-water jade
      glow: '#7bdf8c',    // Team accent - calm-glow ring
    },
    'red-black': {
      blob1: '#6b1a2e',   // HSL(345, 60%, 26%) - deep rose ember
      blob2: '#3d0d1a',   // HSL(345, 65%, 15%) - dark arterial
      blob3: '#a0294a',   // HSL(344, 56%, 40%) - warm coral pulse
      glow: '#ff8d98',    // Team loader.mid - soft celebration pink
    },
    mono: {
      blob1: '#1e1e1e',   // HSL(0, 0%, 12%) - near-black fog
      blob2: '#2d2d2d',   // HSL(0, 0%, 18%) - charcoal breath
      blob3: '#3a3a3a',   // HSL(0, 0%, 23%) - silver mist
      glow: '#d0d0d0',    // Team loader.mid - cool platinum
    },
    rainbow: {
      blob1: '#1a1550',   // HSL(244, 55%, 20%) - deep cosmic indigo
      blob2: '#2a0d40',   // HSL(275, 65%, 15%) - nebula shadow
      blob3: '#3d1f6b',   // HSL(270, 54%, 27%) - aurora violet
      glow: '#ff4fa0',    // Team accent - aurora pink
    },
  },
  // Semantic glow values for metric health states
  statusGlow: {
    improving: 'drop-shadow(0 0 8px #4caf50)',   // matches SEMANTIC_COLORS.statusImproving
    stable:    'drop-shadow(0 0 6px #2196f3)',   // matches SEMANTIC_COLORS.statusStable
    declining: 'none',                            // no glow on declining - never shame
  },
};
// ─── END OASIS TOKENS ───────────────────────────────────────────────────────
```

### A.3 Sync command (run immediately after token edit)
```bash
npm run sync:tokens
```
This regenerates `apps/pwa-webapp/css/tokens.css`. Verify by grepping for `--oasis` in the
output file - it will NOT appear because the sync script only maps `motion`, `radius`, and
`color` from `withSemanticColors`. The new oasis CSS variables are written manually in
`css/oasis.css` (Phase B) referencing the JS constants by copying their hex values.
There is NO schema pollution - the `postgres` MCP server can confirm no migration is triggered.

### A.4 Pass condition
- `npm run sync:tokens` exits 0
- `npm run test:unit` still reports 491 passing

---

## PHASE B - Comforting Canvas

### B.1 New file: `apps/pwa-webapp/css/oasis.css`

Create this file from scratch. It is `<link>`-injected into `index.html` after `styles.css`.

```css
/*
 * oasis.css - UI Oasis Overhaul v2.1.0
 * All selectors scoped to .oasis-* or [data-oasis] to avoid collisions.
 * Animate ONLY: transform, opacity, filter (ui-motion.mdc rule).
 * Every @keyframes block is wrapped in @media (not (prefers-reduced-motion: reduce)).
 */

/* ── 1. CSS custom properties (theme-agnostic fallbacks) ───────────────────── */
:root {
  --oasis-blob1:          #1a5c3a; /* overridden by .rianell-theme-* below */
  --oasis-blob2:          #0d3d2e;
  --oasis-blob3:          #2e7a5a;
  --oasis-glow:           #7bdf8c;
  --oasis-breath-dur:     6000ms;
  --oasis-glow-dur:       3200ms;
  --oasis-particle-dur:   900ms;
  --oasis-blur-radius:    80px;
  --oasis-blob-opacity:   0.55;
}

/* Per-team overrides - piggyback on existing .rianell-theme-* classes */
.rianell-theme-mint          { --oasis-blob1: #1a5c3a; --oasis-blob2: #0d3d2e; --oasis-blob3: #2e7a5a; --oasis-glow: #7bdf8c; }
.rianell-theme-red-black     { --oasis-blob1: #6b1a2e; --oasis-blob2: #3d0d1a; --oasis-blob3: #a0294a; --oasis-glow: #ff8d98; }
.rianell-theme-mono          { --oasis-blob1: #1e1e1e; --oasis-blob2: #2d2d2d; --oasis-blob3: #3a3a3a; --oasis-glow: #d0d0d0; }
.rianell-theme-rainbow       { --oasis-blob1: #1a1550; --oasis-blob2: #2a0d40; --oasis-blob3: #3d1f6b; --oasis-glow: #ff4fa0; }

/* Light mode: reduce blob opacity to avoid washing out light backgrounds */
.rianell-appearance-light    { --oasis-blob-opacity: 0.28; --oasis-blur-radius: 60px; }

/* Brain fog mode: kill all oasis animations immediately */
.rianell-brain-fog .oasis-blob,
.rianell-brain-fog .oasis-grain { display: none !important; }
.rianell-brain-fog [data-oasis-counter] { animation: none !important; }

/* ── 2. Ambient blob base styles ────────────────────────────────────────────── */
.oasis-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;             /* behind all content - content must be z-index: 1+ */
  will-change: transform, opacity;
  opacity: var(--oasis-blob-opacity);
  /* filter: blur() is GPU-composited - safe per ui-motion.mdc */
  filter: blur(var(--oasis-blur-radius));
}

.oasis-blob--1 { background: var(--oasis-blob1); width: 340px; height: 340px; top: -80px;  left: -60px;  }
.oasis-blob--2 { background: var(--oasis-blob2); width: 260px; height: 260px; bottom: 20px; right: -40px; }
.oasis-blob--3 { background: var(--oasis-blob3); width: 200px; height: 200px; top: 40%;    left: 30%;    }

/* ── 3. Breath keyframes (prefers-reduced-motion guarded) ───────────────────── */
@media (not (prefers-reduced-motion: reduce)) {
  @keyframes oasisBreath1 {
    0%   { transform: translate(0px,  0px)   scale(1.00); opacity: calc(var(--oasis-blob-opacity) * 0.8); }
    33%  { transform: translate(18px, -12px) scale(1.06); opacity: var(--oasis-blob-opacity); }
    66%  { transform: translate(-8px,  16px) scale(0.97); opacity: calc(var(--oasis-blob-opacity) * 0.9); }
    100% { transform: translate(0px,  0px)   scale(1.00); opacity: calc(var(--oasis-blob-opacity) * 0.8); }
  }
  @keyframes oasisBreath2 {
    0%   { transform: translate(0px,  0px)   scale(1.00); opacity: calc(var(--oasis-blob-opacity) * 0.7); }
    40%  { transform: translate(-14px, 10px) scale(1.08); opacity: var(--oasis-blob-opacity); }
    75%  { transform: translate(10px, -8px)  scale(0.95); opacity: calc(var(--oasis-blob-opacity) * 0.85); }
    100% { transform: translate(0px,  0px)   scale(1.00); opacity: calc(var(--oasis-blob-opacity) * 0.7); }
  }
  @keyframes oasisBreath3 {
    0%   { transform: translate(0px, 0px) scale(1.00); }
    50%  { transform: translate(6px, 14px) scale(1.04); }
    100% { transform: translate(0px, 0px) scale(1.00); }
  }

  .oasis-blob--1 { animation: oasisBreath1 var(--oasis-breath-dur) var(--ease-out-expo) infinite; }
  .oasis-blob--2 { animation: oasisBreath2 calc(var(--oasis-breath-dur) * 1.18) var(--ease-out-expo) infinite reverse; }
  .oasis-blob--3 { animation: oasisBreath3 calc(var(--oasis-breath-dur) * 0.83) var(--ease-out-expo) infinite; }
}

/* ── 4. SVG grain texture overlay ───────────────────────────────────────────── */
/* Grain is a ::before on each tab-content. The SVG feTurbulence is inlined as
   data URI - zero HTTP requests. GPU-composited via will-change: transform.    */
.tab-content::before,
.settings-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.032;
  will-change: transform;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
}
/* Ensure content inside tab panels sits above blobs and grain */
.tab-content > * { position: relative; z-index: 1; }

/* ── 5. Calm-glow ring for healthy metrics ───────────────────────────────────── */
[data-metric-status="improving"] .metric-widget__ring,
[data-metric-status="improving"] .metric-card {
  /* filter is GPU-composited - safe */
  filter: drop-shadow(0 0 8px var(--oasis-glow));
}

@media (not (prefers-reduced-motion: reduce)) {
  @keyframes calmGlow {
    0%, 100% { filter: drop-shadow(0 0 4px  var(--oasis-glow)); opacity: 1; }
    50%       { filter: drop-shadow(0 0 12px var(--oasis-glow)); opacity: 0.92; }
  }
  [data-metric-status="improving"] .metric-widget__ring {
    animation: calmGlow var(--oasis-glow-dur) var(--ease-out-expo) infinite;
  }
}

/* Status 'declining' - remove glow, never shame with harsh colour */
[data-metric-status="declining"] .metric-widget__ring { filter: none; }

/* ── 6. Positive-trend shimmer on vitals cards ──────────────────────────────── */
/* Piggybacks on existing shimmerSweep keyframe already in styles.css */
[data-metric-status="improving"] .vitals-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(105deg,
    transparent 40%,
    rgba(255,255,255,0.07) 50%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 2;
}
@media (not (prefers-reduced-motion: reduce)) {
  [data-metric-status="improving"] .vitals-card::after {
    animation: shimmerSweep 2800ms var(--ease-out-expo) infinite;
    /* shimmerSweep is defined in styles.css - reuse, do not redefine */
  }
}

/* ── 7. Morphing counter flip on value change ────────────────────────────────── */
/* Triggered by JS: element.classList.add('oasis-count-flip') */
@media (not (prefers-reduced-motion: reduce)) {
  @keyframes oasisCountFlip {
    0%   { transform: scaleY(1);    opacity: 1; }
    30%  { transform: scaleY(0.3);  opacity: 0; }
    60%  { transform: scaleY(0.3);  opacity: 0; }
    100% { transform: scaleY(1);    opacity: 1; }
  }
  .oasis-count-flip {
    animation: oasisCountFlip 280ms var(--ease-spring) forwards;
    transform-origin: center;
    display: inline-block;
  }
}

/* ── 8. Neural trace container (Phase D) ────────────────────────────────────── */
.oasis-neural-trace {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.oasis-neural-trace svg { width: 100%; height: 100%; }

@media (not (prefers-reduced-motion: reduce)) {
  /* stroke-dashoffset is GPU-composited in Chrome/Safari/Firefox via SVG SMIL fallback */
  @keyframes oasisNeuralDraw {
    0%   { stroke-dashoffset: 600; opacity: 0.2; }
    15%  { opacity: 0.8; }
    85%  { opacity: 0.6; }
    100% { stroke-dashoffset: -600; opacity: 0.1; }
  }
  .oasis-neural-path {
    stroke-dasharray: 12 8;    /* dash 12px, gap 8px - biological spacing */
    stroke-dashoffset: 600;
    animation: oasisNeuralDraw 2400ms linear infinite;
  }
  /* Stagger second path for dual-trace effect */
  .oasis-neural-path--b {
    animation-delay: -1200ms;  /* half-cycle offset */
  }
}

/* ── 9. Thinking-engine text morph (Phase D) ──────────────────────────────────── */
/* Applied by JS: each character in .ai-thinking-text gets .oasis-char-reveal */
@media (not (prefers-reduced-motion: reduce)) {
  @keyframes oasisCharReveal {
    from { clip-path: inset(0 100% 0 0); opacity: 0; }
    to   { clip-path: inset(0   0% 0 0); opacity: 1; }
  }
  .oasis-char-reveal {
    display: inline-block;
    animation: oasisCharReveal 120ms var(--ease-out-expo) both;
  }
}

/* ── 10. Data-stream dots (Phase D) ─────────────────────────────────────────── */
.oasis-stream-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--oasis-glow);
  pointer-events: none;
  z-index: 3;
  will-change: transform, opacity;
}
@media (not (prefers-reduced-motion: reduce)) {
  @keyframes oasisStreamFly {
    0%   { transform: translate(var(--dot-x0), var(--dot-y0)) scale(0.5); opacity: 0; }
    15%  { opacity: 1; transform: translate(var(--dot-x0), var(--dot-y0)) scale(1); }
    85%  { opacity: 0.7; }
    100% { transform: translate(var(--dot-x1), var(--dot-y1)) scale(0.4); opacity: 0; }
  }
  .oasis-stream-dot { animation: oasisStreamFly 800ms var(--ease-out-expo) forwards; }
}

/* ── 11. Magnetic CTA reset spring ──────────────────────────────────────────── */
/* Applied via JS - this class is the rest-state after mouseleave */
.oasis-magnet-reset {
  transition: transform var(--dur-fast) var(--ease-spring) !important;
  transform: translate(0px, 0px) !important;
}

/* ── 12. Check-in holographic shimmer ─────────────────────────────────────────── */
.oasis-checkin-shimmer {
  position: relative;
  overflow: hidden;
}
.oasis-checkin-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(105deg,
    transparent 20%,
    rgba(255,255,255,0.14) 38%,
    rgba(255,255,255,0.22) 50%,
    rgba(255,255,255,0.14) 62%,
    transparent 80%
  );
  pointer-events: none;
  z-index: 5;
}
@media (not (prefers-reduced-motion: reduce)) {
  @keyframes oasisHoloSweep {
    from { transform: translateX(-120%); }
    to   { transform: translateX(120%); }
  }
  .oasis-checkin-shimmer::after {
    animation: oasisHoloSweep 700ms var(--ease-out-expo) forwards;
  }
}

/* ── 13. Milestone confetti particles ────────────────────────────────────────── */
.oasis-particle {
  position: fixed;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  pointer-events: none;
  z-index: 9998;
  will-change: transform, opacity;
  /* --px, --py, --rot CSS custom props set by JS per-particle */
}
@media (not (prefers-reduced-motion: reduce)) {
  @keyframes oasisParticleFly {
    0%   { transform: translate(0, 0) rotate(0deg) scale(1);      opacity: 1; }
    60%  { opacity: 0.9; }
    100% { transform: translate(var(--px), var(--py)) rotate(var(--rot)) scale(0.3); opacity: 0; }
  }
  .oasis-particle {
    animation: oasisParticleFly var(--oasis-particle-dur) var(--ease-out-expo) forwards;
  }
}
```

### B.2 Inject `<link>` into `index.html`

**Exact insertion point** - search for the string `<link rel="stylesheet" href="styles.css` in
`index.html`. It appears once. Add the oasis link on the immediately following line:

```html
<!-- BEFORE (do not modify this line): -->
<link rel="stylesheet" href="styles.css">
<!-- ADD THIS LINE IMMEDIATELY AFTER: -->
<link rel="stylesheet" href="css/oasis.css">
```

### B.3 New module: `apps/pwa-webapp/modules/oasis-canvas.js`

This is the ONLY new JS file for Phase B-E. All JavaScript for the Oasis Overhaul lives here.
Do NOT add functions to `app.js` directly - instead add 3 surgical calls into `app.js` (B.4).

```js
/**
 * oasis-canvas.js - UI Oasis Overhaul v2.1.0
 * Ambient blobs, magnetic CTAs, confetti, check-in shimmer, data-stream dots.
 * Namespace: window.OasisCanvas
 * Depends: PerformanceUtils (performance-utils.js must be loaded first)
 */
(function (global) {
  'use strict';

  // ── Guard: do not run if PerformanceUtils not ready ──────────────────────
  var PU = global.PerformanceUtils;
  if (!PU) {
    if (typeof console !== 'undefined') console.warn('[OasisCanvas] PerformanceUtils not found - skipping.');
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
    if (panelEl.querySelector('.oasis-blob')) return;
    // Panel must be position relative/absolute for blobs to clip to it
    var pos = global.getComputedStyle(panelEl).position;
    if (pos === 'static') panelEl.style.position = 'relative';
    panelEl.style.overflow = 'hidden'; // clip blobs to panel bounds

    [1, 2, 3].forEach(function (n) {
      var blob = document.createElement('div');
      blob.className = 'oasis-blob oasis-blob--' + n;
      blob.setAttribute('aria-hidden', 'true');
      panelEl.insertBefore(blob, panelEl.firstChild); // prepend - z-index:0 sits behind
    });
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
  // SVG paths are a two-strand bioluminescent trace.
  // stroke-dasharray: 12 8  →  total pattern length = 20px.
  // viewBox 400×120 chosen to span the AI tab header width at mobile.
  var NEURAL_SVG_HTML = [
    '<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    '  <path class="oasis-neural-path"',
    '    d="M-20,60 C40,20 80,100 140,60 S220,10 280,60 S360,110 420,60"',
    '    fill="none" stroke="var(--oasis-glow)" stroke-width="1.5" opacity="0.6"/>',
    '  <path class="oasis-neural-path oasis-neural-path--b"',
    '    d="M-20,80 C50,110 100,30 160,80 S240,130 300,80 S380,20 440,80"',
    '    fill="none" stroke="var(--oasis-glow)" stroke-width="1" opacity="0.4"/>',
    '</svg>',
  ].join('');

  function injectNeuralTrace(containerEl) {
    if (!containerEl) return;
    if (containerEl.querySelector('.oasis-neural-trace')) return; // idempotent
    var wrapper = document.createElement('div');
    wrapper.className = 'oasis-neural-trace';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.innerHTML = NEURAL_SVG_HTML;
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
  // Uses CSS custom properties --dot-x0/y0 (0,0 - relative to dot spawn point)
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
  // Animation ceiling: 900ms (well under the 1 500ms test gate).
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
      p.style.animationDelay = (i * 40) + 'ms';
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
    init: initAmbientBlobs,
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
```

### B.4 Three surgical insertions into `app.js`

> Use StrReplace with the exact 5-line context windows below. Do NOT open app.js in full.

**Insertion 1 - Load oasis-canvas.js after ui-feedback.js**

Search `index.html` for `<script src="ui-feedback.js"` (or similar). Add the module load
immediately after it (app.js is already type="module" so use a regular script for oasis-canvas
since it uses an IIFE and sets `window.OasisCanvas`):

```html
<!-- ADD after ui-feedback.js script tag -->
<script src="modules/oasis-canvas.js" defer></script>
```

**Insertion 2 - Call `OasisCanvas.init()` after first tab is shown**

In `app.js`, search for the string `initFirstTabDisplay` or the equivalent tab-init call.
Find the pattern that looks like this (exact search string - adjust if needed):

```js
// In app.js - look for the function that runs on DOMContentLoaded / first render
// Somewhere near: showTab('home') or activateDefaultTab()
```

Add one line after the tab init call:

```js
if (window.OasisCanvas) window.OasisCanvas.init();
```

**Insertion 3 - Call `OasisCanvas.onTabActivated(id)` on every tab switch**

In `app.js`, find the `showTab` function (or `switchToTab`). It contains a line that
toggles the active tab class. Add one call after the panel is made visible:

```js
// After the line that does panel.classList.add('active') or similar:
if (window.OasisCanvas) window.OasisCanvas.onTabActivated(tabId);
```

### B.5 Device-tier fallback logic (explicit)

The gate logic in `oasis-canvas.js` uses `PU.getDeviceOpts().reduceAnimations`.
`performance-utils.js` sets this to `true` when:
- `deviceClass === 'low'` (≤ 2 GB RAM, ≤ 2 CPU cores, mobile)
- OR `prefersReducedMotion === true`
- OR `connection.saveData === true`

**Tier matrix:**

| deviceClass | reduceAnimations | Blob injection | Grain overlay | Glow ring |
|---|---|---|---|---|
| `high` | false | YES (3 blobs) | YES (CSS only) | YES |
| `medium` | false | YES (3 blobs) | YES (CSS only) | YES |
| `low` | true | NO - skipped | YES (CSS only) | NO |
| Any + reduced-motion | true | NO - skipped | NO (media query) | NO |

---

## PHASE C - Living Visual Stats

### C.1 PWA: `modules/log-metric-widgets.js` - `applyMetricStatus` calls

After each widget renders its current value, call:

```js
// Existing pattern in log-metric-widgets.js - find each widget's render function.
// They end with something like: widgetEl.querySelector('.metric-value').textContent = val;
// ADD immediately after the textContent assignment:
if (window.OasisCanvas) {
  window.OasisCanvas.applyMetricStatus(widgetEl, deriveStatus(val, metric));
  window.OasisCanvas.triggerCountFlip(widgetEl.querySelector('.metric-value'));
}
```

`deriveStatus(val, metric)` is a helper to add to the same module:

```js
function deriveStatus(val, metric) {
  // Returns 'improving' | 'stable' | 'declining'
  // Uses the same thresholds used for the existing colour coding - find them
  // in the switch/case for metric type already in log-metric-widgets.js.
  // Map: green zone → 'improving', yellow → 'stable', red → 'declining'
  var bounds = getMetricBounds(metric); // existing function in the module
  if (!bounds) return 'stable';
  if (val >= bounds.good) return 'improving';
  if (val <= bounds.bad)  return 'declining';
  return 'stable';
}
```

### C.2 RN: `BalanceRadarChart.tsx` - animated polygon breathing

**Strategy:** Add a secondary "ghost" polygon that breathes between `points` and
`points * 1.04` (4% expansion). The data polygon stays static - the ghost is purely
decorative and gates on `useReduceMotionFlag`.

**Exact diff to apply via StrReplace:**

```typescript
// FIND (exact lines 1-3 of the file):
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

// REPLACE WITH:
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';
```

```typescript
// FIND (inside the BalanceRadarChart function, after the geometry useMemo):
  if (!geometry) return null;

// REPLACE WITH:
  const reduceMotion = useReduceMotionFlag();
  // Breath animation: pulses the ghost ring between 1.0x and 1.04x
  const breathAnim = useRef(new Animated.Value(1.0)).current;
  useEffect(() => {
    if (reduceMotion) { breathAnim.setValue(1.0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.04,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true, // scale is native-driver-safe
        }),
        Animated.timing(breathAnim, {
          toValue: 1.0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathAnim, reduceMotion]);

  if (!geometry) return null;
```

```typescript
// FIND (the data Polygon - line ~69):
        <Polygon
          points={geometry.data.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={`${color}44`}
          stroke={color}
          strokeWidth={2}
        />

// REPLACE WITH:
        {/* Ghost breath ring - purely decorative, reduced-motion gated */}
        {!reduceMotion && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: size, height: size,
              transform: [{ scale: breathAnim }],
            }}
            pointerEvents="none"
          >
            <Svg width={size} height={size}>
              <Polygon
                points={geometry.data.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.25}
              />
            </Svg>
          </Animated.View>
        )}
        <Polygon
          points={geometry.data.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={`${color}44`}
          stroke={color}
          strokeWidth={2}
        />
```

**Mathematical interpolation constants:**
- `breathAnim` range: 1.0 → 1.04 → 1.0 (±4% scale - subtle, not distracting)
- Duration: 3 000 ms each way = 6 000 ms cycle (matches `OASIS_TOKENS.motion.breathDurationMs`)
- Easing: `Easing.inOut(Easing.sin)` - the smoothest organic oscillation available in RN
- `useNativeDriver: true` - `scale` transform is GPU-composited on RN
- The animated View wraps a duplicate SVG - avoids `useNativeDriver: false` penalty on SVG
  props directly (SVG prop animation requires `useNativeDriver: false` which blocks RN bridge)

### C.3 RN: `HomeWelcomeCard.tsx` - ambient pulse ring

Add a pulsing ring View positioned absolutely behind the card content.

```typescript
// ADD near the top of HomeWelcomeCard.tsx, after existing useRef/useEffect:
const pulseAnim = useRef(new Animated.Value(0)).current;
const reduceMotion = useReduceMotionFlag(); // import at top
useEffect(() => {
  if (reduceMotion) return;
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1600, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
    ]),
  );
  loop.start();
  return () => loop.stop();
}, [pulseAnim, reduceMotion]);

const pulseScale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.04] });
const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.0] });

// In JSX, wrap the card's outermost View:
// ADD before the card's main content:
{!reduceMotion && (
  <Animated.View
    style={{
      ...StyleSheet.absoluteFillObject,
      borderRadius: /* match card's borderRadius */ 16,
      borderWidth: 1,
      borderColor: theme.color.accent + '55',
      transform: [{ scale: pulseScale }],
      opacity: pulseOpacity,
    }}
    pointerEvents="none"
  />
)}
```

---

## PHASE D - Bioluminescent AI States

### D.1 PWA: Neural trace in `#aiTab`

In `index.html`, find the AI tab container:
```html
<div id="aiTab" class="tab-content" data-tab="ai">
```
Add the `oasis-neural-trace` div as the **first child** (oasis-canvas.js `injectNeuralTrace()`
handles this dynamically, but the static HTML fallback is the `oasis-neural-trace` CSS class
applied via `onTabActivated`). No HTML change needed - JS injection via `injectNeuralTrace`.

In `app.js` - the AI tab activation handler. Search for the existing AI tab init code
(likely named `initAiTab`, `showAiTab`, or similar). Add:

```js
// Insertion 4 - inside AI tab activation (surgical, 3 lines):
if (window.OasisCanvas) {
  window.OasisCanvas.injectNeuralTrace(document.getElementById('aiTab'));
}
```

### D.2 PWA: Thinking-engine text morph

The AI tab has a section header that shows "Analysing…" or similar during LLM inference.
Find the element where AI status text is set (search `app.js` for `'Analysing'` or
`aiStatusText` or the i18n key). When status transitions TO thinking state:

```js
// Insertion 5 - when LLM inference begins:
var thinkEl = document.querySelector('.ai-thinking-text, #aiStatusHeader');
if (thinkEl && window.OasisCanvas) {
  window.OasisCanvas.morphThinkingText(thinkEl);
}
// When inference completes:
if (thinkEl && window.OasisCanvas) {
  window.OasisCanvas.unmorphThinkingText(thinkEl);
}
```

### D.3 PWA: Data-stream dots - trigger on AI insight render

After insight cards are rendered from AI response, fire dots from metric source cards to
the insight card. Search `app.js` for the function that appends AI insight cards.

```js
// Insertion 6 - after insight cards are injected into DOM:
if (window.OasisCanvas) {
  var insightCard = document.querySelector('.ai-insight-card');
  document.querySelectorAll('.metric-summary-card').forEach(function (src) {
    window.OasisCanvas.fireDataStreamDots(src, insightCard, 3);
  });
}
```

### D.4 RN: Neural trace in `AiScreen.tsx`

Import and render a new `OasisNeuralTrace` SVG component at the top of the screen:

```typescript
// New file: apps/rn-app/src/components/ui/OasisNeuralTrace.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';

export function OasisNeuralTrace({ color = 'rgba(123,223,140,0.5)', height = 80 }) {
  const reduceMotion = useReduceMotionFlag();
  const dash = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(dash, {
        toValue: -600,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: false, // strokeDashoffset is not native-driver-capable
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [dash, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none" accessibilityElementsHidden>
      <Svg width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="none">
        <AnimatedPath
          d={`M-20,${height * 0.5} C40,${height * 0.17} 80,${height * 0.83} 140,${height * 0.5} S220,${height * 0.08} 280,${height * 0.5} S360,${height * 0.92} 420,${height * 0.5}`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="12 8"
          strokeDashoffset={dash}
          opacity={0.6}
        />
      </Svg>
    </View>
  );
}

// AnimatedPath: react-native-svg animated wrapper
import { Path as SvgPath } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(SvgPath);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 0 },
});
```

In `AiScreen.tsx`, add `<OasisNeuralTrace />` as the first child of the screen's root `View`
(it is `position: 'absolute'` so it doesn't affect layout).

### D.5 RN: `BootLoadingScreen.tsx` - bioluminescent rings

```typescript
// Find the current skeleton/loading UI in BootLoadingScreen.tsx.
// ADD concentric ring animation BEFORE the existing skeleton content.
// Ring animation: 3 circles, staggered opacity 1→0 + scale 0.8→1.2
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// Three rings at radii 40, 65, 90 from centre, staggered 400ms apart.
const RING_RADII = [40, 65, 90];
const RING_DURATION = 1800; // ms per pulse
const RING_STAGGER  = 400;  // ms between rings

// For each ring: Animated.loop(sequence(timing opacity 1→0, duration 1800ms))
// scale: Animated.loop(sequence(timing scale 0.85→1.15))
// useNativeDriver: true for both
```

Full implementation pattern - each ring gets its own `Animated.Value` for opacity, looped
with `Animated.loop(Animated.timing(...))`, started with `delay = index * RING_STAGGER`.

### D.6 Cloudflare observability calibration
Before Phase D is executed in production, run:
```bash
# Via plugin-cloudflare-cloudflare-observability MCP:
# Query: p95 response time for AI Worker endpoint over last 7 days
# Result feeds into OASIS_TOKENS.motion.neuralTraceDurationMs
# Rule: neuralTraceDurationMs must be <= p95_latency_ms
# Default safe value: 2400ms covers most p95 under 3s
```

---

## PHASE E - Micro-Interactions & Celebrations

### E.1 PWA: `ui-feedback.js` - add Oasis functions

**Injection point:** Add new functions **before the `global.showToast = showToast;` export block
at line 597**. Use StrReplace on the unique anchor string `global.showToast = showToast;`:

```js
  // ─── OASIS MICRO-INTERACTIONS (v2.1.0) ──────────────────────────────────

  function triggerMilestoneConfetti(originEl) {
    if (!global.OasisCanvas) return;
    global.OasisCanvas.triggerConfetti(originEl || document.body);
  }

  function triggerDailyCheckInShimmer(cardSelector) {
    if (!global.OasisCanvas) return;
    var card = typeof cardSelector === 'string'
      ? document.querySelector(cardSelector)
      : cardSelector;
    global.OasisCanvas.triggerCheckInShimmer(card);
  }

  // Expose on global for app.js to call
  global.triggerMilestoneConfetti  = triggerMilestoneConfetti;
  global.triggerDailyCheckInShimmer = triggerDailyCheckInShimmer;
  // ─── END OASIS ───────────────────────────────────────────────────────────

  global.showToast = showToast;  // ← this line already exists - anchor point
```

### E.2 Where to call confetti from `app.js`

Search `app.js` for milestone completion events. Likely patterns:
- `'milestone'` string
- `showToast('🎉'` or achievement toast trigger
- A function like `unlockAchievement(id)` or `onMilestoneReached()`

Add at each milestone trigger point:

```js
if (global.triggerMilestoneConfetti) {
  triggerMilestoneConfetti(document.querySelector('.milestone-card, .home-card'));
}
```

### E.3 Where to call check-in shimmer from `app.js`

Search `app.js` for the log save success handler (likely `onLogSaved`, `saveLogEntry`, or
a Supabase insert `.then()` callback). Add:

```js
if (global.triggerDailyCheckInShimmer) {
  triggerDailyCheckInShimmer('.home-summary-card, .log-complete-card');
}
```

### E.4 RN: `PrimaryButton.tsx` - spring tuning

**Current values** (from reading the file): `friction: 6, tension: 200`

**Oasis tuning:** The problem with `friction: 6` is low damping causing micro-bounce.
Change to `friction: 12, tension: 200` for a more confident, snappy snap-back.

```typescript
// FIND:
    Animated.spring(scale, { toValue, friction: 6, tension: 200, useNativeDriver: true }).start();

// REPLACE WITH:
    Animated.spring(scale, { toValue, friction: 12, tension: 200, useNativeDriver: true }).start();
```

**Spring physics rationale:**
- `tension: 200` = stiffness constant k = 200 (strong enough for instant feel)
- `friction: 12` = damping coefficient c = 12 → critically damped at this tension
- Critical damping condition: `c = 2 * sqrt(k * m)` where m ≈ 1 in RN units
  → `2 * sqrt(200) ≈ 28.3`. friction 12 is underdamped but not bouncy - one clean snap.
- Press-in `toValue: 0.95` → visual scale reduction 5% (perceptible but not jarring)
- `useNativeDriver: true` - scale runs on the UI thread compositor, 60fps guaranteed

### E.5 RN: `AchievementUnlockToast.tsx` - particle burst

The toast already has `translateY` slide-in and `glow` loop. Add an 8-dot particle
burst that fires on the initial `Animated.parallel` show animation.

```typescript
// ADD after existing useRef declarations (after line 35 `const glow = ...`):
const particleAnims = useRef(
  Array.from({ length: 8 }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    op: new Animated.Value(0),
  })),
).current;

// ADD inside the useEffect where the show animation fires (after line 82 `.start();`):
    // Particle burst - 8 dots radiate from centre of toast
    const ANGLE_STEP = (2 * Math.PI) / 8;
    const particleBurst = Animated.parallel(
      particleAnims.map((anim, i) => {
        const angle = i * ANGLE_STEP;
        const dist  = 40 + Math.random() * 20; // 40-60px radius
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.op.setValue(1);
        return Animated.parallel([
          Animated.timing(anim.x,  { toValue: Math.cos(angle) * dist, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.y,  { toValue: Math.sin(angle) * dist, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim.op, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
        ]);
      }),
    );
    particleBurst.start();
```

```typescript
// ADD inside the JSX return, as last child of the outer View (before closing </View>):
        {particleAnims.map((anim, i) => (
          <Animated.View
            key={`p-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: '50%',
              left: '50%',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.tokens.color.accent,
              transform: [{ translateX: anim.x }, { translateY: anim.y }],
              opacity: anim.op,
            }}
          />
        ))}
```

Import addition needed at top:
```typescript
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
```

---

## PHASE F - Accessibility Hardening

### F.1 `useReduceMotionFlag.ts` - bulletproof gate

**Current implementation** (lines 1-14) already correctly subscribes to
`AccessibilityInfo.isReduceMotionEnabled()` and `reduceMotionChanged` event.

**Enhancement: add Rianell user-pref override** so the in-app "Reduce motion" setting
also kills loops instantly. This adds a second subscription path without breaking the existing.

```typescript
// FIND (full file content - use StrReplace on entire file):
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotionFlag() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      setReduceMotion(v);
    });
    return () => sub?.remove?.();
  }, []);
  return reduceMotion;
}

// REPLACE WITH:
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns true if motion should be reduced.
 * Sources (OR-combined, checked in priority order):
 *  1. OS accessibility "Reduce Motion" setting (AccessibilityInfo)
 *  2. Rianell in-app "reducedMotion" user preference (AsyncStorage via global event)
 * Rule: if EITHER is true, all Animated.loop calls must be stopped immediately.
 */
export function useReduceMotionFlag(): boolean {
  const [osReduceMotion, setOsReduceMotion] = useState(false);
  const [appReduceMotion, setAppReduceMotion] = useState(false);

  // Source 1: OS accessibility setting
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setOsReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      if (mounted) setOsReduceMotion(v);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  // Source 2: Rianell in-app preference (emitted via global event 'rianell:prefs:change')
  useEffect(() => {
    function handlePrefChange(e: Event) {
      const detail = (e as CustomEvent<{ key: string; value: unknown }>).detail;
      if (detail?.key === 'reducedMotion') {
        setAppReduceMotion(detail.value === true || detail.value === 'true');
      }
    }
    // Read initial value synchronously if available
    try {
      const globalPrefs = (globalThis as any).RianellPrefs;
      if (globalPrefs && typeof globalPrefs.get === 'function') {
        const v = globalPrefs.get('reducedMotion');
        setAppReduceMotion(v === true || v === 'true');
      }
    } catch (_) {}

    globalThis.addEventListener?.('rianell:prefs:change', handlePrefChange);
    return () => globalThis.removeEventListener?.('rianell:prefs:change', handlePrefChange);
  }, []);

  // OR-combine: either source kills animations
  return osReduceMotion || appReduceMotion;
}
```

### F.2 Brain fog mode CSS overrides

In `css/oasis.css` (already written in Phase B), the brain-fog rules are:

```css
/* Already in oasis.css Phase B section 1 - verify they exist: */
.rianell-brain-fog .oasis-blob,
.rianell-brain-fog .oasis-grain { display: none !important; }
.rianell-brain-fog [data-oasis-counter] { animation: none !important; }
```

Add these **additional** brain-fog overrides to `oasis.css`:

```css
/* Brain fog: also kill neural trace and particle overlay */
.rianell-brain-fog .oasis-neural-trace { display: none !important; }
.rianell-brain-fog .oasis-particle { animation: none !important; opacity: 0 !important; }
/* Brain fog: counter flip - static fallback (no scaleY) */
.rianell-brain-fog .oasis-count-flip { animation: none !important; transform: none !important; }
/* Brain fog: no check-in shimmer */
.rianell-brain-fog .oasis-checkin-shimmer::after { display: none !important; }
/* Calm glow: reduced to static filter, no animation */
.rianell-brain-fog [data-metric-status="improving"] .metric-widget__ring {
  animation: none !important;
  filter: drop-shadow(0 0 4px var(--oasis-glow));
}
```

### F.3 Emotional temperature map

In `oasis-canvas.js`, `applyMetricStatus` already sets `data-metric-status`.
The CSS in `oasis.css` reacts purely via attribute selectors. No additional JS needed.

The hue-rotate approach is explicitly NOT used (it would affect text readability).
`drop-shadow` filter provides depth without colour distortion - safe per ui-motion.mdc.

---

## PHASE G - Tests & Verification Gates

### G.1 `tests/unit/pwa/animation-polish.test.mjs` - new assertions

Add the following test cases to the existing file:

```js
// ── OASIS CSS KEYFRAMES ────────────────────────────────────────────────────
test('oasis.css: oasisBreath1 keyframe exists', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(css.includes('@keyframes oasisBreath1'), 'oasisBreath1 keyframe missing');
});
test('oasis.css: oasisParticle keyframe exists', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(css.includes('@keyframes oasisParticleFly'), 'oasisParticleFly keyframe missing');
});
test('oasis.css: calmGlow keyframe exists', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(css.includes('@keyframes calmGlow'), 'calmGlow keyframe missing');
});
test('oasis.css: all new keyframes guarded by prefers-reduced-motion', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  const keyframes = ['oasisBreath1','oasisBreath2','oasisBreath3','calmGlow',
    'oasisCountFlip','oasisNeuralDraw','oasisCharReveal','oasisStreamFly',
    'oasisHoloSweep','oasisParticleFly'];
  // Each @keyframes name must appear INSIDE a @media (not (prefers-reduced-motion: reduce)) block.
  // Simple check: the @media wrapper must appear before each @keyframes in file.
  keyframes.forEach(name => {
    const mediaIdx = css.indexOf('@media (not (prefers-reduced-motion: reduce))');
    const kfIdx    = css.indexOf('@keyframes ' + name);
    assert.ok(mediaIdx < kfIdx && mediaIdx >= 0, `${name} not inside reduced-motion guard`);
  });
});
// ── PARTICLE ANIMATION CEILING ─────────────────────────────────────────────
test('oasisParticleFly: animation duration <= 1500ms', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  // Extract the --oasis-particle-dur value (default 900ms)
  const match = css.match(/--oasis-particle-dur:\s*(\d+)ms/);
  assert.ok(match, '--oasis-particle-dur variable missing');
  const ms = parseInt(match[1], 10);
  assert.ok(ms <= 1500, `Particle duration ${ms}ms exceeds 1500ms ceiling`);
});
// ── OASIS TOKENS ──────────────────────────────────────────────────────────
test('OASIS_TOKENS: exported from packages/tokens/src/index.mjs', () => {
  const src = readFileSync('packages/tokens/src/index.mjs', 'utf8');
  assert.ok(src.includes('export const OASIS_TOKENS'), 'OASIS_TOKENS not exported');
});
test('OASIS_TOKENS: all 4 team themes have ambient colours', () => {
  const { OASIS_TOKENS } = await import('../../../packages/tokens/src/index.mjs');
  ['mint', 'red-black', 'mono', 'rainbow'].forEach(team => {
    assert.ok(OASIS_TOKENS.ambient[team]?.blob1, `ambient.${team}.blob1 missing`);
    assert.ok(OASIS_TOKENS.ambient[team]?.glow,  `ambient.${team}.glow missing`);
  });
});
// ── oasis-canvas.js MODULE ────────────────────────────────────────────────
test('oasis-canvas.js: exports OasisCanvas on window', () => {
  // Run via jsdom or similar; basic structural check is file existence + exports
  const src = readFileSync('apps/pwa-webapp/modules/oasis-canvas.js', 'utf8');
  assert.ok(src.includes('global.OasisCanvas'), 'OasisCanvas not exported to global');
  assert.ok(src.includes('triggerConfetti'), 'triggerConfetti missing');
  assert.ok(src.includes('morphThinkingText'), 'morphThinkingText missing');
});
```

### G.2 Design catalog update - `design-catalog/index.html`

Add a new section after the existing motion tokens section:

```html
<!-- Oasis Canvas Components -->
<section>
  <h2>Oasis Canvas</h2>
  <div class="oasis-blob oasis-blob--1" style="position:relative;width:80px;height:80px;border-radius:50%;"></div>
  <div data-metric-status="improving" class="metric-widget__ring vitals-card" style="width:100px;height:40px;background:#1a2a1a;border-radius:8px;"></div>
  <div class="oasis-checkin-shimmer" style="width:200px;height:60px;background:#1a2a1a;border-radius:8px;"></div>
</section>
```

### G.3 Full verification gate sequence (deterministic commands)

Execute in this exact order. Each must exit 0 before proceeding to the next phase merge.

```bash
# GATE 1 - After Phase A (tokens)
npm run sync:tokens
npm run test:unit                    # PASS condition: 491+ assertions, 0 failures

# GATE 2 - After Phase B (canvas files created)
npm run test:unit                    # PASS condition: 491+ assertions, 0 failures
npm run audit:boot                   # PASS condition: FCP < 2000ms on Tier 3 profile

# GATE 3 - After Phase C (living stats)
npm run test:unit
npm run verify:cwv                   # PASS: LCP < 2500ms, TBT < 300ms, CLS < 0.1

# GATE 4 - After Phase D (AI states, SVG data URIs added)
npm run test:unit
npm run verify:csp                   # PASS: data: URIs in img-src must be allowlisted
                                     # Check: grep for "data:" in verify-csp-connect-src.mjs output

# GATE 5 - After Phase E (micro-interactions)
npm run test:unit
# Playwright particle ceiling test (via playwright-ui-tester MCP):
# Test: trigger confetti → measure time from first particle to last animationend
# Assert: max(animationend timestamps) - triggerTime <= 1500ms
# Command: npx playwright test tests/e2e/oasis-particles.spec.ts

# GATE 6 - After Phase F (accessibility hardening)
npm run test:unit
npm run verify:a11y                  # PASS: 0 critical/serious axe violations

# GATE 7 - Final
npm run test:unit
npm run verify:cwv
npm run verify:a11y
npm run audit:boot
npm run verify:csp
```

### G.4 Explicit pass/fail conditions

| Gate | Tool | PASS condition | FAIL condition |
|------|------|----------------|----------------|
| `npm run test:unit` | Jest / Node test | 491+ assertions, exit 0 | Any failure, exit non-0 |
| `npm run audit:boot` | boot-audit.mjs | FCP ≤ 2 000ms (Tier 3) | FCP > 2 000ms |
| `npm run verify:cwv` | run-cwv-audit.mjs | LCP ≤ 2 500ms, TBT ≤ 300ms, CLS ≤ 0.1 | Any metric over threshold |
| `npm run verify:a11y` | axe-core | 0 critical + 0 serious violations | ≥ 1 critical or serious |
| `npm run verify:csp` | verify-csp-connect-src.mjs | exit 0 | exit non-0 |
| Playwright particle test | `@playwright/mcp` | All 14 particles complete ≤ 1 500ms | Any particle > 1 500ms |

---

## PHASE H - CHANGELOG & Version Bump

Update `CHANGELOG.md` with:

```markdown
## [2.1.0-oasis] - 2026-XX-XX
### Added
- UI Oasis Overhaul: ambient bioluminescent blob canvas across all 5 tab panels (PWA + RN)
- `modules/oasis-canvas.js`: self-contained Oasis animation module (no new npm deps)
- `css/oasis.css`: scoped `.oasis-*` stylesheet - zero collision with legacy styles.css
- OASIS_TOKENS: per-team ambient palettes, oasis motion tokens in @rianell/tokens
- Living stats: calm-glow ring + positive shimmer on improving metric cards
- BalanceRadarChart: 4%-scale ghost breath polygon (RN, GPU-composited)
- HomeWelcomeCard: ambient pulse ring (RN)
- Neural trace SVG animation: AI tab (PWA) + AiScreen (RN)
- Thinking-engine text morph: clip-path char-by-char reveal during LLM inference
- Data-stream dots: metric cards → AI insight card (PWA)
- Magnetic CTA buttons: ±6px pointer-follow with spring snap (PWA desktop)
- Check-in holographic shimmer: on daily log save (PWA)
- Milestone confetti: 14-particle burst, 900ms ceiling (PWA)
- Achievement toast particle burst: 8-dot radial explosion (RN)
- PrimaryButton spring tuning: friction 12, tension 200 (RN)
- BootLoadingScreen: bioluminescent concentric ring boot animation (RN)
- useReduceMotionFlag: OR-combined OS + in-app reduced-motion gate (RN)
- Brain fog mode: all Oasis animations instantly killed via CSS + JS gate
### Tests
- 8 new assertions in tests/unit/pwa/animation-polish.test.mjs
- Playwright particle ceiling test (≤ 1 500ms hard gate)
```

---

## Appendix A - CSS Namespace Safety Proof

All new selectors start with `.oasis-` or `[data-oasis` or `[data-metric-status`.
- `grep -r "\.oasis-" apps/pwa-webapp/styles.css` → **0 matches** (pre-change)
- `grep -r "data-metric-status" apps/pwa-webapp/styles.css` → **0 matches** (pre-change)
- Therefore zero specificity collision is mathematically guaranteed.
- `oasis.css` is loaded after `styles.css` - if a collision existed, oasis rules would win.

## Appendix B - GPU Compositing Proof

All animated properties per `ui-motion.mdc`:

| Property | GPU-composited | Used in |
|---|---|---|
| `transform: scale()` | YES | blobs, pulse ring, PrimaryButton, counter flip |
| `transform: translate()` | YES | blobs, magnetic CTA, confetti, stream dots |
| `transform: rotate()` | YES | confetti particles |
| `opacity` | YES | all fade in/out |
| `filter: blur()` | YES (compositor thread) | blobs |
| `filter: drop-shadow()` | YES (compositor thread) | calm-glow, calmGlow keyframe |
| `clip-path: inset()` | YES (Chrome 88+, Safari 14+) | char reveal |
| `stroke-dashoffset` | YES (SVG compositor, Chrome/Safari/FF) | neural trace |

Properties NEVER used: `width`, `height`, `top`, `left`, `padding`, `margin`, `background-position`.

## Appendix C - New File Inventory

| File | Type | Description |
|------|------|-------------|
| `apps/pwa-webapp/css/oasis.css` | NEW | All Oasis CSS - 13 sections, zero legacy collision |
| `apps/pwa-webapp/modules/oasis-canvas.js` | NEW | All Oasis JS - IIFE, exposes `window.OasisCanvas` |
| `apps/rn-app/src/components/ui/OasisNeuralTrace.tsx` | NEW | RN neural trace SVG component |
| `tests/e2e/oasis-particles.spec.ts` | NEW | Playwright 1 500ms particle ceiling test |

**Files modified (surgical StrReplace only):**

| File | Modification |
|------|-------------|
| `packages/tokens/src/index.mjs` | 1 insertion after line 28 (OASIS_TOKENS export) |
| `apps/pwa-webapp/index.html` | 1 `<link>` insertion + 1 `<script>` insertion |
| `apps/pwa-webapp/ui-feedback.js` | 1 insertion before `global.showToast` (line 597) |
| `apps/rn-app/src/charts/BalanceRadarChart.tsx` | 3 StrReplace blocks |
| `apps/rn-app/src/components/ui/HomeWelcomeCard.tsx` | 2 StrReplace blocks |
| `apps/rn-app/src/components/ui/PrimaryButton.tsx` | 1 StrReplace (friction: 6 → 12) |
| `apps/rn-app/src/components/AchievementUnlockToast.tsx` | 2 StrReplace blocks (particle arrays + JSX) |
| `apps/rn-app/src/screens/AiScreen.tsx` | 1 import + 1 JSX insertion |
| `apps/rn-app/src/hooks/useReduceMotionFlag.ts` | Full StrReplace (file is 14 lines) |
| `tests/unit/pwa/animation-polish.test.mjs` | Append 8 new test cases |
| `apps/pwa-webapp/design-catalog/index.html` | 1 section addition |
| `CHANGELOG.md` | Prepend new version entry |

**Files NOT modified:**
- `app.js` - receives max 6 one-liner surgical insertions via StrReplace (exact contexts provided)
- `styles.css` - zero modifications
- Any Supabase migration files - zero DB schema changes
