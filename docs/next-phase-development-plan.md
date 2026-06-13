# Next phase development plan

**Last updated:** 2026-06-13

Active roadmap for **platform parity, Capacitor sunset, and shared-package refactor**. Machine-readable status: [`platform-parity.json`](platform-parity.json). Human contract: [`platform-parity.md`](platform-parity.md).

## Phase 0 — Parity contract (complete when inventory is green)

- Expanded [`platform-parity.json`](platform-parity.json) (v2) with product-area features.
- [`scripts/parity-inventory.mjs`](../scripts/parity-inventory.mjs) diffs PWA vs RN settings and cloud exports.
- CI runs inventory with `--check` on every PR.

## Phase 1 — Capacitor sunset + CI realignment

- Remove `apps/capacitor-app/`; RN CLI + Expo are the only mobile paths.
- Simplify [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): PWA-only minified prep, no legacy release assets.
- Rewrite [`scripts/check-platform-parity.mjs`](../scripts/check-platform-parity.mjs) for `web | android | ios` (RN-native, not Capacitor manifest).
- Update [`scripts/update-readme-build-info.mjs`](../scripts/update-readme-build-info.mjs) — drop Legacy Capacitor build table.

## Phase 2 — Shared packages

- [`packages/shared`](../packages/shared) — schema, `mergeHealthLogs`, preferences/goals normalization.
- [`packages/ai-engine`](../packages/ai-engine) — deterministic analysis + predictions.
- [`packages/cloud-sync`](../packages/cloud-sync) — merge + crypto helpers; platform adapters in PWA/RN.
- [`packages/llm`](../packages/llm) — summary, suggest, MOTD interface (web Transformers.js + RN remote/native).
- [`scripts/sync-tokens-to-pwa.mjs`](../scripts/sync-tokens-to-pwa.mjs) — `@rianell/tokens` → `css/tokens.css`.

## Phase 3 — React Native full parity

- Settings: personal profile, anon contribution, full goals store, tutorial.
- Cloud: encrypted backup, anonymized sync, merge/delete (via `@rianell/cloud-sync` RN adapter).
- AI: `@rianell/ai-engine` + timeline UI; chart predictions.
- On-device LLM: consent, progress, cache (`@rianell/llm` native path where supported).
- Storage: compression, backup, offline queue; logs custom date range; print export.

## Phase 4 — Enforcement

- Unit tests: `workflows-ci-parity.test.mjs`, shared package tests, RN cloud/AI tests.
- Release: `platform-parity.json` in Meta assets; CHANGELOG v1.49.0+ milestones.

See root plan in Cursor for full job-by-job CI notes.
