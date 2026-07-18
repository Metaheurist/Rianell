# Styling guide (web UI)

This document describes how the legacy web app’s visual layer is organised: **tokens**, **themes**, **major surfaces**, and **operational notes** (cache busting, motion). The canonical stylesheet is **`apps/pwa-webapp/styles.css`** (large single file), with supplemental tokens in **`apps/pwa-webapp/css/tokens.css`**. Architecture for the product UI declutter is in root **[DESIGN.md](../DESIGN.md)**; token SoT remains **[design-token-contract.md](design-token-contract.md)**.

## UI architectural primitives (Phase 1)

Flat, single-layer chrome for the home / logs / wizard refactor. **Do not** nest a second bordered/tinted box inside a card.

### `.ui-card` (single-layer surface)

| Rule | Token / value |
|------|----------------|
| Fill | `var(--surface-card-solid)` - light `#FFFFFF`, dark opaque shell |
| Border | `1px solid var(--surface-border-muted)` (neutral slate; not accent glow) |
| Radius | `var(--radius-xl)` (24px) or `var(--radius-lg)` (16px) |
| Elevation | `var(--shadow-sm)` only |
| Brand voltage | `--accent-*` on CTAs, active pills, progress - not on every card edge |

Compose existing panels onto this language: `.form-section` and `.log-accordion` / `.ui-accordion` should not reintroduce mint-washed nested cards.

## Home command center (Phase 2)

- **Header:** `#homeDashboardHeader` - avatar, greeting, date/weather, optional `#homeSyncChip`. Large MOTD + EKG strip hidden.
- **Grid:** `#homeCommandGrid` - 1 column on narrow, `5fr + 7fr` from 992px. Left `#homeHeroCard` with `#homeHeroCtaWrap` CTA (`openLogWizardFromHome`). Right `#goalsProgressBlock.goals-progress-block--bento` with `.goals-bento-grid`.
- **Ask hub:** `#homeAskHub` flats discovery pills + `#homeAskBar` → `openAiHealthChat` (same gates as before).

## Logs + Mood IA (Phase 3)

- **Logs toolbar:** `#logFilterBar` pills All / 7D / 30D / Custom; `#logSortToggle`; custom dates in `#logFilterCustom`. Legacy `#logRangeSlider` stays hidden for chart parity.
- **Log rows:** One-line `.log-entry-summary` (mood/sleep/pain/fatigue). Expand → Physical / Lifestyle / Mental tabs over existing metric groups.
- **Mood:** `#moodTabContent` renders check-in deck first, then metric cards, then `.mood-heatmap` (30 days). Ribbon history retained in module helpers but not the primary IA.

## Wizard + goals IA (Phase 4)

- **Advanced vitals:** `#vitalsAdvancedDetails` is a closed `.ui-accordion` (`Add Advanced Vitals (Optional)`). Primary BP/BPM stay outside.
- **Symptoms split:** `#symptomsSplitLayout` — `#symptomsScaleColumn` (segmented metric scales + `#symptomsRegionSeverity` for tapped body areas) + `.symptoms-split-layout__map`. From 768px, CSS grid puts the map on the left (`order: -1`). Region intensity pills sync to `#painLocation` (none/mild/pain) without schema changes.
- **Goals:** Home header **Goals & targets** opens `#goalsModal` (`openGoalsModal`). Settings carousel no longer mounts an AI & Goals pane.
- **Achievements:** Badge grid lives in the Goals modal Achievements pane (`#goalsAchievementsGrid`). `openGoalsModal(1)` opens that pane.

### `.segmented-scale` (`RianellSegmentedScale`)

Horizontal **1–10** (configurable `min`/`max`) number pills that replace range sliders + `+/-` steppers. Module: **`apps/pwa-webapp/modules/segmented-scale-input.js`**. Keeps a hidden/synced `<input type="range">` so wizard save paths stay unchanged.

- Hit target: **min 44×44px** per `.segmented-scale__btn`
- Active pill uses `--accent-primary` / `--accent-fill-*`
- Narrow viewports: row may scroll horizontally (`overflow-x: auto`)

Wired from **`log-metric-widgets.js`** via `RianellSegmentedScale.mount` after metrics build.

### `.ui-accordion` / `.log-accordion`

Native `<details>` accordion, **closed by default** for optional blocks. Flat card shell (same as `.ui-card`); summary min-height supports 44px touch. Prefer this over nesting a second `.form-section` inside another.

## v1.60.0 RTL layout (ar / he)

