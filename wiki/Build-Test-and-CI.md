# Build, Test, and CI

How Rianell is built, tested, and deployed from GitHub Actions.

---

## Key npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build:web` | Sync tokens/i18n → vendor bundle → minified hashed PWA |
| `npm run test:unit` | Node unit tests (`tests/unit/`) |
| `npm run verify:i18n` | Full locale/prompt/MOTD gate suite |
| `npm run verify:a11y-tokens` | WCAG contrast gate for `@rianell/tokens` theme pairs |
| `npm run verify:design-tokens` | Guardrail: no hardcoded card scaffolds or width-based progress in critical UI |
| `npm run sync:tokens` | Regenerate `apps/pwa-webapp/css/tokens.css` from `@rianell/tokens` |
| `npm run generate:theme-icons` | Plain + fancy team sprites (prefers Ollama fancy overrides when present) |
| `npm run brain:ensure` | Ensure Ollama is serving (pull model if missing) |
| `npm run visual:register` | Rebuild `assets/visual-register.json` (one entry per SVG/anim) |
| `npm run visual:gen` | Local Ollama generate queue (`qwen3.6:35b`, concurrency 1, resumable) |
| `npm run visual:polish` | Polish generated artifacts with Gemma 4 31B IT QAT (`construct→critique→apply→verify`) |
| `npm run visual:polish:live` | Live polish preview on http://localhost:8766/ (agentic: `?agentic=1&cOnly=1` → C only) |
| `npm run visual:polish:screenshot-qa` | Tiered screenshot QA (`--tier=1\|2\|3\|all`, optional `--gemma-review`) |
| `npm run visual:polish:qa-loop` | Wait polish done → QA → re-polish broken (`--start-round=N`, Pass N, max 8) |
| `npm run agentic:run-all -- --dry-run` | Chronological 16-pack agentic harness (loopback API `/api/agentic`) |
| `npm run agentic:catalog` | Print recommended models / run-all order |
| `npm run agentic:hw-profile` | Probe NVIDIA GPUs → hardware profile (`auto` or Settings override) |
| `npm run agentic:research` | Smoke shared Research stage (Firecrawl; needs `FIRECRAWL_API_KEY`) |
| `npm run agentic:smoke` | Tiny Ollama load smoke (`smollm:135m` in CI; needs local daemon) |
| `npm run verify:i18n:check` | i18n gate only (no sync/generators; agentic i18n pack) |
| Open `/dev/agentic` | AIO console — 16 packs + Research stage on each; Settings (hardware profile, Firecrawl key); Python server :8080 |
| `npm run visual:pause` / `visual:resume` / `visual:state` | Durable pause/resume (banks remaining ids + Pass N; resume prints IDE terminal commands by default) |
| `npm run visual:derive-variants` | Derive fancy team sprites via `generate:theme-icons` (no LLM per variant) |
| `npm run audit:icon-a` | Stage-A icon corpus audit → `artifacts/audit/icon-a-audit.*` |
| `npm run verify:icon-spec` | Icon design docs stay aligned with `THEME_FX_TOKENS` / `--ui-icon-stroke` |
| `npm run visual:gallery` | Current-source gallery (standalone) |
| `npm run visual:apply` | Apply polished-first outputs into PWA (**deferred until QA green**) |
| `npm run benchmark` | Performance benchmarks workspace |
| `npm run docs:dependencies` | Regenerate `docs/development/dependencies.md` |
| `npm run audit:boot:strict` | Playwright strict boot gate (local / CI parity) |
| `npm run stress:memory` | Playwright memory stress test - Tier 5 + 365-day data, 10 tab-switch cycles, heap growth < 80 MB threshold; writes `benchmarks/memory/stress-latest.json` (gitignored) |
| `scripts/dev/shutdown-pc.ps1` | Schedule delayed Windows shutdown (default 10 min); cancel with `shutdown /a` |
| `npm run verify:cspro` | CI check: live site must not serve `CSPRO: connect-src 'none'` |
| `npm run supabase:deploy:delete-user-data` | Deploy GDPR Edge Function to Supabase project |
| `npm run wiki:verify` / `wiki:sync` | Validate and push `wiki/` to GitHub Wiki |

