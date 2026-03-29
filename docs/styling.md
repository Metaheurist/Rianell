# Styling guide (web UI)

This document describes how the legacy web app’s visual layer is organised: **tokens**, **themes**, **major surfaces**, and **operational notes** (cache busting, motion). The canonical stylesheet is **`web/styles.css`** (large single file).

## v1.46.3 React Native settings parity notes

- **Eight-pane titles:** The Expo settings screen (`apps/rn-app/src/screens/SettingsScreen.tsx`) follows the same **section order and naming** as the web carousel pane titles in `apps/pwa-webapp/index.html` (`data-settings-pane-title`), so documentation that refers to “Settings → Data management” or “Display options” maps to the same labelled step on mobile.
- **App installation vs PWA tiles:** On web, install/download tiles use **`settings-data-btn`** (see **App Installation** below). On React Native, the **Data management** pane uses `SettingsAppInstallSection` for text and link-style actions instead of PWA install prompts.

## v1.44.2 style alignment notes

- **Global theme parity**: pulse line, active nav tabs, goals/targets block, loading orbit/ring, and chart empty-state accents are now token-driven so theme selection is end-to-end (including mono).
- **Early theme on first paint**: `index.html` applies the saved theme class from `rianellSettings.globalTheme` before app boot so loading visuals do not flash mint.
- **Settings header navigation**: carousel dots were upgraded to clickable mini icon buttons that jump directly to each settings pane.
- **MOTD title look**: quote/title styling now supports a single-tone theme colour with stronger 3D depth layers (less multi-tone glow bleed).
- **MOTD tap spin** (dark theme, Home tab): the **`.motd-spin-host`** wrapper responds to **`pointerdown`** (and keyboard) with a **3D `rotateX`** spin. There is **no hard ~70° cap**; rapid taps add **stacked** angular velocity so the block can complete **multiple full rotations** before friction and a gentle return-to-neutral spring settle it. **Light mode** and **reduced motion** disable the interaction.

## Files

| File | Role |
| :--- | :--- |
| **`web/styles.css`** | Main application styles, design tokens in `:root`, layout, components, light mode overrides. |
| **`web/index.html`** | Loads **`styles.css?v=…`** (query string cache bust); critical inline CSS for first paint / loading overlay. |
| **`web/styles-charts.css`** | Deferred when charts open (ApexCharts + chart chrome). |

After meaningful CSS changes, **bump the `?v=`** on the stylesheet link in **`index.html`** so browsers and CDNs pick up updates.

## Design tokens (`:root`)

Dark mode defaults use a **neutral shell** (`--shell-bg`, `--background-dark`) with **mint green accents** only where needed (borders, headings, CTAs):

- **Surfaces:** `--surface-main`, `--surface-border`, `--surface-outer-glow`
- **Button chrome:** `--btn-chrome-bg`, `--btn-chrome-border`, `--btn-chrome-shadow`, etc.
- **Accents:** `--neon-lime`, `--primary-color`, `--modal-surface`, `--modal-backdrop`
- **Layout:** `--radius-*`, `--section-gap`, `--card-content-padding-x`

**`body.light-mode`** overrides these for the light theme (higher contrast text, softer green borders).

## Settings modal (carousel)

The settings overlay (`.settings-overlay` / `.settings-menu`) uses the same **modal surface** tokens as other dialogs: dark gradient background, **thin** `--surface-border`, and **`--surface-outer-glow`** (avoid heavy neon-only halos).

The content area is a **horizontal carousel** (`.settings-carousel-viewport` → `.settings-carousel-track` → `.settings-carousel-pane`). Inactive panes use **`aria-hidden`** and **`visibility: hidden`** so adjacent sections do not visually bleed. Hints (`.settings-hint`) are **left-aligned**; rows with only helper copy use a **column** layout when there is no toggle (see `.settings-option-with-hint` + `:has(.toggle-switch)`).

The header indicator row now uses **mini icon buttons** (`.settings-carousel-dot` + `.settings-carousel-dot__icon`) with click/tap jump navigation to the corresponding pane.

## Tile picker triggers (log flow)

Symptom / energy / stressor “add” controls use **content-sized pill** buttons (`.tile-picker-trigger` and related classes): circular **+** lead, label, chevron; not full-width bars. Collapsible wrappers align **`flex-start`** so the pill does not stretch.

## AI Analysis mobile slides

On narrow viewports, AI timeline sections can sit in horizontal **slides** (`.ai-mobile-pager` → `.ai-mobile-pager-track` → `.ai-mobile-pager-pane`). **Desktop** uses **‹ ›** on the sides; **mobile** hides those and relies on swipe.

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

CSS-only edits do not require **`npm run build:web`**. Changes to **`web/app.js`** that ship minified **`web/app.min.js`** should run **`npm run build:web`** before release (see **[setup-and-usage.md](setup-and-usage.md)**).
