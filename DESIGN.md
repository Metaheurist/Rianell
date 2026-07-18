---
version: 1.0
authority: ui-ux-architecture
canonical_tokens: docs/design-token-contract.md
name: Rianell-UI-UX-Architectural-Refactor
description: Master plan for de-cluttering Rianell PWA surfaces without changing data models, state payloads, or on-device AI logic. Runtime colors and spacing remain @rianell/tokens mapped to --accent-* / --surface-* - not an external brand palette dump.
---

# Rianell UI/UX Architectural Refactor

**Audience:** Agent and human implementers of product UI.  
**Token source of truth:** [docs/design-token-contract.md](docs/design-token-contract.md) (`@rianell/tokens`).  
**Visual operations:** [docs/styling.md](docs/styling.md).

## Mission

Systematically de-clutter, modernize, and refactor the Rianell interface to cut cognitive overload, excessive scrolling, and visual bloat - while preserving 100% of logging, sync, and AI behaviour.

## Strict boundaries (non-negotiable)

1. **Logic preservation** - Do not change database schemas, state management payloads, data models, or on-device AI tracking logic. UI/layout/component-tier only.
2. **Touch targets** - Interactive controls (pills, toggles, body-map zones, segmented scales) must keep a minimum **44×44px** hit target.
3. **Design system**
   - **Single-layer cards:** one surface using `--surface-card-solid` (light `#FFFFFF` / dark equivalent), `box-shadow: var(--shadow-sm)`, border `1px solid` muted slate/neutral (`--surface-border` / `surface.borderMuted`), radius `var(--radius-xl)` (24px) or `var(--radius-lg)` (16px). Utility class: `.ui-card`.
   - **No box-inception:** never nest colored bordered boxes inside other bordered cards. Inner content is flat (no second tinted panel).
   - **60-30-10:** ~60% neutral shell, ~30% secondary structure, ~10% brand voltage. Brand fill is **`--accent-*` / `--primary-color`** (mint or active theme), restricted to active interactive states, progress fills, and primary CTAs - not decorative borders on every card.

## Execution roadmap

| Phase | Scope | Status |
|-------|--------|--------|
| **1** | Design primitives - `SegmentedScaleInput`, `Accordion` / `.ui-accordion`, `.ui-card` standardization | **Done** (docs + PWA + RN) |
| **2** | Home command center - compact header, hero CTA + 2×2 bento stats, flattened AI hub | **Done** (PWA) |
| **3** | Logs filter bar + expand-in-place details; Mood check-in first + 30-day heatmap | **Done** (PWA) |
| **4** | Wizard scale upgrade, optional vitals accordion, de-modalize goals/achievements, split-screen body map | **Done** (PWA) |
| **—** | Master plan complete (Phases 1–4). Further declutter tracks separately. | **Done** |

Do not start the next phase until the current phase is implemented and verified (unit gates + visual self-check against boundaries).

## Phase 1 primitives

### SegmentedScaleInput

- **Contract:** `min` / `max` integers (wizard metrics use **1–10**), horizontal row of number pills, replace bulky range + `+/-` steppers.
- **PWA:** `apps/pwa-webapp/modules/segmented-scale-input.js` → `window.RianellSegmentedScale`. Syncs a (often visually hidden) `<input type="range">` so existing save/read paths stay unchanged.
- **CSS:** `.segmented-scale` / `.segmented-scale__btn` in `styles.css` - min 44×44px hit targets; horizontal scroll when needed.

### Accordion

- Defaults to **closed** for optional data entry.
- **PWA:** `.ui-accordion` (BEM) on `<details>`; `.log-accordion` aliases the same flat card chrome.
- **RN:** `Accordion` (generic, `defaultOpen={false}`) plus existing `SettingsChapter` for settings chapters.

### Card standardization

- Prefer `.ui-card` / RN `Card` with muted borders - not accent-tinted nested shells.
- Documented in [docs/styling.md](docs/styling.md) § UI architectural primitives.

## Later phases (summary)

- **Home (shipped Phase 2):** Compact `home-dashboard-header` (no MOTD/EKG), `home-command-grid` with daily action hero + goals bento, flattened Ask hub + ask bar.
- **Logs / Mood (shipped Phase 3):** `#logFilterBar` (All/7D/30D/Custom), one-line summaries + Physical/Lifestyle/Mental panes; Mood check-in deck first + 30-day heatmap.
- **Wizard / Goals (shipped Phase 4):** `#vitalsAdvancedDetails` closed accordion; `#symptomsSplitLayout` map+scales + `#symptomsRegionSeverity` for tapped regions; Goals modal for targets + `#goalsAchievementsGrid` (`openGoalsModal(1)`).

## Agent protocol (every phase)

1. **Analyze** - Read `docs/styling.md`, affected modules, shared metric helpers; state the file plan in chat.
2. **Atomic execution** - One phase (or one primitive) at a time; no four-phase rewrite.
3. **Self-verify** - No state/schema changes; no box-inception; touch targets ≥ 44px; `npm run test:unit` + `verify:design-tokens` when tokens/UI CSS change.

## Reference note

An earlier Airbnb getdesign crawl lived in this file as a tooling reference only. It is **not** the Rianell runtime palette. Do not reintroduce Rausch/Airbnb Cereal as product chrome.