Icon / motion design specs live under `docs/style-and-design/` (grid, stroke, size ladder, optical alignment, motion catalogue, theme variants, taxonomy, `subject-contracts.json`). Operator guide in the monorepo: `docs/development/visual-pack-harness.md`.

---

## PWA build pipeline

1. `sync-tokens-to-pwa.mjs`
2. `generate-locale-overrides.mjs`
3. `sync-i18n-assets.mjs`
4. `build-pwa-vendor.mjs` (shared packages)
5. `apps/pwa-webapp/build-site.mjs` - esbuild, fingerprint JS/CSS, patch `index.html`

---

## CI workflow (`.github/workflows/ci.yml`)

Jobs are grouped into **phases** (see workflow header). File order matches the DAG.

### Phase 0 - Gate

- **paths-filter** - On push, sets `mobile_release` (skip mobile/release when only `artifacts/` changed).

### Phase 1 - Foundation (parallel)

- **unit-tests** - `test:unit`, `verify:a11y-tokens`, `verify:design-tokens`, `verify:i18n`
- **prepare-minified-assets** - minified PWA → artifact `minified-prebuild` (copies `.well-known/security.txt` and `.nojekyll`; glob copy skips dot paths)
- **security-audit** - Gitleaks, OSV, npm/pip audit (reusable workflow)
- **Agentic harness suite** (4 parallel nodes):
  - **1 · Agentic · unit** — `node --test --test-concurrency=1 --test-force-exit tests/unit/agentic-*.test.mjs`
  - **1 · Agentic · catalog** — `npm run agentic:catalog` + catalog/order unit tests
  - **1 · Agentic · ollama-load** — install Ollama, load `smollm:135m` (≤200 MB), `npm run agentic:smoke`
  - **1 · Agentic · dry-run** — `npm run agentic:run-all -- --dry-run`
- **1 · Gates · web** — thin fan-in of unit + security + minify (feeds deploy)
- **1 · Gates · binaries** — thin fan-in of unit + security + Agentic suite (feeds `server-exe`)

### Phase 2 - Build lanes (max 7 parallel)

