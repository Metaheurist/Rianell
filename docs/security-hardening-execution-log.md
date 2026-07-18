# Security hardening execution log

**Product:** Rianell  
**Purpose:** Track security and privacy hardening milestones with dates and evidence.  
**Last updated:** 2026-07-06

---

## 1. How to use this log

| Column | Meaning |
|--------|---------|
| **ID** | Unique milestone identifier |
| **Target** | Planned completion date |
| **Status** | `planned` · `in_progress` · `done` · `deferred` |
| **Evidence** | PR, commit, doc link, or CI run |
| **Owner** | Responsible party |

Update this file when a milestone completes or slips. Do not edit [next-phase-development-plan.md](next-phase-development-plan.md) from this process unless explicitly tasked.

---

## 3. Security hardening - v1.50 track

| ID | Milestone | Target | Status | Evidence | Notes |
|----|-----------|--------|--------|----------|-------|
| SH-01 | STRIDE threat model published | 2026-06-13 | **done** | [threat-model.md](threat-model.md) | This release |
| SH-02 | Privacy pack (RoPA, DPIA, GDPR map) | 2026-06-13 | **done** | [privacy/](privacy/) | This release |
| SH-03 | Incident response + rotation runbook | 2026-06-13 | **done** | [incident-response.md](incident-response.md), [rotation-runbook.md](../security/rotation-runbook.md) | This release |
| SH-04 | Crypto roadmap approved | 2026-06-13 | **done** | [crypto-roadmap.md](crypto-roadmap.md) | Passphrase spike scheduled |
| SH-05 | Passphrase-derived key spike (POC) | 2026-06-30 | planned | `packages/cloud-sync` | No production cutover |
| SH-06 | Cloudflare CSP alignment audit | 2026-07-07 | planned | [cloudflare-headers-recommended.md](../security/cloudflare-headers-recommended.md) | No duplicate narrow CSP |
| SH-07 | Supabase Security Advisor clean (GraphQL lints) | 2026-07-14 | planned | [Schema.sql](../supabase/Schema.sql) | Run in SQL Editor |
| SH-08 | Quarterly secret rotation drill | 2026-07-21 | planned | [rotation-runbook.md](../security/rotation-runbook.md) | Tabletop + anon key roll in staging |
| SH-09 | `security.txt` on production host | 2026-08-01 | planned | `/.well-known/security.txt` | [infrastructure-and-security-edge.md](infrastructure-and-security-edge.md) |
| SH-10 | **v1.50 security gate** - SH-05…09 triaged | 2026-07-31 | planned | This log | Accept deferrals with risk note |

---

## 4. Documentation parity (docs ↔ code)

| ID | Item | Target | Status | Evidence |
|----|------|--------|--------|----------|
| DOC-01 | AI security doc ↔ Transformers.js reality | 2026-06-13 | **done** | [ai-security.md](ai-security.md) |
| DOC-02 | Data subject rights ↔ PWA settings | 2026-06-13 | **done** | [data-subject-rights.md](privacy/data-subject-rights.md) |
| DOC-03 | SECURITY.md cross-links to new pack | 2026-06-13 | **done** | [SECURITY.md](SECURITY.md) | v1.51 privacy region + execution plan link |
| DOC-04 | README security section links privacy pack | 2026-06-13 | **done** | [README.md](../README.md) | region-policy-execution-plan.md |

---

## 8. Privacy & region policy - v1.51 track

| ID | Milestone | Target | Status | Evidence | Notes |
|----|-----------|--------|--------|----------|-------|
| RP-GATE-1 | Shared policy engine + verify-policy-packs CI | 2026-06-13 | **done** | `policy-packs/v1.json`, `packages/shared/src/privacy/` | `npm run verify:policy-packs` |
| RP-GATE-2 | Region gate + Settings pane | 2026-06-13 | **done** | `privacy-region.js` | Blocks app before init |
| RP-GATE-3 | `user_privacy_profile` + login overwrite | 2026-06-13 | **done** | `supabase/Schema.sql`, `cloud-sync.js`, `privacyProfile.ts` | Erasure includes profile |
| RP-GATE-4 | Policy drift + manifest hosting | 2026-06-13 | **done** | `policy-manifest.json`, `checkPolicyDrift.mjs` | |
| RP-GATE-5 | Multi-residency prep (Phase 5 partial) | 2026-06-13 | **partial** | [multi-residency.md](privacy/multi-residency.md) | Migration wizard deferred |

### Verification matrix (v1.51)

| Command | Expected |
|---------|----------|
| `node scripts/verify/verify-policy-packs.mjs` | pass |
| `node scripts/verify/verify-privacy-docs.mjs` | pass |
| `npm run test:unit` | pass |

**Legal trigger:** New privacy region gate and RoPA PA-09 - review on next RoPA cycle (2026-12-01).

---

## 5. Completed history (pre-v1.50)

| Date | ID | Summary |
|------|-----|---------|
| 2026-06-01 | - | v1.49.0 shared `@rianell/*` packages |
| 2026-06-13 | SH-01…04 | Security/privacy documentation pack created |
| 2026-06-13 | - | v1.49.1 follow-up per CHANGELOG |
| 2026-06-13 | RP-GATE-1…4 | v1.51 privacy region policy engine shipped |
| 2026-07-06 | SH-11 | Safe hardening pass: SW push URL same-origin guard, `verify-no-unsafe-sinks.mjs` in CI, live CSP drift job on `security-audit-scheduled.yml`, XSS sink invariants documented in `app.js` |

### SH-11 detail (2026-07-06)

| Change | Evidence |
|--------|----------|
| Service worker rejects cross-origin push notification URLs | `apps/pwa-webapp/sw.js` - `resolveSameOriginPushUrl()` |
| New CI guard for `eval` / `new Function` / unexpected `document.write` | `scripts/verify/verify-no-unsafe-sinks.mjs`, `npm run verify:unsafe-sinks` |
| Live production CSP drift checks (scheduled, non-blocking) | `.github/workflows/security-audit-scheduled.yml` - `live-csp-drift` job |
| `showAlertModal` / `openShareModal` innerHTML invariants documented | `apps/pwa-webapp/app.js` |
| **Deferred:** remove `'unsafe-inline'` / `'unsafe-eval'` from meta CSP | Requires refactoring inline `onclick` handlers - tracked under SH-06 |
| **By design:** Python `server/` exposes `/api/encryption-key` on loopback/LAN secret only | Dev/LAN tool, not production edge |

---

## 6. Risk acceptances (open)

| Risk | Accepted until | Mitigation ID |
|------|----------------|---------------|
| Plaintext `user_keys` | SH-05 production cutover | [crypto-roadmap.md](crypto-roadmap.md) |
| CSP `unsafe-eval` | SH-06 or later bundle strategy | [threat-model.md](threat-model.md) M-03 |
| Local storage plaintext | Post-v1.50 | [SECURITY.md](SECURITY.md) |

---

## 7. Next log review

**Scheduled:** 2026-06-20 - update P50-01 and SH-05 status after parity inventory and crypto spike.
