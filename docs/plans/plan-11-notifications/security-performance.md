# Plan 11 — Security & performance review

**Section 9:** Notifications & engagement · **IDs:** R1–R6

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in [.firecrawl/projects/](../../../.firecrawl/projects/).

---

## CVE & exploit surface

- R4 Web Push: VAPID private key server-side only; subscribe endpoint auth; encrypt payload per RFC 8291.
- Notification body must not contain PHI snippets — generic copy only.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- R1 learned timing: persist median in preferences, update weekly not per save.
- Batch local notifications (L3 doses) with OS limits in mind.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- verify:push-contract
- Region + consent gates for R4
- R2 requires L3, R3 requires A5

---

## Pre-commit verify

```bash
node docs/plans/plan-11-notifications/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "verify:push-contract"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