- **benchmarks-web** - starts when minify finishes (does not wait for unit tests)
- **deploy-pages** - GitHub Pages → [rianell.com](https://rianell.com) (push only; needs **Gates · web**)
- **server-exe** - Windows x64/x86 (needs **Gates · binaries** — Agentic suite is on this path only)
- **commit-dependencies-doc** / **sync-wiki-to-github** - main push bots (after unit tests)

### Phase 3 - Downstream

- **playwright-e2e** - PWA smoke + oasis particle specs against local probe (`workers: 1` on CI - see `benchmarks/playwright.config.ts`)
- **benchmarks-web** - Lighthouse + nav timings on minified PWA (`timeout-minutes: 25`; shared measure for `web-pwa` / `github-pages`; `BENCHMARK_LH_RUNS=2`)
- **audit-boot-post-deploy** - boot audit on exact Pages `site/` (see below)

### Phase 4 - Bots and release

- **commit-benchmarks** - merge benchmark Markdown on main
- **publish-release** - release uses artifacts API
- **readme-build-info** - main pushes
- **security-headers-report** - securityheaders.com → `security/*.md` (after post-deploy audit)

### Bot push queue

Jobs that `git push` share concurrency group `ci-bot-push-${{ github.ref }}` so parallel doc/wiki/benchmark/artifacts commits do not race. Build jobs stay fully parallel.

### Cancel on gate failure

When a **gate** job fails (unit tests, minified assets, deploy, post-deploy audit), the workflow is **cancelled** so server EXE and release jobs do not keep running. **Benchmark** jobs are not cancelled - they can finish independently.

### Post-deploy boot audit (v1.89.2)

1. **deploy-pages** runs **`prepare-pages-site`** (minified copy + Supabase inject) and uploads artifact **`pages-site-probe`** - the same bytes sent to GitHub Pages.
2. **audit-boot-post-deploy** downloads **`pages-site-probe`**, serves `site/` with **`python -m server`** on its own runner, runs **`audit:boot:baseline`** against `http://127.0.0.1:9876/`.
3. Live **`rianell.com`** HTML check is **non-blocking** (Cloudflare often returns **403** to GitHub Actions).

**Local strict gate before push:** `powershell -File server/launch-server.ps1` then `PROBE_URL=http://127.0.0.1:8080/ npm run audit:boot:strict`.

### Dependency caching (v1.89.2)

Caches miss only when lockfiles or pinned tool versions change:

| Layer | Invalidates when |
|-------|------------------|
| npm store + node_modules | `package-lock.json` changes |
| pip | `requirements.txt` or `.github/ci-pip-*.txt` changes |
| Playwright browsers | `package-lock.json` changes |
| PyInstaller (Windows) | Python requirements / pip extras change |
| UPX (Chocolatey) | server-exe matrix (cached install path) |
| Gitleaks / OSV binaries | workflow pin version bumped |

**Live Cloudflare probe (v1.96.1):** `scripts/ci/deploy-probe-loop.mjs` uses `domcontentloaded`, goto retries, and `PROBE_GOTO_TIMEOUT_MS` / `PROBE_PASS_MS` env vars - `waitUntil: load` often times out on `rianell.com` from GitHub Actions.

Reusable actions: `.github/actions/setup-node-ci`, `setup-python-ci`, `install-playwright-chromium`, `prepare-pages-site`.

### Node 24 (job runtime vs action runtime)

- **Job Node runtime:** `setup-node-ci` pins **24.14.1** (matches root `engines`, `.nvmrc`, `.node-version`).
- **JS action runtime:** First-party pins use Node 24-native majors (`cache@v5`, `setup-java@v5`, `upload-pages-artifact@v5`, `deploy-pages@v5`, `github-script@v8`, `softprops/action-gh-release@v3`). Hosted runners default to Node 24 for JS actions (Jun 2026).
- **Regression guard:** `npm run verify:github-actions` (also runs in CI unit-tests) fails on legacy `@v4`/`@v7`/`@v2` pins or `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`.
- **Residual annotations:** Platform workflows (Automatic Dependency Submission) and `github/codeql-action/upload-sarif@v3` may still report Node 20 until upstream bumps.

---

## Benchmarks

Workspace `@rianell/benchmark-runner` under `benchmarks/`:

```bash
npm run benchmark
npm run benchmark:tier-matrix
npm run benchmark:ai-all
```

Reports committed on `main` via CI when changed.

### Launch audit CI jobs (v1.94+)

| Job | Phase | Purpose |
|-----|-------|---------|
| `playwright-e2e` | 3 | Smoke: shell render, settings open/close |
| `lighthouse-ci` | 3 | LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms (Pages probe) |
| `zap-scan` | 3 | OWASP ZAP → SARIF (rianell.com) |
| `verify:a11y-tokens` | 6 | WCAG contrast on theme tokens |
| Bundle `--enforce-budget` | 3/5 | `app.*.min.js` gzip ≤ 2 MB, vendor ≤ 15 MB |
| `verify-boot-warm-budget` | 3/5 | Progressive warm boot gate (`BOOT_WARM_CI_MAX_MS`) |

Dependabot: `.github/dependabot.yml` (npm + github-actions weekly; pip at repo root). Secret scanning path ignores for vendored Transformers.js: `.github/secret_scanning.yml`.

---

## PR checklist

- [ ] `npm run test:unit` passes
- [ ] `npm run verify:i18n` if strings/locales changed
- [ ] `npm run docs:dependencies` if manifests/deps changed
- [ ] No secrets in client code (`verify-no-service-role-in-clients` in CI)
- [ ] Optional: local `audit:boot:strict` via `launch-server.ps1` before large PWA boot changes

---

## Read more (technical)

- [Testing & configuration](https://github.com/Metaheurist/Rianell/blob/main/docs/development/testing-and-configuration.md)
- [Benchmarks README](https://github.com/Metaheurist/Rianell/blob/main/benchmarks/README.md)
- [Dependencies inventory](https://github.com/Metaheurist/Rianell/blob/main/docs/development/dependencies.md)
- [SECURITY.md - CI scanning](https://github.com/Metaheurist/Rianell/blob/main/docs/security/SECURITY.md)
