# Plan 05 — Security & performance review

**Section 7:** Privacy & compliance · **IDs:** P1–P7

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in [.firecrawl/projects/](../../../.firecrawl/projects/).

---

## CVE & exploit surface

- P4 E2E export: weak KDF or hardcoded salt — use PBKDF2/Argon2 + per-export salt documented.
- P7 WebAuthn: validate origin/rpId; RN biometrics bypass if only UI gate — lock storage APIs too.
- P3 local-only: race if async fetch in flight — abort controllers on enable.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- P2 activity log: cap entries (e.g. 500) with rotation.
- P1 policy viewer: stream large markdown, do not innerHTML raw.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- verify:privacy-docs
- verify-no-service-role-in-clients
- P6 defer until legal sign-off.

---

## Pre-commit verify

```bash
node docs/plans/plan-05-privacy-compliance/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "verify:privacy-docs"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
