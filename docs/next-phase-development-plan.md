# Next phase development plan

**Last updated:** 2026-07-18

Rianell ships as a **PWA (web) only**, backed by the shared `@rianell/*` packages and the optional Python `server/`. The former native app parity, Capacitor sunset, and platform-parity tracking work is complete and no longer applies.

**Status:** No active roadmap. Feature detail lives in [`app-and-features.md`](app-and-features.md); architecture in [`architecture-standard.md`](architecture-standard.md).

## Shared packages (current)

- [`packages/shared`](../packages/shared) - schema, `mergeHealthLogs`, preferences/goals normalization.
- [`packages/ai-engine`](../packages/ai-engine) - deterministic analysis + predictions.
- [`packages/cloud-sync`](../packages/cloud-sync) - merge + crypto helpers.
- [`packages/llm`](../packages/llm) - summary, suggest, MOTD interface (Transformers.js in the browser).
- [`scripts/build/sync-tokens-to-pwa.mjs`](../scripts/build/sync-tokens-to-pwa.mjs) - `@rianell/tokens` → `css/tokens.css`.
