---
execution_order: 11
section: 9
title: Notifications & engagement
status: done
source: ../MASTER.md
master_section: 9
feature_ids: [R1, R2, R3, R4, R5, R6]
depends_on: [plan-04-logging-data-capture/plan.md, plan-07-ai-engine/plan.md, plan-10-home-dashboard/plan.md]
blocks: [plan-14-cross-cutting/plan.md]
---

# Plan 11 — Section 9: Notifications & engagement

## Objective

Smart reminders, medication dose alerts, flare-risk nudges, production Web Push, gentle re-engagement, and optional streaks. Requires med scheduler (L3) and anomaly engine (A5).

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| R1 | **Smart reminder timing** — learn usual log time; nudge if missed | M | |
| R2 | **Medication dose reminders** — tied to L3 scheduler | M | **Requires L3** |
| R3 | **Flare risk nudge** — high fatigue week prompt | M, ★ | Requires A5 |
| R4 | **Web Push on PWA (production)** — complete push pipeline | M | See web-push research doc |
| R5 | **Gentle re-engagement** — 7-day inactive, single notification | Q | |
| R6 | **Achievement-free streaks** — optional, dismissible | Q | Pairs with H3 |


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

- Plan 04 **L3** for R2
- Plan 07 **A5** for R3
- RN `expo-notifications`; PWA `push-subscribe.js`, `sw.js`

## Key codebase areas

| Area | Paths |
|------|-------|
| RN notifications | `apps/rn-app/src/permissions/`, settings Display pane |
| PWA push | `apps/pwa-webapp/sw.js`, push handlers, `docs/research/web-push-pwa-mdn-notes.md` |
| Reminders | PWA/RN daily reminder time in preferences |

## Agent runbook (general)

1. **R2:** Schedule local notifications per L3 dose records
2. **R3:** Trigger from on-device A5 scores only; no cloud
3. **R4:** Complete SW push + VAPID/subscribe flow; respect region/consent
4. **R5/R6:** Avoid notification spam; user-dismissible
5. Verify: RN notification diagnostics in Settings; PWA push contract tests if exist

## Completion gates

- [ ] R1–R6 implemented or deferred
- [ ] R2 not shipped without L3
- [ ] R3 not shipped without A5
- [ ] iOS delivery variance documented (platform-parity partial)

## Cross-plan notes

- **L3, R2, CL4, A4** = meds cluster
- **R4** used by plan 14 Weekly Health Review notification

## Agent execution

### Phase A — Smart timing (R1)

- [x] Learn median log time from last 14 days of saves
- [x] If no log by median + 30 min, schedule local notification (respect quiet hours pref if exists)

### Phase B — Med & flare (R2, R3) — gated

| ID | Tasks | Gate |
|----|-------|------|
| **R2** | Local notifications per L3 dose schedule; taken/snooze actions | **L3 required** |
| **R3** | Nudge when A5 anomaly score high: "Patterns suggest high fatigue week" | **A5 required** |

### Phase C — Web push & re-engagement (R4, R5)

| ID | Tasks |
|----|-------|
| **R4** | Complete PWA production push: VAPID, `push-subscribe.js`, `sw.js` handlers; consent + region gates | done |
| **R5** | Single notification after 7 days inactive; user can disable | done |

### Phase D — Streaks (R6)

- [x] Optional streak reminder paired with H3; dismissible; no achievement marketplace

## Feature checklist (sync with MASTER)

| ID | Status | Blockers |
|----|--------|----------|
| R1 | done | |
| R2 | done | |
| R3 | done | |
| R4 | done | |
| R5 | done | |
| R6 | done | |

## Verification

RN: Settings notification diagnostics. PWA: push subscription smoke per `docs/research/web-push-pwa-mdn-notes.md`.

Document iOS delivery variance in parity notes.

## Master sync

MASTER §9 rows R1–R6; §Section rollup exec 11.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
npm run projects:gate
```

Then: CHANGELOG → MASTER §9 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- Do not ship R2 without L3 or R3 without A5
- No notification spam — max one re-engagement per idle period
