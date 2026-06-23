---
title: Launch checklist
phase: launch-audit
last_updated: 2026-06-23T23:00:00Z
owner: maintainer
---

# Rianell launch checklist

Operator sign-off for public beta / store submission. Not legal advice.

## Phase 3 — Security baseline

- [x] `npm run verify:csp` passes (meta + live edge)
- [x] `npm run verify:sri` — CDN integrity pins current
- [ ] `/.well-known/security.txt` deployed (CI fix in v1.96.0 — verify after Pages deploy)
- [x] Cloudflare headers aligned — [cloudflare-headers-recommended.md](../../security/cloudflare-headers-recommended.md) (`frame-ancestors` at edge; remove `Expect-CT` if still live)
- [x] Supabase RLS + Security Advisor clean (0029 fix in Schema §4–§4b; Edge Function `delete-user-data` deployed)

## Phase 4 — Compliance

- [ ] [eu-ai-act-self-assessment.md](eu-ai-act-self-assessment.md) signed
- [ ] [dsa-compliance.md](dsa-compliance.md) reviewed
- [ ] [app-store-declarations.md](app-store-declarations.md) matches Play / App Store consoles
- [ ] [data-safety.xml](../../apps/rn-app/data-safety.xml) imported to Play Console
- [ ] Smartlook Art. 6 basis documented — [smartlook-session-recording.md](../privacy/smartlook-session-recording.md)
- [ ] pg_cron retention jobs scheduled (if using Supabase cron) — [Schema.sql](../../supabase/Schema.sql) §6

## Phase 5 — Performance

- [ ] [performance-budget.md](../performance-budget.md) budgets met on mid-tier Android + desktop
- [ ] Preconnect hosts in `index.html`
- [ ] Transformers.js lazy-load verified (no HF fetch before AI consent)

## Phase 6 — Accessibility

- [ ] `npm run verify:a11y-tokens` passes
- [ ] Skip link + focus order smoke-tested
- [ ] Settings toggles expose `role="switch"` + `aria-checked`
- [ ] App lock focus trap verified

## Phase 7 — React Native

- [ ] Health logs encrypted at rest — [android-hardening.md](android-hardening.md)
- [ ] Release APK smoke test (sync, logs, AI gate)
- [ ] Permissions minimized in `app.json`

## Phase 8 — Documentation

- [ ] [threat-model.md](../threat-model.md) launch audit refs current
- [ ] [incident-response.md](../incident-response.md) launch audit refs current
- [ ] [CHANGELOG.md](../CHANGELOG.md) phases 3–8 noted
- [ ] Wiki CI doc updated

## Phase 9 — UX

- [ ] Boot skeleton + loading overlay
- [ ] Offline banner when `navigator.onLine === false`
- [ ] Demo mode badge visible when enabled
- [ ] PHQ-9 crisis card tested (item 9 ≥ 1)
- [ ] RN haptics on Home key actions
- [ ] RN ErrorBoundary catches render faults
- [ ] [ux-audit.md](../ux-audit.md) reviewed

## Final gates

```bash
npm run test:unit
npm run verify:root-hygiene   # if Phase 23+
```

| Sign-off | Name | Date |
|----------|------|------|
| Technical | | |
| Privacy | | |
