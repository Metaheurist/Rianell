# Plan 06 - Security & performance review

**Section 8:** Cloud sync & portability · **IDs:** D1-D7

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- D6 share links: time-limited signed URLs; no PHI in query strings; RLS on read path.
- D5 CSV import: formula injection in Excel - prefix risky cells with single quote in export.
- D7 user cloud OAuth: store refresh tokens in secure-store only (RN) / encrypted pref (PWA).

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- D2 auto-sync: exponential backoff; skip if local-only (P3).
- D3 merge UI: diff only conflicting dates, not full log array.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit - no console `pageerror` regressions.

---

## Mitigations (implementation)

- Encrypted health_data unchanged
- Delete-all-cloud clears all tables
- parity:inventory:check

---

## Pre-commit verify

```bash
node docs/plans/plan-06-cloud-sync/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "parity:inventory:check"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
