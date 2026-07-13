---
execution_order: 12
section: 11
title: Clinician & sharing workflows
status: done
source: ../MASTER.md
master_section: 11
feature_ids: [CL1, CL2, CL4, CL5]
depends_on: [plan-08-llm-nlp/plan.md, plan-09-charts-analytics/plan.md, plan-07-ai-engine/plan.md, plan-10-home-dashboard/plan.md, plan-05-privacy-compliance/plan.md]
blocks: [plan-14-cross-cutting/plan.md]
---

# Plan 12 - Section 11: Clinician & sharing workflows

## Objective

Doctor-visit prep and secure sharing: appointment PDF, QR handoff, medication timeline, and LLM-suggested questions. Integrates N2, C6, A6, H6. **CL3 NR** - omit heatmap.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| CL1 | **Appointment mode** - 2-page PDF: charts + AI summary + meds + flare calendar | M, ★ | N2, C6, A6 |
| CL2 | **QR code handoff** - ephemeral encrypted QR for in-office transfer | M | P4 encrypted export |
| CL4 | **Medication timeline** - Gantt-style med changes vs outcomes | M | A4 |
| CL5 | **"Questions for my doctor"** - LLM suggests 3 questions | M, ★ | New LLM intent |


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

- Plan 08 N2, Plan 09 C6, Plan 07 A6, Plan 10 H6
- Plan 05 P4 E2E export for CL2
- `print-utils.js`, `apps/rn-app/src/utils/printLogs.ts`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA print/share | `apps/pwa-webapp/print-utils.js`, chart share |
| RN export | `apps/rn-app/src/utils/printLogs.ts`, `expo-print`, `expo-sharing` |
| LLM | Clinician brief intent (plan 08 N2) |

## Agent runbook (general)

1. **CL1:** Orchestrate PDF from charts snapshot + N2 brief + med list + flare dates
2. **CL2:** Time-limited token; no long-lived public URLs without encryption
3. **CL4:** Visualize A4 treatment markers on timeline
4. **CL5:** Wellness-only framing; not medical advice
5. Verify: PDF opens on mobile; no PHI in logs

## Completion gates

- [x] CL1, CL2, CL4, CL5 implemented or deferred
- [x] CL3 NR - not implemented
- [x] Disclaimers on all clinician-facing outputs
- [x] Works with local-only mode where applicable (export-only)

## Cross-plan notes

- **H6, N2, CL1, CL5, C6** = clinician prep cluster
- Plan 14 §14.4 telehealth mode extends CL1/C6

## Agent execution

### Phase A - Appointment PDF (CL1)

- [x] Orchestrate 2-page PDF: chart snapshots (C6) + N2 clinician brief + med list + flare calendar
- [x] PWA: `appointment-pdf.js`; RN: `expo-print` + `expo-sharing`
- [x] Entry from H6 countdown and dedicated "Appointment mode" action
- [x] Wellness disclaimers on every page footer

### Phase B - Secure handoff (CL2)

- [x] Ephemeral encrypted QR payload using P4 export crypto
- [x] Time-limited token; no long-lived public URLs
- [x] Receiver flow documented (scan → decrypt → import view-only)

### Phase C - Timeline & questions (CL4, CL5)

| ID | Tasks |
|----|-------|
| **CL4** | Gantt-style med changes from A4 treatment markers vs outcome metrics |
| **CL5** | New LLM intent: 3 doctor questions from recent trends; wellness framing only |

## Feature checklist (sync with MASTER)

| ID | Status | Dependencies |
|----|--------|--------------|
| CL1 | done | N2, C6, A6 |
| CL2 | done | P4 |
| CL4 | done | A4 |
| CL5 | done | Plan 08 |

## Verification

PDF opens on iOS/Android; QR round-trip smoke; no PHI in application logs.

## Master sync

MASTER §11 rows CL1-CL5; §Section rollup exec 12.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §11 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- **CL3 heatmap is NR**
- Not medical advice - disclaimers required
