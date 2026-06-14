# Benchmark toolkit — agent runbook

Execute from repository root on Node **≥ 24.14.1**.

## Quick start

```powershell
npm ci
npx playwright install chromium
npm run build:web:apk   # or BENCHMARK_SKIP_BUILD=1 with existing dist
npm run benchmark:tier-matrix
npm run benchmark:settings-matrix
npm run benchmark:verify -- --strict
```

## Tier 1 checklist (AIEngine-only)

- [ ] `desktop-t1.aspects.ai_llm_network_requests === 0`
- [ ] `desktop-t1.aspects.ai_llm_script_loaded === false`
- [ ] `desktop-t1.aspects.motd_llm_skipped === true`
- [ ] `ai_engine_ok === true`
- [ ] `console.error === 0`

## Environment variables

| Variable | Effect |
|----------|--------|
| `TIER_MATRIX_FILTER=1,3,5` | Optional local subset (desktop tiers 1/3/5) |
| `TIER_MATRIX_PLATFORM=desktop` | Skip mobile cells |
| `BENCHMARK_BLOCK_LLM=1` | Force LLM block all tiers |
| `BENCHMARK_SKIP_BUILD=1` | Use existing `BENCHMARK_PWA_ROOT` |
| `BENCHMARK_PWA_ROOT` | Static site root (default `.android-dist`) |
| `TIER_MATRIX_SKIP_GOD_MODE=1` | Skip God mode subset in tier matrix |

## Scripts

| npm (root) | Workspace script | Output slug |
|------------|------------------|-------------|
| `benchmark:tier-matrix` | `tier-matrix` | `benchmarks/tier-matrix/` |
| `benchmark:settings-matrix` | `settings-matrix` | `benchmarks/settings-matrix/` |
| `benchmark:god-mode` | `god-mode -- --tier=3` | `benchmarks/god-mode-suite/` |
| `benchmark:full-suite` | `full-suite` | `benchmarks/full-suite/` |
| `benchmark:verify` | `toolkit:verify -- --strict` | exit code gate |
| `benchmark:ai-package` | `ai-package` | `benchmarks/ai-engine-package/` |
| `benchmark:ai-layers` | `ai-layers` | `benchmarks/ai-engine-layers/` |
| `benchmark:ai-algos` | `ai-algos` | `benchmarks/ai-engine-algos/` |
| `benchmark:ai-rn` | `ai-rn` | `benchmarks/ai-engine-rn/` |
| `benchmark:ai-verify` | `ai-verify -- --strict` | exit code gate |
| `benchmark:ai-all` | `ai-all` | all four AI jobs + verify |

## AI engine benchmark (v1.82)

```powershell
npm run benchmark:ai-package
npm run benchmark:ai-layers    # needs ci-minified/site or build:web:apk
npm run benchmark:ai-algos
npm run benchmark:ai-rn
npm run benchmark:ai-verify -- --strict
```

Fast local subset:

```powershell
$env:AI_BENCH_FIXTURE_FILTER="logs_30"
$env:BENCHMARK_PWA_ROOT="apps/pwa-webapp/.android-dist"
$env:BENCHMARK_SKIP_BUILD="1"
npm run benchmark:ai-layers
```

## Full suite order

1. `prepare-site.mjs` — build unless skip
2. `run-tier-matrix.mjs` — 10 cells (or filtered)
3. `run-settings-matrix.mjs` — 6 tier-3 variants
4. `run-user-journey.mjs` — nav + settings panes
5. `run-from-source.mjs` — Lighthouse on dist
6. `verify-regression.mjs --strict`

## CI (`.github/workflows/ci.yml`)

Job **`benchmarks-toolkit`** runs on every PR/push:

```bash
npm run full-suite --workspace=@rianell/benchmark-runner -- --strict
```

- Uses `ci-minified/site` from `prepare-minified-assets`
- **120 min** timeout; full 10-cell tier matrix (no filter), settings matrix, user journey, God mode, Lighthouse
- Artifact `benchmarks-toolkit` merged into `benchmarks/` on `main`/`master` by `commit-benchmarks`

## AI engine CI jobs

| Job | Needs | Timeout | Artifact |
|-----|-------|---------|----------|
| `benchmarks-ai-package` | `paths-filter` | 10m | `benchmarks-ai-package` |
| `benchmarks-ai-layers` | `prepare-minified-assets` | 45m | `benchmarks-ai-layers` |
| `benchmarks-ai-algos` | `prepare-minified-assets` | 30m | `benchmarks-ai-algos` |
| `benchmarks-ai-rn` | `unit-tests` | 15m | `benchmarks-ai-rn` |

Playwright jobs set `BENCHMARK_BLOCK_LLM=1` and use `ci-minified/site`.

## Security pre-push

```powershell
npm audit
npm audit --workspace=@rianell/benchmark-runner
```

Re-run tier-1 dry-run before release:

```powershell
$env:TIER_MATRIX_FILTER="1"
$env:TIER_MATRIX_PLATFORM="desktop"
$env:BENCHMARK_BLOCK_LLM="1"
npm run benchmark:tier-matrix
```

## Batch E release (user-approved push only)

Segmented versions v1.78.0–v1.81.0 per CHANGELOG; update `docs/testing-and-configuration.md`, `docs/project-reference.md`, `benchmarks/README.md`. Do **not** `git push` without explicit user approval.
