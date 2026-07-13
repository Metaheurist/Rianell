# Plan 12 - Security & performance review

**Section 11:** Clinician & sharing · **IDs:** CL1, CL2, CL4, CL5

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- CL2 QR handoff: ephemeral keys; QR payload encrypted; no PHI in URL.
- CL1 PDF: metadata scrub (author/title); user confirms before share.
- CL5 LLM questions: wellness framing; not diagnosis.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- PDF generation off main thread where possible (RN expo-print async).
- CL4 timeline: virtualize long med histories.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit - no console `pageerror` regressions.

---

## Mitigations (implementation)

- P4 crypto for CL2
- Disclaimers on all clinician outputs
- CL3 NR

---

## Pre-commit verify

```bash
node docs/plans/plan-12-clinician-sharing/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