- **Direction:** `apps/pwa-webapp/i18n-pwa.js` sets **`document.documentElement.dir`** to `rtl` for Arabic and Hebrew via `@rianell/shared` **`textDirection()`**.
- **CSS:** Base overrides in **`styles.css`** under **`[dir="rtl"]`** - bottom nav, settings carousel dots, wizard progress, tab bar (`flex-direction: row-reverse` where needed). Prefer **logical properties** (`margin-inline-start`, `padding-inline-end`) in new rules.
- **Charts:** Do **not** mirror time-series axes; wrap embedded LTR user content (notes, numbers) in **bidi isolates** when displayed inside RTL chrome.

## v2.0.9 motion polish (PWA)

- **PWA:** Tab translate distance 38px with `--ease-out-expo`; AI summary/advice/list `:nth-child` stagger (55ms steps); `aiSlideInFade` 0.42s; shimmer `ease-in-out`; boot skeleton bar delays; active bottom-nav icon `translateY(-1px)` lift.
- **Tokens:** Motion scale unchanged (`--dur-*`, `--ease-spring`, `--ease-out-expo` in `css/tokens.css` and `@rianell/tokens`).
- **Reduced motion:** Existing `@media (prefers-reduced-motion: reduce)` and `.reduce-motion` guards cover new PWA animations.

## v1.47.0 UI feedback and motion

- **`ui-feedback.js`:** Shared **`showToast`**, haptics, ripple, scroll-reveal, offline banner, theme crossfade helpers, and modal open/close utilities. **`app.js`** wraps success paths with **`notifySuccess`** / **`notifyUser`**.
- **Motion scale:** **`--ease-spring`**, **`--dur-*`**, semantic status colors, elevation tokens in **`styles.css`**; mirrored in **`@rianell/tokens`**.
- **Surfaces:** Home hero card + quick actions, goals SVG progress rings, direction-aware tab transitions, wizard step slides + morphing dots, chart skeleton fade, cloud sync **`.status-syncing`** pulse.
- **Reduced motion:** Decorative motion (toasts, tab/chart crossfades, wizard slides) respects **`prefers-reduced-motion: reduce`**.

## v1.44.2 style alignment notes

- **Global theme parity**: pulse line, active nav tabs, goals/targets block, loading orbit/ring, and chart empty-state accents are now token-driven so theme selection is end-to-end (including mono).
- **Early theme on first paint**: `index.html` applies the saved theme class from `rianellSettings.globalTheme` before app boot so loading visuals do not flash mint.
- **Settings header navigation**: carousel dots were upgraded to clickable mini icon buttons that jump directly to each settings pane.
- **Theme-token UI icons**: Remaining emoji UI markers were replaced with the inline SVG sprite in `index.html` and the `svgIcon()` helper in `app.js`. Icons use **`--ui-icon-*`** tokens in `styles.css`, so settings, chart controls, log cards, AI cards, and empty states follow the active global theme.
- **MOTD title look**: quote/title styling now supports a single-tone theme colour with stronger 3D depth layers (less multi-tone glow bleed).
- **MOTD tap spin** (dark theme, Home tab): the **`.motd-spin-host`** wrapper responds to **`pointerdown`** (and keyboard) with a **3D `rotateX`** spin. There is **no hard ~70° cap**; rapid taps add **stacked** angular velocity so the block can complete **multiple full rotations** before friction. **Each tap increments spring charge**; when spin slows, return-to-neutral uses a **stiffer spring** for higher charge, so **more taps snap the text back faster** (slingshot). **Light mode** and **reduced motion** disable the interaction.

## Files

| File | Role |
| :--- | :--- |
| **`apps/pwa-webapp/styles.css`** | Main application styles, design tokens in `:root`, layout, components, light mode overrides (includes `.ui-card`, `.segmented-scale`, `.ui-accordion`). |
| **`apps/pwa-webapp/css/tokens.css`** | Supplemental semantic/motion tokens (loaded before **`styles.css`**). |
| **`apps/pwa-webapp/modules/segmented-scale-input.js`** | Reusable 1-N pill scale; syncs range inputs for log metrics. |
| **`apps/pwa-webapp/ui-feedback.js`** | Toast, haptic, ripple, offline, theme crossfade, and modal animation helpers. |
| **`apps/pwa-webapp/index.html`** | Loads **`css/tokens.css`**, **`styles.css?v=…`**, and **`ui-feedback.js`**; critical inline CSS for first paint / loading overlay. |
| **`apps/pwa-webapp/styles-charts.css`** | Deferred when charts open (ApexCharts + chart chrome). |
| **`DESIGN.md`** | Product UI refactor roadmap and non-negotiable UX boundaries. |

