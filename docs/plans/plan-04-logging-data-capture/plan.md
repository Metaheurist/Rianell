---
execution_order: 04
section: 2
title: Logging & data capture
status: done
source: ../MASTER.md
master_section: 2
feature_ids: [L1, L2, L3, L5, L6, L7, L8, L9, L11]
depends_on: [plan-03-settings-onboarding/plan.md]
blocks: [plan-05-privacy-compliance/plan.md, plan-08-llm-nlp/plan.md, plan-09-charts-analytics/plan.md, plan-11-notifications/plan.md]
---

# Plan 04 - Section 2: Logging & data capture

## Objective

Extend the canonical log schema and wizard for progressive tracking, meds, cycle data, and voice capture. Core data layer for Charts, Home, AI, and Notifications.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| L1 | **Progressive tracking profiles** - start with 3 fields; unlock categories over time | M, ★ | Pairs with S2 |
| L2 | **Favorite meals / exercises / med combos** - one-tap re-log | Q | |
| L3 | **Medication scheduler** - per-dose times, taken/skipped/missed, push reminders | L | Blocks R2 (plan 11) |
| L5 | **Barcode / photo food logging** - Open Food Facts or on-device vision | L | |
| L6 | **Symptom templates by condition** - chip sets learned per user/condition in settings | M | Not global presets |
| L7 | **Menstrual cycle module** - cycle day, phase, flow, PMS; correlate mood/pain | M | Blocks C4 (plan 09) |
| L8 | **Multi-entry per day** - AM/PM sub-entries | M | Pairs with H4 (plan 10) |
| L9 | **Offline queue on RN** - wire `offlineQueue.ts` to wizard save | Q | Infrastructure exists |
| L11 | **Guided voice log** - STT → on-device LLM field extraction | L, ★ | |


## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | CVE + performance review (Firecrawl cross-ref) |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** - no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** - PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **External setup** - See [EXTERNAL-SETUP.md](../EXTERNAL-SETUP.md) (plan-specific section).

## Prerequisites

- Plan 03 (S2 tracking wizard, settings for L6 templates)
- Shared schema: `packages/shared` `normalizeLogEntry`, `docs/data-model.md`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA wizard | `apps/pwa-webapp/app.js` (LOG_WIZARD), `index.html` `#logTab` |
| RN wizard | `apps/rn-app/src/screens/LogWizardScreen.tsx` |
| Storage | `apps/rn-app/src/storage/logs.ts`, `apps/pwa-webapp/logs-idb.js` |
| Offline | `apps/rn-app/src/storage/offlineQueue.ts` |
| Voice | `apps/rn-app/src/voice/VoiceNotesButton.tsx` |

## Agent runbook (general)

1. Extend schema in `@rianell/shared` first; migrate PWA + RN readers/writers
2. **L9:** Quick win - call `enqueueOfflineLog` on wizard save when offline
3. **L1/L6:** Store profile + templates in preferences; respect demo mode restrictions
4. **L11:** Reuse suggest-note / LLM pipeline; wellness-only extraction
5. Verify: `npm run test:unit`, parity tests for log export/import

## Completion gates

- [ ] All L1-L11 (except NR L4, L10, L12) implemented or deferred
- [ ] Schema migrations backward-compatible with existing JSON export
- [ ] PWA + RN wizard parity for new fields
- [ ] L9 offline queue wired on RN

## Cross-plan notes

- **L7 → C4** (cycle charts), **L8/H4** (micro check-ins), **L3 → R2** (med reminders)
- **L4, L10, L12** are NR - do not implement

## Agent execution

### Phase A - Schema & quick wins

#### L9 Offline queue on RN (quick win)

- [ ] In `LogWizardScreen.tsx` save path: if offline, call `enqueueOfflineLog` from `offlineQueue.ts`
- [ ] On reconnect, flush queue via existing sync hook
- [ ] Unit test: offline save enqueues; online save does not duplicate

#### Shared schema first

- [ ] Extend `packages/shared` types + `normalizeLogEntry` for: sub-entries (L8), cycle fields (L7), med doses (L3), favorites (L2)
- [ ] Update `docs/data-model.md` with migration notes (backward compatible export)

### Phase B - Core logging features

| ID | Implementation steps |
|----|------------------------|
| **L1** | Read `trackingProfile` from S2; show 3 fields day 1; unlock food/exercise/meds per schedule in preferences |
| **L2** | Store favorites array in preferences; one-tap chips on wizard steps |
| **L3** | Med schedule model: drug, dose times, status taken/skipped/missed; UI in wizard + settings; local notifications stub for plan 11 |
| **L6** | User-defined chip templates per condition in settings - not global presets; persist per user |
| **L7** | Cycle day, phase, flow, PMS symptoms fields; optional module toggle |
| **L8** | `subEntries[]` under date or AM/PM split; wizard supports partial save |
| **L5** | Optional: Open Food Facts barcode lookup OR on-device photo label (feature-flagged) |
| **L11** | STT → on-device LLM structured extraction; wellness-only; reuse `VoiceNotesButton.tsx` + suggest pipeline |

### Phase C - PWA + RN parity

- [ ] Mirror new fields in PWA wizard (`modules/log-wizard.js` or `app.js`)
- [ ] Export/import round-trip test with new fields
- [ ] Demo mode: respect privacy gates

## Feature checklist (sync with MASTER)

| ID | Status | Blockers |
|----|--------|----------|
| L1 | pending | Needs S2 |
| L2 | pending | |
| L3 | pending | Blocks R2 |
| L5 | pending | |
| L6 | pending | User-learned only |
| L7 | pending | Blocks C4 |
| L8 | pending | Blocks H4 |
| L9 | pending | Do early |
| L11 | pending | |

## Verification

```bash
npm run test:unit
# Manual: full wizard PWA + RN; export JSON; import on other platform
```

## Master sync

MASTER §2 rows L1-L11 (excl NR L4, L10, L12); §Section rollup exec 04.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §2 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- **L4, L10, L12 are NR** - do not implement drug interactions, wearables (HealthKit/Health Connect/Fitbit), or photo journal attachments
