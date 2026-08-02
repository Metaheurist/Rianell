# Agentic pack catalog

Registers live under `docs/development/*-register.json`, plus `security/review-register.json`, `benchmarks/perf-register.json`, and the existing visual register.

| Pack | npm | Deterministic hooks |
|------|-----|---------------------|
| design | `agentic:design-context` | `verify:icon-spec`, `verify:design-tokens` (+ shared Research stage) |
| planning | `agentic:planning` | advisory artifacts (+ shared Research) |
| i18n | `agentic:i18n` | `verify:i18n:check` → TranslateGemma `--propose-dir` (Planned lists missing keys live) → Approve → `i18n:merge-tier-c` |
| rtl | `agentic:rtl` | heuristics + LLM |
| a11y | `agentic:a11y` | `verify:a11y`, `verify:a11y-tokens` |
| seo | `agentic:seo` | `seo:sitemap:check`, `seo:content:check`, `seo:pages:check` |
| privacy | `agentic:privacy` | `verify:privacy-docs`, `verify-ropa-drift.mjs` |
| security | `agentic:security` | csp / llm-security / sinks / cspro (+ **threat-model** LLM stage) |
| deps | `agentic:deps` | `audit:deps` |
| migration | `agentic:migration` | `verify:migration` |
| changelog | `agentic:changelog` | advisory draft (coder 14B default) |
| wikisync | `agentic:wikisync` | doc-links + `wiki:verify` |
| image | `agentic:image` | sharp / `seo:og-card` path |
| bootllm | `agentic:bootllm` | `audit:boot:strict` when `PROBE_URL` |
| perf | `agentic:perf` | `audit:cwv` / `verify:cwv`, `verify:bundle-split` |
| visual | `visual:*` via pack | icon-spec + polish QA (**apply deferred**); UI has no Activity cockpit |

Outputs: `artifacts/agentic/<pack>/report.json`, `broken.json`, optional `llm-advisory.md`, plus `llm-context.md` / `llm-context.meta.json` (codebase context fed into Thinking / Proposed actions).

## Promote rules (all packs)

| Action | Allowed in v1? |
|--------|----------------|
| Write advisory under `artifacts/agentic/` | Yes |
| Auto-merge i18n Tier-C overrides | No — only via Approve + `confirmProductWrite` (or run-all product-write + confirm) |
| Auto-promote wiki / changelog / planning into committed trees | No |
| Auto `npm` dependency bumps | No |
| `visual:apply` into PWA sprites | No until QA `broken.length === 0` + unlock |

## Per-pack notes

### design
Prompt / context expansion for icon contract + design tokens. Register: `docs/style-and-design/prompt-register.json`. Recommended: `qwen2.5-coder:32b`.

### planning
Advisory-only docs / unit-test / feature-plan drafts. See [agentic-planning-pack.md](agentic-planning-pack.md). Register: `docs/development/planning-register.json`.

### Research stage (shared, every pack)
Not a pack tab. After Gates, Firecrawl builds `web-research.*` under the pack’s artifact dir and injects it into the LLM prompt so Approvals are better grounded. Smoke: `npm run agentic:research`. See [agentic-research-pack.md](agentic-research-pack.md). Register: `docs/development/research-register.json`.

### i18n
Check-only gate `verify:i18n:check` (no `packages/shared` sync). Live fill uses TranslateGemma (`translategemma:27b`) via `i18n:ollama --propose-dir=artifacts/agentic/i18n/fill-proposals` — never writes `i18n-packs/` until Approve + confirm. Missing keys appear in Planned as soon as each locale plan is written. Scope: Settings `i18nFillScope` (`full` \| `tier-c`). Merge: `i18n:merge-tier-c` post-approve. Register: `docs/development/i18n-register.json`.

### rtl
Post-i18n layout/CSS direction for `ar`/`he`. Register: `docs/development/rtl-register.json`.

### a11y
Token + axe-style gates, then LLM triage of failures. Register: `docs/development/a11y-register.json`.

### seo
Sitemap / content / pages checks; LLM drafts structured-data gaps only. Register: `docs/development/seo-register.json`. Hooks: `seo:sitemap:check`, `seo:content:check`, `seo:pages:check`.

### privacy
ROPA + privacy docs; strict sanitize (no health scores). Register: `docs/development/privacy-register.json`.

### security
Deterministic CSP / sinks / cspro, then LLM security review. **Threat-model** is a stage of this pack (not a 17th pack id). Register: `security/review-register.json`.

### deps
`audit:deps` + advisory backlog. Bumps only via Planned `deps_bump` items + `allowDependencyBump` + `confirmProductWrite` (never silent). Register: `docs/development/deps-register.json`.

### migration
`verify:migration` + architecture drift notes (`packages/*` must not import `apps/*`). Register: `docs/development/migration-register.json`.

### changelog
Coder 14B draft bullets into artifacts only. Register: `docs/development/changelog-register.json`.

### wikisync
`doc-links --strict` + `wiki:verify`; draft patches stay advisory. Register: `docs/development/wikisync-register.json`.

### image
Alt-text / OG-card helpers; no binary invention into product trees. Register: `docs/development/image-register.json`.

### bootllm
Boot / first-inference latency when `PROBE_URL` set (`audit:boot:strict`). Register: `docs/development/bootllm-register.json`.

### perf
Measure via CWV / bundle gates; LLM triages backlog only. Register: `benchmarks/perf-register.json`.

### visual
Last run-all step. Embeds live polish at `http://127.0.0.1:8766/` when reachable (`GET /api/agentic/visual/live`). Gen/polish exclusive; never co-load. See [visual-pack-harness.md](visual-pack-harness.md).

## Models

Full matrix: [agentic-model-catalog.md](agentic-model-catalog.md) and `scripts/dev/agentic-pipeline/model-catalog.json`.