After meaningful CSS changes, **bump the `?v=`** on the stylesheet link in **`index.html`** so browsers and CDNs pick up updates.

## Design tokens (`:root`)

Dark mode defaults use a **neutral shell** (`--shell-bg`, `--background-dark`) with **mint green accents** only where needed (borders, headings, CTAs):

- **Surfaces:** `--surface-main`, `--surface-border`, `--surface-outer-glow`
- **Button chrome:** `--btn-chrome-bg`, `--btn-chrome-border`, `--btn-chrome-shadow`, etc.
- **Accents:** `--neon-lime`, `--primary-color`, `--modal-surface`, `--modal-backdrop`
- **Theme-aware accents (v1.120.0 / v2.2.8):** `--accent-primary`, `--accent-soft`, `--accent-subtle-bg`, `--accent-fill-*`, `--accent-border*`, `--accent-glow-*`, `--accent-active-gradient`, `--accent-progress-gradient`, plus light-mode `--toggle-track-off` - use these instead of hardcoded mint greens (`#4caf50`, `rgba(76, 175, 80, …)`, `rgba(123, 223, 140, …)`).
- **Layout:** `--radius-*`, `--section-gap`, `--card-content-padding-x`

**`body.light-mode`** overrides these for the light theme (higher contrast text, softer green borders).

## Settings modal (carousel)

The settings overlay (`.settings-overlay` / `.settings-menu`) uses the same **modal surface** tokens as other dialogs: dark gradient background, **thin** `--surface-border`, and **`--surface-outer-glow`** (avoid heavy neon-only halos).

The content area is a **horizontal carousel** (`.settings-carousel-viewport` → `.settings-carousel-track` → `.settings-carousel-pane`). Inactive panes use **`aria-hidden`** and **`visibility: hidden`** so adjacent sections do not visually bleed. Hints (`.settings-hint`) are **left-aligned**; rows with only helper copy use a **column** layout when there is no toggle (see `.settings-option-with-hint` + `:has(.toggle-switch)`).

The header indicator row now uses **mini icon buttons** (`.settings-carousel-dot` + `.settings-carousel-dot__icon`) with click/tap jump navigation to the corresponding pane. **v1.53.1:** **nine** panes (`--settings-pane-count: 9`, includes Privacy & region); the dot strip **scrolls horizontally** when icons do not fit (`overflow-x: auto`).

## Alert modal (policy HTML)

Policy summaries opened from Privacy & region use **`showAlertModal(..., { html: true })`**; **`#alertModalMessage.alert-modal-message--html`** scrolls long content with left-aligned section headings.

Symptom / energy / stressor “add” controls use **content-sized pill** buttons (`.tile-picker-trigger` and related classes): circular **+** lead, label, chevron; not full-width bars. Collapsible wrappers align **`flex-start`** so the pill does not stretch.

## AI Analysis mobile slides

On narrow viewports, AI timeline sections can sit in horizontal **slides** (`.ai-mobile-pager` → `.ai-mobile-pager-track` → `.ai-mobile-pager-pane`). **Desktop** uses **‹ ›** on the sides; **mobile** hides those and relies on swipe.

**Chapter layout (v1.134.0):** Each `.ai-chapter` (`.ai-chapter--overview`, `--trends`, `--lifestyle`, `--mind`, `--body`) is one pager slide. Semantic status colours use `--ai-status-optimal`, `--ai-status-caution`, `--ai-status-alert`, and `--ai-status-neutral`. Loading uses `.ai-skeleton-loading` shimmer blocks (respect **`prefers-reduced-motion`**).

**Affordance (no caption):** panes are slightly **narrower than the track** (`max-width: 768px` rules) so the **next card peeks** at the edge; a **dot row** (`#aiMobilePagerDots`, `.ai-mobile-pager-dot`) shows slide count. JavaScript resolves the active slide from **pane centers vs. scroll position**, not `scrollLeft / trackWidth`, so snap and height stay aligned.

**First visit:** optional **shimmer** bar only (`#aiMobilePagerSwipeCue`); **`localStorage`** `healthApp_aiSwipeCueSeen`; dismiss on horizontal scroll or timeout; respect **`prefers-reduced-motion: reduce`**; not shown **≥ 769px**.

For the pain-by-body-part card inside AI Analysis, mobile now prefers **fit-to-card table layout** (responsive columns, tighter paddings) instead of an inner horizontal scroller.

