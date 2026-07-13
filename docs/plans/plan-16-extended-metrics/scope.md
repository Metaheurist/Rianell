# Plan 16 - Scope & scripts

**Section 15:** Extended Vital Signs & Metrics · **IDs:** VM1-VM11

## In scope

- Canonical log schema extensions in `@rianell/shared`
- PWA + RN log wizard fields, review summary, chart series (BP, glucose, SpO₂, weight)
- Private `health-photos` Supabase storage bucket with owner-only RLS
- Unit tests for normalization and conversion helpers

## Out of scope

- Wearable auto-import for HRV/SpO₂ (Plan 19)
- Full RN camera upload (expo-image-picker) - PWA upload path when signed in; RN shows attachment count

## Agent scripts

| Command | When |
|---------|------|
| `node docs/plans/plan-16-extended-metrics/scripts/verify-plan.mjs` | Pre-rollout |
| `npm run test:unit` | Every change |
| `npm run projects:gate` with `PROJECTS_EXTRA_VERIFY=verify:i18n` | Plan close |
