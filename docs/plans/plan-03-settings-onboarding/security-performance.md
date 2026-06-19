# Plan 03 — Security & performance review

**Section 6:** Settings & onboarding · **IDs:** S1–S8

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- Consent dashboard (S7): incorrect revoke must not leave ghost sync — audit network after revoke.
- S8 profile export: JSON import path — validate schema; reject prototype pollution keys.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- S4 settings search: index pane titles once at open, not on every keystroke in 9-pane carousel.
- Onboarding (S1/S2): defer heavy AI tab init until after first log save.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- parity:inventory:check
- Schema-validate S8 import with shared zod/normalize.

---

## Pre-commit verify

```bash
node docs/plans/plan-03-settings-onboarding/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "parity:inventory:check"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
