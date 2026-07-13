---
execution_order: 05
section: 7
title: Privacy, compliance & trust
status: done
source: ../MASTER.md
master_section: 7
feature_ids: [P1, P2, P3, P4, P5, P6, P7]
depends_on: [plan-04-logging-data-capture/plan.md]
blocks: [plan-06-cloud-sync/plan.md, plan-12-clinician-sharing/plan.md]
---

# Plan 05 - Section 7: Privacy, compliance & trust

## Objective

Strengthen trust layer: full policies, transparency log, local-only mode, encrypted export, and app lock. Required before expanded cloud sharing and clinician handoff.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| P1 | **Full policy document viewer** - render markdown/HTML policies in-app | M | |
| P2 | **Data processing activity log** - sync/model download timestamps | M, ★ | Pairs with S7 |
| P3 | **Local-only mode** - disable all network with explicit feature list | M, ★ | |
| P4 | **E2E encrypted export** - password-protected export for clinician sharing | M | Used by plan 12 |
| P5 | **DPIA helper for contributors** - visual field list for anonymized pool | Q | |
| P6 | **Teen / caregiver mode** - proxy logging for dependent | L | Heavy compliance |
| P7 | **Biometric app lock** - Face/Touch ID RN; WebAuthn PWA | M | |


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

- Plan 03 S7 consent dashboard (integrate P2/P5 UI)
- Plan 04 stable export format for P4
- `docs/privacy/`, `packages/shared/src/privacy/`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA privacy | `apps/pwa-webapp/privacy-region.js`, policy viewer modals |
| RN privacy | `apps/rn-app/src/screens/RegionGateScreen.tsx`, `PolicyDocumentsModal` |
| Policies | `docs/privacy/*.md`, policy packs in PWA hosting |
| Crypto | `packages/cloud-sync`, `encryption-utils.js` |

## Agent runbook (general)

1. Read `docs/privacy/dpia-health-sync.md`, `docs/ai-security.md`
2. **P3:** Gate HF download, Supabase sync, bug report at network layer with user-visible feature matrix
3. **P1:** Replace summary-only alert with scrollable policy renderer; machine-translated disclaimer (B3)
4. **P4:** Extend export pipeline; document key derivation in user-facing copy
5. **P6:** Legal review recommended before implementation
6. Verify: `npm run verify:privacy-docs`, `npm run test:unit`

## Completion gates

- [ ] P1-P7 implemented or deferred (P6 may defer with compliance note)
- [ ] Local-only mode tested: no accidental network when enabled
- [ ] Region gates still enforced (`getFeatureAvailability`)
- [ ] No service_role in clients (`verify-no-service-role-in-clients`)

## Cross-plan notes

- **P2, P3, S7, P7** = privacy cluster (MASTER)
- **P4** enables plan 12 CL2 QR handoff
- **P5** supports plan 13 RE1

## Agent execution

### Phase A - Transparency (P1, P2, P5)

| ID | Tasks |
|----|-------|
| **P1** | In-app markdown/HTML policy viewer; scrollable; machine-translation disclaimer (B3); link from S7 |
| **P2** | Append-only local log: sync timestamps, model download events, export events; surface in S7 pane |
| **P5** | Visual checklist of fields sent to anonymized pool; pairs with RE1 consent |

### Phase B - User control (P3, P7)

| ID | Tasks |
|----|-------|
| **P3** | `localOnlyMode` preference gates: HF model fetch, Supabase sync, bug report, remote LLM; show disabled-feature matrix |
| **P7** | RN: `expo-local-authentication` app lock; PWA: WebAuthn or PIN fallback; lock on background |

### Phase C - Export & advanced (P4, P6)

| ID | Tasks |
|----|-------|
| **P4** | Password-protected export (AES); key derivation documented in UI; used by CL2 |
| **P6** | Caregiver/proxy mode - **defer unless legal sign-off**; document deferral in MASTER if skipped |

### Phase D - Compliance verification

- [ ] `npm run verify:privacy-docs`
- [ ] `node scripts/verify/verify-no-service-role-in-clients.mjs`
- [ ] Local-only smoke: enable P3 → confirm no network calls in devtools

## Feature checklist (sync with MASTER)

| ID | Status | Agent notes |
|----|--------|-------------|
| P1 | done | |
| P2 | done | Wire into S7 |
| P3 | done | |
| P4 | done | |
| P5 | done | |
| P6 | deferred | Legal review - see MASTER |
| P7 | done | |

## Verification

```bash
npm run verify:privacy-docs
npm run test:unit
```

## Master sync

MASTER §7 rows P1-P7; §Section rollup exec 05.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
$env:PROJECTS_EXTRA_VERIFY = "verify:privacy-docs"
npm run projects:gate
```

Then: CHANGELOG → MASTER §7 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- Do not weaken region gates (`getFeatureAvailability`)
- P6 requires compliance review before shipping
