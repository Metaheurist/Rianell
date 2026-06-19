# Plan 02 — Security & performance review

**Section 10:** Accessibility & i18n · **IDs:** I1–I5

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- XSS via locale packs if HTML injected in translations — all UI strings must be plain text; use escapeHTML at render boundaries.
- TTS (I4): third-party voice engines — no log text sent to cloud without explicit consent.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- 14 locale packs: lazy-load non-active locales; avoid loading all JSON on boot.
- B1 rewrite (I2): optional post-process — cache per session, not per keystroke.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- npm run verify:i18n
- Never auto-translate UGC log notes (B1).
- RTL smoke ar/he on settings + home.

---

## Pre-commit verify

```bash
node docs/plans/plan-02-accessibility-i18n/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "verify:i18n"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
