---
execution_order: 03
section: 6
title: Settings, personalization & onboarding
status: done
source: ../MASTER.md
master_section: 6
feature_ids: [S1, S2, S3, S4, S5, S6, S7, S8]
depends_on: [plan-01-platform-architecture/plan.md, plan-02-accessibility-i18n/plan.md]
blocks: [plan-04-logging-data-capture/plan.md, plan-05-privacy-compliance/plan.md]
---

# Plan 03 - Section 6: Settings, personalization & onboarding

## Objective

Deliver settings parity, onboarding wizard, and consent UX foundation. **S2** pairs with **L1** (plan 04) for progressive disclosure onboarding cluster.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| S1 | **RN tutorial parity** - reuse PWA tutorial slides as RN modal flow | M | i18n keys exist |
| S2 | **Tracking profile wizard in onboarding** - choose condition + minimal field set | M | Pairs with L1 |
| S3 | **Smart defaults from region/locale** - metric units, date format, first-day-of-week | Q | |
| S4 | **Settings search** - filter 9 panes by keyword | Q | |
| S5 | **"Simple mode" toggle** - hides AI tab, advanced performance, anonymized pool | Q | Used by plan 14 §14.3 |
| S6 | **Profile avatars / display name themes** - lightweight identity without social | Q | |
| S7 | **Consent dashboard** - single pane for all consents with revoke | M, ★ | Pairs with P2, P3 (plan 05) |
| S8 | **Export all settings + goals as portable profile** - separate from log export | Q | |


## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | CVE + performance review (Firecrawl cross-ref) |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** - no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** - PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **External setup** � See [EXTERNAL-SETUP.md](../EXTERNAL-SETUP.md) (plan-specific section).
## Prerequisites

- Plans 01-02 (i18n baseline, optional settings module extraction)
- PWA: `#settingsOverlay` carousel in `index.html`
- RN: `SettingsScreen.tsx`, `apps/rn-app/src/settings/*`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA settings | `apps/pwa-webapp/app.js` (`appSettings`, `toggleSettings`), `index.html` settings panes |
| RN settings | `apps/rn-app/src/screens/SettingsScreen.tsx`, `apps/rn-app/src/settings/` |
| Preferences | `apps/rn-app/src/storage/preferences.ts`, PWA `localStorage` `rianellSettings` |
| Tutorial | PWA `#tutorialModalOverlay`; RN tutorial screen missing (S1) |

## Agent runbook (general)

1. Read `docs/platform-parity.json` settings fields inventory
2. Implement S2 + S1 onboarding path before plan 04 L1 wiring
3. **S7:** Aggregate cookie, health data, AI model, push, anon pool consents with revoke actions
4. Parity: 9-pane carousel titles/order match PWA ↔ RN
5. Verify: `npm run parity:inventory:check`, `npm run test:unit`

## Completion gates

- [ ] All S1-S8 implemented or deferred with reason
- [ ] RN tutorial parity (S1) or documented blocker
- [ ] Settings parity inventory green for touched fields
- [ ] New strings in locale packs (plan 02)

## Cross-plan notes

- **S2 + L1** = onboarding cluster (MASTER dependency table)
- **S7** integrates with plan 05 Privacy (P1-P7)
- **S5** referenced by plan 14 progressive disclosure

## Agent execution

### Phase A - Onboarding cluster (S1, S2) - priority for plan 04

#### S1 RN tutorial parity

- [ ] Port PWA `#tutorialModalOverlay` slide content to RN modal (`TutorialModal.tsx` or onboarding stack screen)
- [ ] Reuse existing i18n keys from locale packs
- [ ] Show on first launch; "Show tutorial again" in settings Help pane

#### S2 Tracking profile wizard

- [ ] Add onboarding step: condition picker + minimal field set (mood, pain, notes default)
- [ ] Persist `trackingProfile` in preferences (`preferences.ts` / PWA `rianellSettings`)
- [ ] Export profile shape documented for plan 04 L1 unlock rules

### Phase B - Consent & privacy UX (S7)

- [ ] New settings pane or sub-pane: list all consents (cookies, health data, AI model, push, anon pool)
- [ ] Each row: status, last updated, Revoke action with confirmation
- [ ] Link to policy viewer (plan 05 P1); integrate P2 activity log slot when plan 05 lands

### Phase C - Settings enhancements (S3-S6, S8)

| ID | Tasks |
|----|-------|
| S3 | On first launch, derive units/date format/first-day-of-week from `Intl` / device locale |
| S4 | Search input filtering 9 pane titles + hint text (client-side index) |
| S5 | `simpleMode` toggle: hide AI tab, advanced perf, anon pool entry points |
| S6 | Avatar picker (preset icons) + display name theme color |
| S8 | Export/import JSON blob of settings + goals separate from log export |

### Phase D - Parity pass

- [ ] Run `npm run parity:inventory:check`; fix any new settings field mismatches
- [ ] 9-pane carousel order/titles match PWA ↔ RN

## Feature checklist (sync with MASTER)

| ID | Status | Agent notes |
|----|--------|-------------|
| S1 | pending | |
| S2 | pending | Unblocks L1 |
| S3 | pending | |
| S4 | pending | |
| S5 | pending | Used by X14.3 |
| S6 | pending | |
| S7 | pending | Pairs P2, P3 |
| S8 | pending | |

## Verification

```bash
npm run parity:inventory:check
npm run test:unit
npm run verify:i18n
```

## Master sync

MASTER §6 rows S1-S8; §Section rollup exec 03.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
$env:PROJECTS_EXTRA_VERIFY = "parity:inventory:check"
npm run projects:gate
```

Then: CHANGELOG → MASTER §6 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- Do not implement L1 unlock logic here - only store profile; plan 04 wires wizard fields
