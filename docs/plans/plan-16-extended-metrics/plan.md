---
execution_order: 16
section: 15
title: Extended vital signs & metrics
status: done
source: ../MASTER.md
master_section: 16
feature_ids: [VM1, VM2, VM3, VM4, VM5, VM6, VM7, VM8, VM9, VM10, VM11]
depends_on: [plan-04-logging-data-capture/plan.md, plan-15-foundation-completions/plan.md]
blocks: [plan-17-nutrition-deep-dive/plan.md, plan-19-wearables/plan.md]
---

# Plan 16 - Section 16: Extended Vital Signs & Metrics

## Objective

Add health metrics for ME/CFS, PoTS, diabetes, and general wellness communities: blood pressure, blood glucose, SpO₂, HRV, body weight/BMI, supplement library, Bristol bowel scale, pain body-map, gratitude journal, BBT, and photo log attachments.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| VM1 | **Blood pressure** - systolic/diastolic mmHg | M | Chart series |
| VM2 | **Blood glucose** - mmol/L storage, display unit pref | M | Settings glucose unit |
| VM3 | **SpO₂** - oxygen saturation % | M | 70-100 validation |
| VM4 | **HRV manual entry** - RMSSD ms | Q | Wearables auto-import Plan 19 |
| VM5 | **Body weight / BMI** - kg storage, height from profile | M | Chart series |
| VM6 | **Supplement library** - distinct from medications | M | Favorites reuse L2 |
| VM7 | **Bristol stool scale** - 1-7 | M | `digestiveModuleEnabled` gate |
| VM8 | **Pain body-map** - `painLocations[]` | M | PWA SVG; RN existing diagram |
| VM9 | **Gratitude journal** - private free text | Q | Excluded from anon pool |
| VM10 | **Basal body temperature** - cycle module | M | °C/°F unit pref |
| VM11 | **Photo attachments** - `health-photos` bucket | L | Owner-only RLS |

## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | Privacy + storage review |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** - no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** - PWA + RN parity. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **Store canonical units** - glucose mmol/L, weight kg, BBT °C; display per user prefs.

## Prerequisites

- Plan 04 (log schema, wizard, progressive tracking)
- Plan 15 (voice/barcode foundation) green CI

## Key codebase areas

| Area | Paths |
|------|-------|
| Shared schema | `packages/shared/src/logging/logSchema.mjs`, `normalizeLogEntry` in `index.mjs` |
| FHIR export | `packages/shared/src/export/fhirLite.mjs` |
| PWA wizard | `apps/pwa-webapp/app.js`, `index.html` |
| RN wizard | `apps/rn-app/src/screens/LogWizardScreen.tsx` |
| Storage | `supabase/migrations/20260626150000_health_photos_bucket.sql`, `Schema.sql` |
| i18n | `i18n-packs/locale-packs/v1/en-GB.json` |

## Agent runbook (general)

1. Extend `@rianell/shared` schema + normalizers with range clamping first
2. Wire PWA + RN wizard UI; mirror review summary and chart series
3. Add `health-photos` private bucket migration + Schema.sql
4. Update `docs/data-model.md`, `docs/platform-parity.json`
5. Verify: `npm run test:unit`, `node docs/plans/plan-16-extended-metrics/scripts/verify-plan.mjs`

## Completion gates

- [x] All VM1-VM11 implemented (RN photo picker partial - count display only)
- [x] Schema backward-compatible with existing JSON export
- [x] PWA + RN wizard parity for new fields
- [x] Unit tests in `tests/unit/plan16-metrics.test.mjs`

## Cross-plan notes

- **VM4/VM3 auto-import** → Plan 19 (wearables)
- **VM11** → Plan 17 FC food camera builds on photo attachments
- **VM9/gratitude, VM11/photos** excluded from anonymized research pool

## Agent execution

### Phase A - Schema & shared types

- [x] Extend `logSchema.mjs` with VM fields + `normalizeVitalMetrics`
- [x] Wire `normalizeLogEntry` in `index.mjs`
- [x] Unit tests for clamping, conversions, Bristol, pain locations
- [x] Update `docs/data-model.md`

### Phase B - Feature implementation (VM1-VM11)

| ID | Implementation |
|----|----------------|
| **VM1** | BP inputs PWA vitals block + RN step 1; chart series |
| **VM2** | Glucose input + unit toggle in settings |
| **VM3** | SpO₂ input + chart |
| **VM4** | HRV manual ms input |
| **VM5** | Weight + BMI from height pref |
| **VM6** | Supplements section with datalist/history |
| **VM7** | Bristol scale gated by digestive module |
| **VM8** | PWA inline SVG body-map; RN existing regions |
| **VM9** | Gratitude textarea with char counter |
| **VM10** | BBT on cycle step; temperature unit pref |
| **VM11** | PWA file upload to `health-photos`; RN attachment count |

### Phase C - Platform parity & charts

- [x] Chart series BP, glucose, SpO₂, weight (PWA Charts tab)
- [x] FHIR-lite Observation codes for vitals
- [x] `docs/platform-parity.json` extended_vital_metrics feature

## Feature checklist (sync with MASTER)

| ID | Status | Blockers |
|----|--------|----------|
| VM1 | done | |
| VM2 | done | |
| VM3 | done | |
| VM4 | done | |
| VM5 | done | |
| VM6 | done | |
| VM7 | done | |
| VM8 | done | |
| VM9 | done | |
| VM10 | done | |
| VM11 | partial | RN expo-image-picker deferred |

## Verification

```bash
npm run test:unit
node docs/plans/plan-16-extended-metrics/scripts/verify-plan.mjs
```

## Master sync

MASTER §16 rows VM1-VM11; §Section rollup exec 16 · **v1.123.0**

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
$env:PROJECTS_EXTRA_VERIFY = "verify:i18n"
npm run projects:gate
```

Then: CHANGELOG → MASTER §16 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`.

## Agent do-nots

- Do not implement wearable auto-import (Plan 19)
- Do not merge supplements into medications scheduler
- Do not include gratitude or photos in anonymized research export
