---
execution_order: 09
section: 3
title: Charts & analytics
status: done
source: ../MASTER.md
master_section: 3
feature_ids: [C1, C2, C3, C4, C5, C6, C7, C8, C9, C10]
depends_on: [plan-07-ai-engine/plan.md, plan-08-llm-nlp/plan.md, plan-04-logging-data-capture/plan.md]
blocks: [plan-10-home-dashboard/plan.md, plan-12-clinician-sharing/plan.md]
---

# Plan 09 — Section 3: Charts & analytics

## Objective

Surface deterministic insights visually: correlation cards, flare timelines, RN radar chart, cycle overlays, pacing charts, and clinician export. Requires AI engine (A3) and logging extensions (L7).

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| C1 | **Automatic correlation cards** — confidence badge | M, ★ | From A3 |
| C2 | **Flare post-mortem view** — 7-day before/after timeline | M | |
| C3 | **Radar / spider chart for balance** — restore on RN | M | |
| C4 | **Menstrual overlay on charts** — shaded cycle phases | M | Requires L7 |
| C5 | **Compare periods** — month vs month, pre/post treatment | M | |
| C6 | **Export chart PNG/PDF for clinician** — one-click | Q | Feeds CL1 |
| C7 | **Uncertainty bands on predictions** — confidence interval visual | Q | |
| C8 | **Custom metrics** — user-defined scales/factors | M | |
| C9 | **Spoon / pacing chart** — planned vs actual vs fatigue | M | Pairs with H2 |
| C10 | **Remember chart view preference** — fix PWA Balance reset bug | Q | Quick win |


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

- Plan 07 A3 for C1
- Plan 04 L7 for C4
- PWA ApexCharts lazy load; RN `ChartsScreen.tsx`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA charts | `apps/pwa-webapp/app.js` (`switchTab('charts')`), `styles-charts.css` |
| RN charts | `apps/rn-app/src/screens/ChartsScreen.tsx`, `charts/summarizeCharts.ts` |
| Predictions | `@rianell/ai-engine` `predictFutureValues` |

## Agent runbook (general)

1. **C10:** Fix first — one-line behavior change in `switchTab('charts')`
2. Wire A3 outputs to C1 card UI on Charts + optionally Home
3. **C4:** Only after L7 cycle data in logs
4. **C6:** Reuse print/export utilities from clinician plan
5. Verify: chart render smoke PWA + RN, `npm run test:unit`

## Completion gates

- [ ] C10 fixed on PWA
- [ ] C1–C9 implemented or deferred
- [ ] RN parity for balance/individual/combined views documented
- [ ] I5 high-contrast palettes applied if plan 02 I5 ready

## Cross-plan notes

- **C9 + H2** pacing cluster
- **C4 + L7** cycle cluster
- **C6 + CL1 + N2** clinician prep

## Agent execution

### Phase A — Quick win (C10)

- [x] Fix PWA `switchTab('charts')` to persist last view (Balance/Individual/Combined) in `localStorage` or `appSettings`
- [x] Verify tab switch no longer resets to Balance every time

### Phase B — AI-driven visuals (C1, C2, C7)

| ID | Tasks |
|----|-------|
| **C1** | Render correlation cards from A3 output; confidence badge; Charts tab + optional Home card |
| **C2** | Flare post-mortem: 7-day before/after timeline highlighting diverging metrics |
| **C7** | Uncertainty bands on prediction series from `predictFutureValues` |

### Phase C — Cycle, pacing, compare (C4, C5, C9)

| ID | Tasks |
|----|-------|
| **C4** | Shaded cycle phase bands on mood/pain charts — **requires L7 data** |
| **C5** | Period compare UI: this month vs last; pre/post treatment windows (A4 markers) |
| **C9** | Spoon/pacing chart: planned vs actual activity vs fatigue — pairs H2 |

### Phase D — RN parity & export (C3, C6, C8) ✓

| ID | Tasks |
|----|-------|
| **C3** | Restore radar/spider balance chart on RN `ChartsScreen.tsx` (PWA reference) |
| **C6** | One-click chart PNG/PDF export; reuse print pipeline for CL1 |
| **C8** | User-defined metrics (0–10 or boolean) in schema + chart picker |

### Phase E — Accessibility

- [ ] Apply I5 high-contrast palettes if plan 02 I5 ready

## Feature checklist (sync with MASTER)

| ID | Status | Blockers |
|----|--------|----------|
| C1 | done | A3 |
| C2 | done | |
| C3 | done | |
| C4 | done | L7 |
| C5 | done | |
| C6 | done | |
| C7 | done | |
| C8 | done | |
| C9 | done | H2 |
| C10 | done | Do first |

## Verification

```bash
npm run test:unit
```

Manual: PWA + RN chart render smoke; C10 persistence; C6 export opens on mobile.

## Master sync

MASTER §3 rows C1–C10; §Section rollup exec 09.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §3 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- C4 blocked until L7 ships — defer rather than stub fake cycle data
