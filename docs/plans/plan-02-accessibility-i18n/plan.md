---
execution_order: 02
section: 10
title: Accessibility & internationalization
status: done
source: ../MASTER.md
master_section: 10
feature_ids: [I1, I2, I3, I4, I5]
depends_on: [plan-01-platform-architecture/plan.md]
blocks: [plan-03-settings-onboarding/plan.md]
---

# Plan 02 — Section 10: Accessibility & internationalization

## Objective

Close i18n gaps and baseline accessibility before new settings, logging, and home UI ship. Runs early so all downstream plans use locale packs instead of hardcoded strings.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| I1 | **Close i18n gaps** — health consent body, colorblind labels, settings hints to locale packs | Q | **Prioritize first** within this plan |
| I2 | **Plain-language rewrite pass** — AI outputs and UI at B1 reading level option | M | |
| I3 | **Haptic feedback patterns** — log saved, flare marked (RN) | Q | |
| I4 | **Audio log playback** — TTS reads back today's entry | Q | |
| I5 | **High-contrast chart palettes** — separate from UI theme | Q | Pairs with plan 09 Charts |


## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | CVE + performance review (Firecrawl cross-ref) |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** — no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** — PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **External setup** � See [EXTERNAL-SETUP.md](../EXTERNAL-SETUP.md) (plan-specific section).
## Prerequisites

- Plan 01 complete or T1 extraction started (easier to i18n modular files)
- Locale packs: `apps/pwa-webapp/i18n-packs/locale-packs/v1/`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA i18n | `apps/pwa-webapp/i18n-pwa.js`, `apps/pwa-webapp/index.html` (`data-i18n`) |
| RN i18n | `apps/rn-app/src/` locale hooks, shared `@rianell/shared` |
| Accessibility | PWA `styles.css`, RN accessibility settings panes |
| Verify | `npm run verify:i18n`, `scripts/verify/i18n-all.mjs` |

## Agent runbook (general)

1. Grep for hardcoded strings called out in codebase review (health consent, colorblind options)
2. **I1:** Move strings to all 14 locale packs; run `verify:i18n`
3. **I2–I5:** Implement incrementally; I3/I4 RN-first; I5 can defer partial completion until plan 09
4. RTL (ar/he): verify new strings in `applyDocumentDirection`
5. UGC policy: never auto-translate log notes (B1)
6. Verify: `npm run test:unit`, `npm run verify:i18n`

## Completion gates

- [x] I1 complete — no known hardcoded consent/settings gaps
- [x] I2–I5 implemented or explicitly deferred with reason in this file
- [x] `verify:i18n` passes
- [x] PWA + RN parity for accessibility toggles touched

## Cross-plan notes

- **I1** required before plan 03 (Settings) and plan 05 (Privacy consent copy)
- **I5** full validation after plan 09 Charts ships chart UI
- **I6** (community translation portal) is NR — do not implement

## Agent execution

### Phase A — I1: Close i18n gaps (do first)

- [x] Grep PWA/RN for hardcoded strings: `health consent`, `colorblind`, settings hint text in `index.html` and `SettingsScreen.tsx`
- [x] Add keys to all 14 locale packs under `apps/pwa-webapp/i18n-packs/locale-packs/v1/*.json`
- [x] Replace hardcoded UI with `data-i18n` (PWA) / `t()` hooks (RN)
- [x] Run `npm run verify:i18n` — fix missing keys until green
- [x] Spot-check RTL locales (ar, he): `applyDocumentDirection` + mirrored layouts

**I1 acceptance:** `verify:i18n` passes; consent body and colorblind labels localized.

### Phase B — I2: Plain-language / B1 option

- [x] Add preference `plainLanguageMode` (or reuse accessibility settings) in PWA + RN preferences
- [x] Shorten AI summary templates in prompt packs when enabled (do not rewrite user log notes)
- [x] Add settings toggle + i18n strings; default off

### Phase C — I3–I5 (RN-first except I5 chart hook)

#### I3 Haptics (RN)

- [x] On log save success: light impact via `expo-haptics` in `LogWizardScreen.tsx`
- [x] On flare toggle: distinct pattern; respect system haptics-off

#### I4 TTS playback (RN)

- [x] Add "Read today's entry" on Home or log review using `expo-speech`
- [x] Respect locale voice; skip if TTS unavailable

#### I5 High-contrast chart palettes

- [x] Add chart palette tokens separate from UI theme in `@rianell/tokens` or chart config
- [x] Wire PWA `styles-charts.css` and RN `ChartsScreen.tsx` color arrays
- [ ] Full visual QA deferred OK until plan 09 ships — minimum: palette switcher in settings

## Feature checklist (sync with MASTER)

| ID | Status | Agent notes |
|----|--------|-------------|
| I1 | done | v1.92.6 — consent, colorblind, settings hints localized |
| I2 | done | v1.92.6 — plainLanguage toggle + summary.system.plain |
| I3 | done | v1.92.6 — save + flare haptics in LogWizardScreen |
| I4 | done | v1.92.6 — HomeScreen read-today via speakLabel |
| I5 | done | v1.92.6 — palette switcher; full chart QA with plan 09 |

## Verification

```bash
npm run verify:i18n
npm run test:unit
```

Manual: max font scale on settings + home; RTL smoke one screen.

## Master sync

MASTER §10 rows I1–I5; §Section rollup exec 02.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
$env:PROJECTS_EXTRA_VERIFY = "verify:i18n"
npm run projects:gate
```

Then: CHANGELOG → MASTER §10 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- Never auto-translate user-generated log content (B1)
- I6 (community translation portal) is NR
