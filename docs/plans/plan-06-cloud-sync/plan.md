---
execution_order: 06
section: 8
title: Cloud sync & data portability
status: done
source: ../MASTER.md
master_section: 8
feature_ids: [D1, D2, D3, D4, D5, D6, D7]
depends_on: [plan-05-privacy-compliance/plan.md]
blocks: [plan-07-ai-engine/plan.md, plan-12-clinician-sharing/plan.md, plan-13-research-community/plan.md]
---

# Plan 06 — Section 8: Cloud sync & data portability

## Objective

Complete sync UX and portability: CSV parity, auto-sync, conflict resolution, migration imports, and optional clinician share links.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| D1 | **RN CSV export/import** — parity with PWA | Q | Parity fix cluster |
| D2 | **Scheduled auto-sync** — on app open + optional daily time | M | |
| D3 | **Conflict resolution UI** — merge picker when cloud/local differ | M | |
| D4 | **FHIR-lite export bundle** — Observation resources for key metrics | L | |
| D5 | **Import from Bearable / Flaredown / CSV templates** — migration assistants | M | |
| D6 | **Family / clinician read-only link** — time-limited encrypted share URL | L | Server-mediated |
| D7 | **Backup to user-owned cloud** — WebDAV / Drive / iCloud encrypted blob | L | |


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

- Plan 05 P3 local-only (respect when sync disabled)
- `packages/cloud-sync`, Supabase RLS baseline

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA sync | `apps/pwa-webapp/cloud-sync.js` |
| RN sync | `apps/rn-app/src/cloud/sync.ts`, `supabaseClient.ts` |
| Export | `apps/rn-app/src/data/logExportImport.ts`, PWA import/export in `app.js` |
| Schema | `docs/data-model.md`, `docs/supabase-rls-recommended.sql` |

## Agent runbook (general)

1. **D1:** Quick win — RN CSV using same headers as PWA localized export
2. **D3:** UI when `mergeHealthLogs` detects same-day divergence
3. **D6/D7:** Require security review; encrypted payloads only
4. **D5:** Map external CSV columns to `normalizeLogEntry`
5. Verify: RN cloud tests, `npm run test:unit`, manual sync smoke

## Completion gates

- [ ] D1 RN CSV parity verified
- [ ] D2–D7 implemented or deferred with reason
- [ ] Encrypted sync unchanged for `health_data` / keys
- [ ] Delete-all-cloud still clears all tables (PWA + RN)

## Cross-plan notes

- **D6** related to plan 12 clinician workflows
- **D1, L9, C10, A1, I1** = parity fixes cluster (partial overlap with other plans)

## Agent execution

### Phase A — Parity quick win (D1)

- [ ] Implement RN CSV export/import in `apps/rn-app/src/data/logExportImport.ts` matching PWA headers + localized column names
- [ ] Add settings action mirrors PWA Import/Export pane
- [ ] Round-trip test: PWA export → RN import → export

### Phase B — Sync UX (D2, D3)

| ID | Tasks |
|----|-------|
| **D2** | Sync on app foreground + optional daily time preference; respect P3 local-only |
| **D3** | When merge detects same-date conflict, show merge picker UI (PWA modal + RN screen); use `mergeHealthLogs` |

### Phase C — Portability (D4, D5, D6, D7)

| ID | Tasks |
|----|-------|
| **D4** | FHIR-lite Observation bundle for mood/pain/sleep/etc.; optional download |
| **D5** | Migration wizards: Bearable, Flaredown, generic CSV column mapper → `normalizeLogEntry` |
| **D6** | Time-limited encrypted share link (Supabase edge or signed URL); read-only; security review |
| **D7** | Encrypted blob backup to WebDAV/Drive/iCloud — defer if no OAuth scope ready |

### Phase D — Regression

- [ ] Delete-all-cloud still clears all tables (PWA + RN)
- [ ] Encrypted `health_data` path unchanged

## Feature checklist (sync with MASTER)

| ID | Status | Agent notes |
|----|--------|-------------|
| D1 | done | RN CSV parity |
| D2 | done | Auto-sync on open |
| D3 | done | Conflict resolution UI |
| D4 | deferred | FHIR-lite — MASTER |
| D5 | deferred | Migration imports — later plan |
| D6 | deferred | Clinician link — plan 12 |
| D7 | deferred | WebDAV backup |

## Verification

```bash
npm run test:unit
# RN cloud sync tests if present under apps/rn-app
```

Manual sync smoke with Supabase dev project.

## Master sync

MASTER §8 rows D1–D7; §Section rollup exec 06.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
$env:PROJECTS_EXTRA_VERIFY = "parity:inventory:check"
npm run projects:gate
```

Then: CHANGELOG → MASTER §8 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- No plaintext health data in share URLs
- Respect P3 local-only — sync must no-op with clear UI
