# Plan 14 - Security & performance review

**Section 14:** Cross-cutting concepts · **IDs:** X14.1-X14.5

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- X14.5 PHQ-2/GAD-2 with stepped PHQ-9/GAD-7 follow-up when initial score ≥3: not diagnostic; PHQ-9 item 9 triggers prominent crisis UI; crisis links HTTPS only; screening answers/scores ephemeral (no cloud without consent).
- X14.1 Weekly Review PDF: same controls as CL1.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- X14.1 guided flow: step lazy-load LLM/chart modules.
- X14.4 presentation mode: reduce chart animation.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit - no console `pageerror` regressions.

---

## Mitigations (implementation)

- Audit plans 01-13 deferrals
- X14.2 copy audit for local-first
- Legal review X14.5

---

## Pre-commit verify

```bash
node docs/plans/plan-14-cross-cutting/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
