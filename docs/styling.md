# Styling guide (web UI)

This document describes how the legacy web app’s visual layer is organised: **tokens**, **themes**, **major surfaces**, and **operational notes** (cache busting, motion). The canonical stylesheet is **`web/styles.css`** (large single file).

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

## Tile picker triggers (log flow)

Symptom / energy / stressor “add” controls use **content-sized pill** buttons (`.tile-picker-trigger` and related classes): circular **+** lead, label, chevron; not full-width bars. Collapsible wrappers align **`flex-start`** so the pill does not stretch.

## AI Analysis mobile slides

On narrow viewports, AI timeline sections can sit in horizontal **slides** (`.ai-mobile-pager` → `.ai-mobile-pager-track` → `.ai-mobile-pager-pane`). **Desktop** uses **‹ ›** on the sides; **mobile** hides those and relies on swipe.

**Affordance (no caption):** panes are slightly **narrower than the track** (`max-width: 768px` rules) so the **next card peeks** at the edge; a **dot row** (`#aiMobilePagerDots`, `.ai-mobile-pager-dot`) shows slide count. JavaScript resolves the active slide from **pane centers vs. scroll position**, not `scrollLeft / trackWidth`, so snap and height stay aligned.

**First visit:** optional **shimmer** bar only (`#aiMobilePagerSwipeCue`); **`localStorage`** `healthApp_aiSwipeCueSeen`; dismiss on horizontal scroll or timeout; respect **`prefers-reduced-motion: reduce`**; not shown **≥ 769px**.

## Tutorial onboarding

The first-run tutorial is a slide deck with **‹ ›** and swipe; the bottom **dot row was removed** in favour of navigation without a static step indicator.

## Reduced motion

Where animations are decorative (swipe cue, transitions), respect **`prefers-reduced-motion: reduce`** in CSS and/or avoid injecting animated UI in JavaScript.

## Data Management (Settings)

The **Export / Import / Install web app** tiles and the **Clear all data** action use the same **`--btn-chrome-*`** language as other settings controls (dark tile, thin mint border, depth shadow). **Clear** uses a **destructive** variant (dark red tint, red border) rather than flat bright red.

## App Installation (Settings carousel)

**Install on Android**, **Install on iOS** (and the **Install on this iPhone** PWA helper) use **`settings-data-btn`** + **`install-android-btn`**, **`install-ios-btn`**, or **`install-ios-device-btn`** with the same chrome as the rest of Settings (not solid green/grey/blue platform fills). Brand icons use **`var(--neon-lime)`**; Beta/Alpha badges stay distinct.

## Build

CSS-only edits do not require **`npm run build:web`**. Changes to **`web/app.js`** that ship minified **`web/app.min.js`** should run **`npm run build:web`** before release (see **[setup-and-usage.md](setup-and-usage.md)**).
