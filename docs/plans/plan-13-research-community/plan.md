---
execution_order: 13
section: 12
title: Research & anonymized pool
status: done
source: ../MASTER.md
master_section: 12
feature_ids: [RE1, RE4]
depends_on: [plan-07-ai-engine/plan.md, plan-06-cloud-sync/plan.md, plan-05-privacy-compliance/plan.md]
blocks: [plan-14-cross-cutting/plan.md]
---

# Plan 13 — Section 12: Research & anonymized pool

## Objective

Close the loop for anonymized contributors: k-anonymized aggregate insights back to users and personal contribution export. Requires A8 analysis export and pool infra. **RE2, RE3 NR.**

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| RE1 | **Aggregate insights back to contributors** — k-anonymized cohort comparisons | L, ★ | e.g. sleep > 7h → fewer flares |
| RE4 | **Export for personal research** — download own contribution history | Q | Transparency |


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

- Plan 07 **A8** export analysis JSON
- Plan 06 anonymized sync path (`anonymized_data` table)
- Plan 05 **P5** DPIA helper recommended
- 90+ days gate + region + consent (existing)

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA anon sync | `apps/pwa-webapp/cloud-sync.js` (`syncAnonymizedData`) |
| RN anon sync | `apps/rn-app/src/cloud/sync.ts` |
| Privacy | `docs/privacy/dpia-health-sync.md`, `getFeatureAvailability` |
| Schema | `docs/supabase-rls-recommended.sql` |

## Agent runbook (general)

1. **RE4:** User-facing export of their contribution rows (decrypt locally if needed)
2. **RE1:** Server or edge aggregation with k-anonymity threshold; never expose individual rows
3. Enforce `contributeAnonData`, region, medical condition gates
4. Verify: no PII in anonymized payload (numeric + date only)
5. Legal/privacy review before RE1 production copy

## Completion gates

- [ ] RE1 and RE4 implemented or deferred
- [ ] RE2, RE3 NR — not implemented
- [ ] k-anonymity minimum documented
- [ ] Opt-out revokes future uploads; existing rows policy documented

## Cross-plan notes

- **A8 → RE1** research pipeline
- **P5** supports informed consent for pool
- Plan 14 §14.2 on-device moat messaging for opt-in

## Agent execution

### Phase A — Transparency export (RE4)

- [ ] User-facing download of own anonymized contribution rows
- [ ] Decrypt locally if stored encrypted; JSON or CSV format
- [ ] Settings entry under anonymized pool pane

### Phase B — Aggregate insights (RE1)

- [ ] Server/edge aggregation with k-anonymity threshold (document minimum k in UI)
- [ ] Example insight: "Contributors sleeping >7h report fewer flares" — never expose individuals
- [ ] Enforce gates: `contributeAnonData`, region, 90+ days, medical condition consent
- [ ] Opt-out stops future uploads; document retention policy

### Phase C — Privacy integration

- [ ] Wire P5 DPIA helper copy into pool consent flow
- [ ] Use A8 analysis export shape for payload validation
- [ ] Legal/privacy review before production copy

## Feature checklist (sync with MASTER)

| ID | Status | Dependencies |
|----|--------|--------------|
| RE1 | pending | A8, P5 |
| RE4 | pending | |

## Verification

- [ ] No PII in anonymized payload (numeric + date only)
- [ ] k-anonymity enforced in aggregation queries
- [ ] `npm run test:unit` for any new sync helpers

## Master sync

MASTER §12 rows RE1, RE4; §Section rollup exec 13.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §12 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- **RE2, RE3 are NR** — no Flaredown-style communities or opt-in tiers
