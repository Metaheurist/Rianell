---
execution_order: 14
section: 14
title: Cross-cutting concepts
status: done
source: ../MASTER.md
master_section: 14
feature_ids: [X14.1, X14.2, X14.3, X14.4, X14.5]
depends_on:
  - plan-01-platform-architecture/plan.md
  - plan-02-accessibility-i18n/plan.md
  - plan-03-settings-onboarding/plan.md
  - plan-04-logging-data-capture/plan.md
  - plan-05-privacy-compliance/plan.md
  - plan-06-cloud-sync/plan.md
  - plan-07-ai-engine/plan.md
  - plan-08-llm-nlp/plan.md
  - plan-09-charts-analytics/plan.md
  - plan-10-home-dashboard/plan.md
  - plan-11-notifications/plan.md
  - plan-12-clinician-sharing/plan.md
  - plan-13-research-community/plan.md
blocks: []
---

# Plan 14 - Section 14: Cross-cutting concepts

## Objective

Integration capstone: wire multi-module rituals and product principles that span Home, AI, Charts, LLM, Notifications, and Settings. Run last after plans 01-13 completion gates pass (or explicit deferrals documented).

## Blockers audit (Phase 0 - run first)

| Dependency | Plan | Required for | Status |
|------------|------|--------------|--------|
| A6 weekly digest | 07 | X14.1 step 2 | done |
| N2 visit prep brief | 08 | X14.1 step 3 | done |
| CL1 PDF pipeline | 12 | X14.1 step 5 | done |
| C1 correlation cards | 09 | X14.1 step 1 | done |
| R4 Sunday push | 11 | X14.1 optional entry | done |
| S5 simple mode | 03 | X14.3 | done |
| P3 local-only | 05 | X14.2 | done |

If any row is `deferred`, reduce X14.1 scope (document in CHANGELOG) before marking plan 14 done.

## Required themes (checklist)

| ID | Theme | Integrates | Notes |
|----|-------|------------|-------|
| X14.1 | **Chronic illness "command center"** - Weekly Health Review ritual | A6, N2, CL1, C1, R4 | Sunday flow → 5 min → PDF |
| X14.2 | **On-device AI as the moat** | N*, P3, RE opt-in | Local inference default; marketing copy |
| X14.3 | **Progressive disclosure philosophy** | L1, S2, S5 | Day 1 → week 2 → month 2 → pool |
| X14.4 | **Telehealth companion mode** | CL1, C6 | Screen-share chart view; large fonts; 7-day snapshot |
| X14.5 | **Mental health adjacency (careful scope)** | Region policies | PHQ-2/GAD-2 screening; crisis links; not diagnosis |


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

- Plans 01-13: underlying features implemented or consciously deferred
- **X14.1** minimum: A6, N2, CL1, C1; R4 optional for Sunday push
- Read `docs/ai-security.md` for X14.5 boundaries

## Key codebase areas

| Area | Paths |
|------|-------|
| Orchestration | `apps/pwa-webapp/modules/weekly-review.js`, `apps/rn-app/src/screens/WeeklyReviewScreen.tsx` (create) |
| Weekly digest | Plan 07 A6 output |
| Visit prep | Plan 08 N2 + plan 12 CL1 |
| Correlations | Plan 09 C1 + plan 07 A3 |
| Settings | Plan 03 S5 simple mode, S2 onboarding |

## Agent runbook (general)

1. Audit plans 01-13 completion gates; list blockers for X14.1
2. **X14.1:** Single entry point (notification or Home card) → stepped UI → generate PDF via CL1 pipeline
3. **X14.2:** Audit copy/settings: no cloud LLM default; pool opt-in explicit
4. **X14.3:** Document in onboarding + settings; enforce field unlock schedule (L1/S2)
5. **X14.4:** Charts "presentation mode" toggle for telehealth
6. **X14.5:** Screening UI + regional crisis resources; wellness disclaimers
7. Verify: end-to-end Weekly Review smoke; legal review for X14.5

## Completion gates

- [x] X14.1 Weekly Health Review runnable end-to-end
- [x] X14.2-X14.5 documented in product UX and/or settings
- [x] All prior plan deferrals reviewed - no silent missing dependencies
- [x] CHANGELOG entry when user requests release commit

## Cross-plan notes

This plan does not introduce new feature IDs from MASTER §1-13; it **integrates** them. See [MASTER §Dependency clusters](../MASTER.md#dependency-clusters).

## Agent execution

### Phase 0 - Audit (before any integration work)

- [x] Read completion gates for plans 01-13; list blockers for X14.1 in a table at top of this file under `## Blockers audit`
- [x] Any feature marked `deferred` in MASTER must have explicit substitute or X14.1 scope reduction

### Phase A - X14.1 Weekly Health Review / command center

**Minimum dependencies:** A6, N2, CL1, C1 (R4 optional for Sunday push)

- [x] Entry point: Home card and/or R4 Sunday notification
- [x] Guided 5-step flow: review correlations (C1) → digest (A6) → visit brief preview (N2) → PDF (CL1) → save/share
- [x] PWA + RN shared step component or parallel implementations
- [x] End-to-end smoke: start flow → PDF saved locally

### Phase B - X14.2 On-device AI moat

- [x] Audit settings/copy: local inference default; cloud LLM opt-in only
- [x] Pool opt-in explicit; tie to X14.2 messaging in onboarding (S2) and settings
- [x] Verify P3 local-only mode copy aligns with moat story

### Phase C - X14.3 Progressive disclosure

- [x] Document unlock schedule in onboarding: Day 1 (L1/S2) → Week 2 food/exercise → Month 2 AI/correlations → optional pool
- [x] Enforce via L1 unlock rules + S5 simple mode for beginners

### Phase D - X14.4 Telehealth companion mode

- [x] Charts "presentation mode": large fonts, 7-day snapshot, hide chrome
- [x] Screen-share friendly layout; pairs CL1/C6 exports

### Phase E - X14.5 Mental health adjacency

- [x] PHQ-2/GAD-2 screening UI with stepped PHQ-9/GAD-7 follow-up when score ≥ 3 - wellness-only, not diagnosis
- [x] Regional crisis resource links from `privacy-region.js` / policy packs
- [x] Legal review before shipping; follow `docs/ai-security.md` boundaries

## Feature checklist (sync with MASTER)

| ID | Status | Agent notes |
|----|--------|-------------|
| X14.1 | done | Capstone ritual |
| X14.2 | done | Copy + settings audit |
| X14.3 | done | L1/S2/S5 |
| X14.4 | done | Charts presentation |
| X14.5 | done | Wellness screeners + crisis links |

## Verification

- [x] X14.1 Weekly Health Review runnable end-to-end
- [x] All plan 01-13 deferrals reviewed - no silent missing dependencies
- [x] X14.5 disclaimers present if shipped

## Master sync

MASTER §14 rows X14.1-X14.5; §Section rollup exec 14; update **Progress summary** totals.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §14 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- Do not start plan 14 until plans 01-13 gates pass or deferrals documented
- X14.5 is not a diagnostic tool
