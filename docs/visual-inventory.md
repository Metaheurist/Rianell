# Rianell Visual Inventory

Living registry for the Visual System Upgrade. Status: `keep` | `unify` | `upgrade` | `retire`. Target phase: P0–P7.

## SVG sprite (PWA `index.html` + runtime inject)

| Asset ID | Location | Status | Phase | Notes |
|----------|----------|--------|-------|-------|
| icon-target | sprite | unify | P2 | Canonical; remove inline copies in goals-carousel |
| icon-medal | sprite | unify | P2 | Canonical |
| icon-check | sprite | keep | — | Pin keypad confirm |
| icon-trash | sprite | keep | — | Backspace alias via icon-backspace (P2) |
| icon-chevron-left/right | sprite | upgrade | P2 | New; replaces ‹ › text |
| icon-close | sprite | upgrade | P2 | New; replaces × text |
| icon-backspace | sprite | upgrade | P2 | New; replaces ⌫ |
| rianell-nav-* (5) | sprite | upgrade | P3 | Nav micro-bounce token alignment |
| onboard-* (11) | sprite | keep | P2 | Canonical onboarding art |
| weather-* (17) | sprite | keep | — | RN maps to Ionicons (P6) |
| AI 2026 set (10) | sprite | keep | P3 | stroke-draw on AI tab |
| metric/avatar/badge (49) | graphics-portfolio.js | keep | P3 | Runtime inject |
| docs/icons/*.svg (16) | docs/ | retire | — | README only; not app |

## Inline / duplicate SVG

| Asset | Location | Status | Phase |
|-------|----------|--------|-------|
| Goals medal/target inline | goals-carousel.js | unify | P2 → sprite `<use>` |
| Goals modal icons | goalsModalIcons.tsx | unify | P6 |
| ECG heartbeat | index.html + app.js | upgrade | P2/P3 |
| Log metric illustrations | log-metric-widgets.js | keep | P3 token durations |
| Pain body map | app.js, LogWizardScreen.tsx | keep | P6 parity |
| medTimeline export | medTimeline.mjs | unify | P2 token colors |
| printChartReport radar | printChartReport.ts | unify | P2 |

## Motion keyframe clusters (`styles.css`)

| Cluster | Count | Status | Phase |
|---------|-------|--------|-------|
| Tab/nav | ~12 | upgrade | P1/P3 |
| Boot/loading | ~12 | keep | P3 timing tighten |
| AI analysis | ~18 | upgrade | P1 guards + P3 |
| Vitals/metric widgets | ~40 | unify | P1 tokens |
| Mood deck | ~8 | upgrade | P3 |
| Goals/achievements | ~10 | keep | P3 |
| Modals/sheets | ~8 | unify | P3 modalFloatIn family |
| Global reduced-motion | 1 block | upgrade | P1 body.reduce-motion |

## Visual surfaces

| Surface | PWA | RN | Status | Phase |
|---------|-----|-----|--------|-------|
| Home dashboard | #homeTab | HomeScreen | upgrade | P3/P4 WebGL ambient |
| Bottom/top nav | tab chrome | RootNavigator | upgrade | P3/P6 |
| Charts | ApexCharts | custom SVG | upgrade | P3 |
| Log wizard | inline | LogWizardScreen | keep | P3 |
| Mood / Oasis | mood-tab + oasis | MoodScreen | upgrade | P3/P4 orb |
| AI tab | #aiTab | AiScreen | upgrade | P3 |
| Boot loader | index.html | BootLoadingScreen | keep | P3/P6 |
| Settings carousel | overlay | SettingsScreen | upgrade | P2 emoji → SVG |
| Achievements | goals modal | AchievementsPane | upgrade | P4 unlock moment |

## Raster / brand

| Asset | Path | Status | Phase |
|-------|------|--------|-------|
| PWA icons | Icons/ (generated) | keep | — |
| RN assets | rn-app/assets/ | keep | — |
| sw.js push icon | Icons/beta/Icon-192.png | unify | P0 ✓ |

## Baseline capture manifest

See [audit-history/visual-baseline-manifest.json](../audit-history/visual-baseline-manifest.json). Capture via `npm run audit:probe-shell:screenshot` at 390×844 and 1280×800, light + dark, before/after each phase.

## Phase completion log

| Phase | Status | CI / gates |
|-------|--------|------------|
| P0 Baseline | done | push-contract ✓ |
| P1 Motion tokens | done | test:unit ✓, verify:design-tokens ✓ |
| P2 SVG unify | done | sprite chevrons, goals dedupe, export colors |
| P3 Surface flare | done | home stagger, chart fade, pointer hover |
| P4 WebGL | done | lazy-webgl.mjs, webgl-scene.js, tier-gated |
| P5 Adapt | done | hover media queries, reduce-motion guards |
| P6 RN parity | done | useReduceMotionFlag, ACHIEVEMENT_TIER_COLORS |
| P7 Sign-off | done | 708 tests, audit:cwv, verify:a11y |
