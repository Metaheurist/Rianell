# Next phase development plan

**Last updated:** 2026-07-18

Rianell ships as a **PWA (web) only**, backed by the shared `@rianell/*` packages and the optional Python `server/`. The former native app parity, Capacitor sunset, and platform-parity tracking work is complete and no longer applies.

**Status:** Active next-phase roadmap below. Shipped feature detail lives in [`app-and-features.md`](app-and-features.md); architecture in [`architecture-standard.md`](architecture-standard.md); the generated module call/import graph is in [`codebase_interaction_map.md`](codebase_interaction_map.md).

## Next-phase roadmap

Candidate workstreams for the upcoming build, ordered roughly by leverage. Each is a proposal until it has a passing local gate and a green CI run (see the repo testing-gates rule and `wiki/Build-Test-and-CI.md`).

### 1. Discoverability & SEO (build on the new content pages)

The `v2.2.25` batch added crawlable landing pages (`features/`, `symptom-tracking/`, `mental-health-check/`, `ai-insights/`, `community/`, `conditions/`), a generated `sitemap.xml`, an Open Graph `og-card.png`, and per-page canonical/`hreflang`/JSON-LD. Next:

- **Localized meta:** Emit `hreflang` alternates and translated `<title>`/description per supported locale rather than `en` + `x-default` only.
- **Structured-data breadth:** Add `BreadcrumbList` and `MedicalWebPage`/`FAQPage` blocks to the remaining content pages; validate with the Rich Results test in CI.
- **Search Console signal loop:** Track index coverage and CWV field data; wire a lightweight report into `benchmarks/`.

### 2. Internationalization depth (Ollama Tier-C)

The `OLLAMA_TIER_C_OVERRIDES` scaffold (`scripts/lib/ollama-tier-c-overrides.mjs`, `npm run i18n:ollama` / `i18n:merge-tier-c`) is wired into `generate-locale-overrides.mjs` but currently empty for `ga`/`ar`/`he`. Next:

- **Backfill Tier-C gaps** with the local TranslateGemma pass, review, and commit the overrides so `verify:i18n` mixed-language coverage drops below the current `--max-pct` ceiling.
- **RTL polish** for `ar`/`he` across the new content pages and settings surfaces.

### 3. Observability (server-side, privacy-safe)

`@sentry/node` is a devDependency for the Python-adjacent tooling/server. Next:

- **Opt-in error + performance monitoring** for `server/` that **never** captures health data (PHQ-9/GAD-7, log entries) per `security-privacy.mdc`; scrub PII before send and keep it off by default.

### 4. Core Web Vitals & performance

- **LCP/INP budgets** enforced in the Lighthouse CI gate; investigate code-splitting the main bundle and deferring non-critical vendor JS.
- **Image pipeline** for content pages (responsive `srcset`, AVIF/WebP) reusing the `sharp`-based `generate-og-card.mjs` approach.

### 5. Accessibility

- Extend the WCAG AA token gate (`verify:a11y-tokens`) with keyboard-navigation and screen-reader audits over the new content pages.

### 6. On-device AI acceleration

- WebGPU fast-path with WASM fallback, model quantization, and warm-start to cut the first-inference latency measured by the boot audit.

### 7. Developer experience

- Keep [`codebase_interaction_map.md`](codebase_interaction_map.md) fresh via the LocalRepoMapper MCP as modules move; use it for onboarding and refactor planning.

## Shared packages (current)

- [`packages/shared`](../packages/shared) - schema, `mergeHealthLogs`, preferences/goals normalization.
- [`packages/ai-engine`](../packages/ai-engine) - deterministic analysis + predictions.
- [`packages/cloud-sync`](../packages/cloud-sync) - merge + crypto helpers.
- [`packages/llm`](../packages/llm) - summary, suggest, MOTD interface (Transformers.js in the browser).
- [`scripts/build/sync-tokens-to-pwa.mjs`](../scripts/build/sync-tokens-to-pwa.mjs) - `@rianell/tokens` → `css/tokens.css`.
