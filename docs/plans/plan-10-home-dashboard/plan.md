---
execution_order: 10
section: 1
title: Home & dashboard
status: done
source: ../MASTER.md
master_section: 1
feature_ids: [H1, H2, H3, H4, H5, H6, H7]
depends_on: [plan-08-llm-nlp/plan.md, plan-09-charts-analytics/plan.md, plan-04-logging-data-capture/plan.md]
blocks: [plan-11-notifications/plan.md, plan-12-clinician-sharing/plan.md]
---

# Plan 10 ? Section 1: Home & dashboard

## Objective

Enhance the today dashboard with adaptive layout, pacing widget, streaks, micro-check-ins, weather strip, appointment countdown, and contextual LLM questions. Depends on logging (L8), charts (C9), and LLM (H7).

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| H1 | **Adaptive home layout** ? reorder cards by usage/context | M, ? | |
| H2 | **Energy budget / pacing widget** ? daily spoons from fatigue + flare history | M, ? | Pairs with C9 |
| H3 | **Good day streak & flare-free counter** ? optional, non-gamified | Q | Pairs with R6 |
| H4 | **Morning/midday/evening micro-check-ins** ? partial logs from Home | M | Requires L8 |
| H5 | **Weather & environment strip** ? barometric/AQI opt-in | M | |
| H6 | **Appointment countdown card** ? visit prep prompt | Q | Pairs with N2, CL1 |
| H7 | **Contextual home questions** ? LLM question from yesterday's gaps | M, ? | Extends homeQuestion intent |


## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | CVE + performance review (Firecrawl cross-ref) |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** - no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** - PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **External setup** ? See [EXTERNAL-SETUP.md](../EXTERNAL-SETUP.md) (plan-specific section).
## Prerequisites

- Plans 04 (L8), 08 (H7 LLM), 09 (C9 data for H2)
- PWA `homeTab`, RN `HomeScreen.tsx`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA home | `apps/pwa-webapp/app.js` (home AI chips, MOTD, goals block), `index.html` `#homeTab` |
| RN home | `apps/rn-app/src/screens/HomeScreen.tsx` |
| Suggestions | `packages/shared/src/ai/homeSuggestions.mjs` |

## Agent runbook (general)

1. Define home card registry with priority rules (**H1**)
2. **H2:** Compute spoon budget from recent logs; link to C9 chart
3. **H4:** Open partial wizard or inline sliders without full 10-step flow
4. **H7:** Gap detection (empty food, missed meds) ? single LLM question
5. Parity: FAB, goals block, AI chips behavior match where applicable
6. Verify: manual home smoke PWA + RN

## Completion gates

- [ ] H1?H7 implemented or deferred
- [ ] H8 (widgets) NR ? not in scope
- [ ] Home respects `aiEnabled` and simple mode (S5)
- [ ] No layout break at max font scale (accessibility)

## Cross-plan notes

- **H2, C9, L8, H4** = pacing cluster
- **H6, N2, CL1, CL5, C6** = clinician prep cluster
- **H3, R6** achievement-free streaks

## Agent execution

### Phase A - Card registry & adaptive layout (H1) ✓

- [x] Define home card registry: id, priority, visibility rules, component
- [x] **H1** Reorder by context: logged today → goals prominent; streak broken → gentle nudge card
- [x] Respect S5 simple mode and `aiEnabled` flags

### Phase B ? Pacing cluster (H2, H4) ? requires L8, C9

| ID | Tasks |
|----|-------|
| **H2** | Daily spoon/energy budget from recent fatigue + flare history; link to C9 chart |
| **H4** | Micro-check-in buttons (AM/midday/PM): partial log without full wizard ? uses L8 sub-entries |

### Phase C ? Engagement (H3, H6, H5)

| ID | Tasks |
|----|-------|
| **H3** | Good-day streak + flare-free counter; optional dismiss; no badges/gamification ? pairs R6 |
| **H6** | Appointment countdown card; "prep report ready?" CTA ? N2/CL1 when date within N days |
| **H5** | Weather strip: opt-in geolocation + [Open-Meteo](https://open-meteo.com/) (no API key) for pressure/AQI; correlate with weather sensitivity field; CC BY attribution in settings |

### Phase D ? LLM home question (H7)

- [ ] Gap detection: empty food, missed meds, missing sleep ? single LLM question via homeQuestion intent
- [ ] Cache daily; respect turn limits and ui-only locales (N4)

## Feature checklist (sync with MASTER)

| ID | Status | Blockers |
|----|--------|----------|
| H1 | done | |
| H2 | pending | C9 |
| H3 | pending | |
| H4 | pending | L8 |
| H5 | pending | EXTERNAL-SETUP � Plan 10 |
| H6 | pending | N2 |
| H7 | pending | Plan 08 |

## Verification

Manual home smoke PWA + RN at default and max font scale.

## Master sync

MASTER �1 rows H1?H7; �Section rollup exec 10.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG ? MASTER �1 ? commit/push ? `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- **H8 widgets/Live Activity are NR**
- No gamified pain scoring or competitive streaks