## Tutorial onboarding

The first-run tutorial is a slide deck with **‹ ›** and swipe; the bottom **dot row was removed** in favour of navigation without a static step indicator.

## Log wizard review (Step 10)

`#logReviewSummary` now renders grouped **review cards** (`.log-review-card`) with label/value rows (`.log-review-row`) instead of a single long list. This improves scanability before save and stacks cleanly on narrow screens.

Skip behaviour in optional steps is now **discard-and-advance**: pressing Skip clears the active step’s current inputs/items, then moves to the next step.

## Loading overlay planet

The loading orbit widget uses layered pseudo-elements for liquid motion:

- `.loading-sun-orbit__body` (small orbiting dot): glow + inner slosh/sheen.
- `.loading-sun-orbit__sun` (main planet): larger core with swirl/wobble layers to make liquid movement visibly obvious.
- `.loading-sun-orbit__ring`: now doubles as the **loading progress bar** (circular/orbit progress). The old straight fluid bar was removed; progress is rendered on the ring arc via CSS variable updates from `app.js`.
- The ring's progress fill (`.loading-sun-orbit__ring::after`) now layers a moving `repeating-conic-gradient` over the arc so loading reads as **flowing water** while still respecting `--loading-progress` from 0-100%.

Critical first-paint CSS in `index.html` mirrors these rules so the same animation appears before `styles.css` fully loads.

Theme-specific overrides for loading ring/body/sun are applied for `theme-red-black`, `theme-mono`, and `theme-rainbow` to avoid mint fallback in non-mint themes.

## v1.120.0 theme accent pass (PWA)

- **CSS:** Bulk replacement of Material green literals with `--accent-*` tokens in `styles.css` / `styles-charts.css`. Themed `body` blocks set `--ui-icon-color` and `--home-checkin-icon-color`.
- **JS (`app.js`):** `getThemePrimaryColor()`, `getThemeAccentSoft()`, `themePrimaryRgba()`, `colorToRgba()` - read tokens from **`document.body`** so non-mint themes apply to ApexCharts options, AI trend inline colours, and edit sliders. `setGlobalTheme()` calls `refreshCharts()` and re-runs `generateAISummary()` when AI results are on screen.
- **Modal save icons:** `.modal-save-btn .ui-svg-icon { color: inherit }` so icons match gradient button text.
- **Cache bust:** Bump `styles.css?v=` in `index.html` after CSS changes.
- **Still mint (low traffic):** GDPR modal inline styles, print/export recovery buttons - not part of main app chrome.

## App icon / beta badge styling

`web/Icons/` holds the master icon rasters and `web/Icons/beta/` holds beta variants. The beta badge pipeline now:

- Uses **theme-green** badge colors (not orange).
- Places the badge in the **top-right** corner of app icons.
- Keeps originals untouched, writing only to `web/Icons/beta/`.

Scripts:

- `npm run icons:generate -- --source "C:/path/to/source.png"` regenerates `logo-source.png` and all `Icon-*.png` base sizes.
- `npm run icons:beta` regenerates the beta set from masters with the top-right green beta badge.

The floating `+` chip (`.app-beta-badge`) uses the same green palette for visual consistency with icon badges.

## Reduced motion

Where animations are decorative (swipe cue, transitions), respect **`prefers-reduced-motion: reduce`** in CSS and/or avoid injecting animated UI in JavaScript.

## Data Management (Settings)

The **Export / Import / Install web app** tiles and the **Clear all data** action use the same **`--btn-chrome-*`** language as other settings controls (dark tile, thin mint border, depth shadow). **Clear** uses a **destructive** variant (dark red tint, red border) rather than flat bright red.

## App Installation (Settings carousel)

**Install on Android**, **Install on iOS** (and the **Install on this iPhone** PWA helper) use **`settings-data-btn`** + **`install-android-btn`**, **`install-ios-btn`**, or **`install-ios-device-btn`** with the same chrome as the rest of Settings (not solid green/grey/blue platform fills). Brand icons use **`var(--neon-lime)`**; Beta/Alpha badges stay distinct.

## Build

CSS-only edits do not require **`npm run build:web`**. Changes to **`apps/pwa-webapp/app.js`** that ship a production minified bundle should run **`npm run build:web`** (or **`npm run build:web:min`** for the minified **`.web-dist`** tree) before release; output filenames are content-hashed (**`app.<hash>.min.js`**, **`asset-manifest.json`** - see **[setup-and-usage.md](setup-and-usage.md)**).
