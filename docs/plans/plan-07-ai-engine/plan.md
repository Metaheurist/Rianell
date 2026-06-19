---
execution_order: 07
section: 4
title: AI engine & deterministic analysis
status: done
source: ../MASTER.md
master_section: 4
feature_ids: [A1, A2, A3, A4, A5, A6, A7, A8]
depends_on: [plan-04-logging-data-capture/plan.md, plan-06-cloud-sync/plan.md]
blocks: [plan-08-llm-nlp/plan.md, plan-09-charts-analytics/plan.md, plan-11-notifications/plan.md, plan-13-research-community/plan.md]
---

# Plan 07 — Section 4: AI engine & deterministic analysis

## Objective

Unify PWA/RN deterministic analysis in `@rianell/ai-engine`, surface explainable insights, trigger hypotheses, and weekly digests. Foundation for correlation cards (C1), flare nudges (R3), and research export (A8).

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| A1 | **Unify neural pipeline in `@rianell/ai-engine`** — RN same insight ranking as PWA | M, ★ | Parity fix cluster |
| A2 | **Insight confidence & "why" expansion** — tap insight → contributing dates/metrics | M | |
| A3 | **Trigger hypothesis engine** — rank factors by lift on flare probability | M, ★ | Feeds C1 |
| A4 | **Treatment A/B timeline** — mark med start dates; compare windows | M | Pairs with CL4 |
| A5 | **Anomaly detection alerts** — unusual fatigue vs baseline (local only) | M | Feeds R3 |
| A6 | **Weekly digest (deterministic)** — top 3 improvements/concerns + goals | Q | Feeds plan 14 §14.1 |
| A7 | **Condition-specific analysis packs** — migraine, IBS, etc. | L | |
| A8 | **Export analysis JSON for research** — opt-in anonymized pool bundle | M | Feeds RE1 |


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

- Plan 04 log schema stable
- Plan 06 for A8 upload path
- Read `docs/NEURAL_NETWORK_PLAN.md`, `apps/pwa-webapp/AIEngine.js`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA engine | `apps/pwa-webapp/AIEngine.js`, `vendor/rianell-ai-engine.js` |
| Shared | `packages/ai-engine/src/index.mjs` |
| RN | `apps/rn-app/src/ai/analyzeLogs.ts`, `apps/rn-app/src/ai/engine.ts` |
| AI tab | PWA `#aiTab`, RN `AiScreen.tsx` |

## Agent runbook (general)

1. Migrate PWA `NeuralAnalysisNetwork` layers into `@rianell/ai-engine` incrementally (**A1**)
2. Implement explainability UI (**A2**) without exposing raw health data in logs
3. **A3:** Minimum overlap + effect thresholds per NEURAL_NETWORK_PLAN
4. **A5/A6:** Local-only; no cloud inference
5. Verify: `npm run test:unit`, AI-related unit tests, parity checks

## Completion gates

- [ ] A1: RN insight list matches PWA ranking for fixture logs (or documented delta)
- [ ] A2–A8 implemented or deferred
- [ ] Deterministic outputs stable (same input → same ranked insights)
- [ ] GDPR Art. 22 informational-only disclaimers preserved

## Cross-plan notes

- **A3 → C1** correlation cards
- **A5 → R3** flare risk nudge
- **A6, N2, CL1, C1** → plan 14 Weekly Health Review

## Agent execution

### Phase A — A1 parity (priority)

- [ ] Read `docs/NEURAL_NETWORK_PLAN.md` and compare PWA `AIEngine.js` vs `packages/ai-engine/src/index.mjs`
- [ ] Migrate `NeuralAnalysisNetwork` ranking layers into `@rianell/ai-engine` incrementally
- [ ] Update RN `apps/rn-app/src/ai/analyzeLogs.ts` to use shared package only
- [ ] Fixture test: same log JSON → same top-3 insight IDs PWA vs RN

### Phase B — Explainability & hypotheses (A2, A3, A5)

| ID | Tasks |
|----|-------|
| **A2** | Tap insight → expand panel with contributing dates/metrics; no PHI in console logs |
| **A3** | Trigger hypothesis: rank lifestyle factors by flare lift; min overlap thresholds per NEURAL_NETWORK_PLAN |
| **A5** | Baseline fatigue/mood; flag anomalies locally; expose score for R3 |

### Phase C — Timelines & digests (A4, A6, A7, A8)

| ID | Tasks |
|----|-------|
| **A4** | User marks treatment start dates; compare pre/post windows in AI tab |
| **A6** | Deterministic weekly digest: top 3 improvements, concerns, goal status — feeds X14.1 |
| **A7** | Optional condition packs (migraine, IBS) as plugin rule sets in ai-engine |
| **A8** | Opt-in analysis JSON export for anonymized pool; pairs with RE1 |

### Phase D — Disclaimers

- [ ] Preserve GDPR Art. 22 informational-only copy on all AI outputs

## Feature checklist (sync with MASTER)

| ID | Status | Feeds |
|----|--------|-------|
| A1 | pending | Parity |
| A2 | pending | |
| A3 | pending | C1 |
| A4 | pending | CL4 |
| A5 | pending | R3 |
| A6 | pending | X14.1 |
| A7 | pending | |
| A8 | pending | RE1 |

## Verification

```bash
npm run test:unit
# AI-specific tests under packages/ai-engine or apps/rn-app/src/ai/
```

## Master sync

MASTER §4 rows A1–A8; §Section rollup exec 07.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §4 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- No cloud inference for deterministic engine
- Do not change insight ranking without fixture regression
