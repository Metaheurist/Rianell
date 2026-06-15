<a id="nav-testing-data"></a>

## 🧪 Testing Data

**Toolchain:** Run tests and scripts with **Node.js 24.14.1+** (see [Installation & usage](setup-and-usage.md) and root `package.json` `engines`). **Unit tests** (`npm run test:unit`) use the Node test runner from the repository root; **mobile** tests use Jest under `apps/rn-app`. When you bump npm/Python/CDN dependency pins, run **`npm run docs:dependencies`** and commit **`docs/dependencies.md`** (see [dependencies.md](dependencies.md)).


### v1.69.1 i18n verification commands

From the repo root after editing locale/prompt/motd packs:

```bash
npm run verify:i18n
npm run test:mobile
```

`verify:i18n` (v1.77.0) runs, in order: `build-content-catalog-keys.mjs` → `generate-locale-overrides.mjs` → `auto-translate-ui-strings.mjs` → `auto-translate-policy-strings.mjs` → `translate-motd-packs.mjs` → `sync-i18n-assets.mjs` → locale/prompt/motd/HTML/audit gates → `verify-translation-coverage.mjs --strict --max-pct=13` → `verify-mixed-language-strings.mjs`.

```bash
node scripts/build-content-catalog-keys.mjs
node scripts/generate-locale-overrides.mjs
node scripts/auto-translate-ui-strings.mjs
node scripts/auto-translate-policy-strings.mjs
node scripts/translate-motd-packs.mjs
node scripts/sync-i18n-assets.mjs
node scripts/verify-locale-packs.mjs
node scripts/verify-prompt-packs.mjs
node scripts/verify-motd-packs.mjs
node scripts/verify-motd-translation-coverage.mjs
node scripts/verify-no-html-in-locale-packs.mjs
node scripts/audit-hardcoded-strings.mjs --check
node scripts/audit-hardcoded-strings.mjs --require-wiring
node scripts/verify-no-hardcoded-ui.mjs --strict
node scripts/verify-no-hardcoded-ui.mjs --baseline
node scripts/verify-translation-coverage.mjs --strict --max-pct=13
node scripts/verify-mixed-language-strings.mjs
```

Tier A / ga locale fill (maintainer):

```bash
node scripts/generate-locale-overrides.mjs
USE_MYMEMORY_MT=1 node scripts/batch-mt-tier-a.mjs --locale=de-DE
USE_MYMEMORY_MT=1 node scripts/batch-mt-hybrid-keys.mjs --locale=de-DE
USE_MYMEMORY_MT=1 node scripts/batch-mt-content-keys.mjs --locale=de-DE
node scripts/merge-tier-a-overrides-from-packs.mjs   # snapshot pack diffs into overrides
node scripts/build-tier-a-exact-overrides.mjs --locale=pt-BR   # Google MT for remaining keys
node scripts/translate-prompt-packs.mjs
USE_MYMEMORY_MT=1 node scripts/translate-motd-packs.mjs --all
node scripts/sync-i18n-assets.mjs
```

### v1.68.0 i18n verification commands

From the repo root after editing locale/prompt/motd packs:

```bash
node scripts/sync-i18n-assets.mjs
node scripts/verify-locale-packs.mjs
node scripts/verify-prompt-packs.mjs
node scripts/verify-no-html-in-locale-packs.mjs
node scripts/audit-hardcoded-strings.mjs --check
npm run test:unit
npm run typecheck:mobile
npm run test:mobile
```

### v1.46.3 documentation sync

- **React Native:** After Settings or Log wizard changes, run `npx jest src/screens/SettingsScreen.test.tsx src/screens/LogWizardScreen.test.tsx` from `apps/rn-app` (or the repo’s `npm run test:mobile` if configured). Settings tests mock `expo-constants` for the app installation section.

### v1.44.2 documentation sync

- Include theme parity checks in manual smoke testing: verify non-mint themes affect loading overlay, pulse, navbar active state, and goals/targets cards.
- Include cloud settings round-trip checks for additional local setting keys during sign-in sync testing.

### Generate Sample Data

The server includes sample data generation:

1. **CSV Export**: Generate sample CSV files for testing
   - Use the "Generate CSV File" button in the server dashboard
   - Configure number of days and base weight
   - Output saved to `health_data_sample.csv`

2. **Database Testing**: 
   - Use Supabase search to find test data
   - Export data for analysis
   - Delete test data when done

### Sample Data Structure

Sample data includes realistic patterns:
- Seasonal variations (winter worse, summer better)
- Weekly patterns (weekends better)
- Flare-up cycles for chronic conditions
- Correlated metrics (sleep affects fatigue, etc.)

<a id="nav-configuration"></a>

## 🔧 Configuration

### Environment Variables (`security/.env`)

Define variables in **`security/.env`** (copy from [`security/.env.example`](../security/.env.example)). If that file is absent, a legacy **`.env`** at the repository root is still read.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `HOST` | Bind address (`127.0.0.1` = local only; `0.0.0.0` = all interfaces / LAN) | `127.0.0.1` |
| `HEALTH_APP_SENSITIVE_APIS_ON_LAN` | Allow `/api/encryption-key` and `/api/anonymized-data` from non-loopback IPs | unset (off) |
| `SUPABASE_URL` | Your Supabase project URL | Required |
| `SUPABASE_PUBLISHABLE_KEY` | **Publishable** key (Dashboard → API; safe in client builds). Legacy: `SUPABASE_ANON_KEY`. | Required (one of) |
| `SUPABASE_SECRET_KEY` | **Secret** key - use **service_role** (server only). Needed for **Generate Sample Data to Supabase** when RLS is on `anonymized_data`. Legacy: `SUPABASE_SERVICE_KEY`. | Optional |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL, **Publishable** key, and (for server sample generation) the **service_role** secret under **Secret keys** from Settings → API
3. Apply table definitions and RLS from [../supabase/Schema.sql](../supabase/Schema.sql) (test reset — wipes auth users) or incremental policies from [supabase-rls-recommended.sql](supabase-rls-recommended.sql) on staging/production
4. On an **existing** live project, run [../supabase/harden-graphql-exposure.sql](../supabase/harden-graphql-exposure.sql) in the SQL Editor to drop unused **`pg_graphql`** and revoke broad **`anon`** grants (Security Advisor lints 0026/0027) — see [SECURITY.md](SECURITY.md)
5. Add your credentials to **`security/.env`** (or legacy root `.env`) and `supabase-config.js`

### v1.53.1 CI fixes

- **Web benchmarks:** Playwright navigation timings open Settings without **`ReferenceError: global is not defined`** (`resolveSettingsPaneTitle` uses **`window.RianellI18n`**).
- **Mobile typecheck:** **`npm run typecheck:mobile`** — see [CHANGELOG.md](CHANGELOG.md) v1.53.1.

### Performance tier benchmark toolkit (v1.78–v1.81)

Agent-executable suite under `benchmarks/toolkit/` — runs Playwright probes across **device performance tiers 1–5** × desktop/mobile.

| Command | Purpose |
|---------|---------|
| `npm run benchmark:tier-matrix` | 10-cell matrix; tier 1–2 block LLM (AIEngine-only) |
| `npm run benchmark:settings-matrix` | Tier-3 settings variants (animations, lazy, save-data) |
| `npm run benchmark:god-mode` | God mode autotest (`-- --tier=3`) |
| `npm run benchmark:full-suite` | Orchestrator + regression verify |
| `npm run benchmark:verify -- --strict` | Threshold gate |

**Env:** `TIER_MATRIX_FILTER=1,3,5` (CI fast subset), `TIER_MATRIX_PLATFORM=desktop`, `BENCHMARK_SKIP_BUILD=1`, `BENCHMARK_PWA_ROOT=ci-minified/site`.

**PWA hooks:** `?benchmark_test=1` enables `window.__rianellTestHooks` (`injectPerformanceTier`, `setAppSettings`, `openGodMode`). God mode buttons use `data-god-mode` selectors.

**Reports:** `benchmarks/tier-matrix/latest.run.json` (schema v4), `benchmarks/toolkit/AGENT-RUNBOOK.md`.

**CI:** `benchmarks-toolkit` job runs the **full suite** on PR/push (`npm run full-suite -- --strict`): 10-cell tier matrix, settings matrix, user journey, God mode, Lighthouse, regression verify. Reports committed on `main`/`master` via `commit-benchmarks`.

### AI engine benchmark suite (v1.82)

Rule-based AI microbench (no LLM/ONNX) — four parallel CI jobs after `benchmarks-expo`.

| npm (root) | Output slug | Runtime |
|------------|-------------|---------|
| `benchmark:ai-package` | `benchmarks/ai-engine-package/` | Node `@rianell/ai-engine` |
| `benchmark:ai-layers` | `benchmarks/ai-engine-layers/` | Playwright tier-3 + `AIEngine.js` layers |
| `benchmark:ai-algos` | `benchmarks/ai-engine-algos/` | Playwright tier-3 + atomic algos |
| `benchmark:ai-rn` | `benchmarks/ai-engine-rn/` | Jest `summarizeLogsForAi` |
| `benchmark:ai-verify -- --strict` | exit gate | `ai-thresholds.json` |
| `benchmark:ai-all` | all four + verify | local orchestrator |

**PWA hooks:** `runAiLayerBenchmark`, `runAiAlgoBenchmark`, `getAiBenchMeta` (requires `?benchmark_test=1`). Fixtures injected via Playwright `addInitScript` from `ai-fixtures.mjs`.

**Env:** `AI_BENCH_FIXTURE_FILTER=logs_30`, `AI_BENCH_MEDIAN=3`, `AI_BENCH_FORCE_CPU=1`, `BENCHMARK_BLOCK_LLM=1` (CI default for Playwright jobs).

**CI:** Uses `ci-minified/site`; artifacts merged on `main`/`master`. See `benchmarks/toolkit/AGENT-RUNBOOK.md`.

**v1.84 fixes:** Relative `BENCHMARK_PWA_ROOT` (repo-root join); Playwright `load` + `ensureAIEngineLoaded` pre-warm; RN runner uses `node_modules/jest/bin/jest.js` on Windows.

### UI locale refresh (v1.87)

Changing language in **Settings → Privacy & region → Language** runs `RianellI18n.refreshLocaleUI()`:

1. `data-i18n` / `data-i18n-placeholder` / aria attributes on static HTML
2. Bottom nav labels (`applyNavI18n`)
3. `refreshAllTabsForLocaleChange()` — Home, Log wizard, View logs, Charts, AI (cached), Settings carousel

No full page reload required.

### PWA boot locale hydration (v1.89.1)

**Cold boot** defers heavy i18n until the app shell is ready:

1. **Privacy gate** — `refreshGateLocaleUI()` / `hydrateGate()` only (no `refreshAllTabsForLocaleChange()`).
2. **`__rianellAppInitStarted`** — set at `runAppInit()`; unlocks `applyDataI18nAttributes()` in `i18n-pwa.js`.
3. **Shell reveal** — `revealAppShellWithLocale()` runs `ensureCatalogs()` → `refreshLocaleUI()` → `revealAppShell()` so Home and `data-i18n` nodes show translated text, not raw keys.

**Local CI-parity gate:** `powershell -File server/launch-server.ps1` (compiled `.server-dist`), then `npm run audit:boot:prepare` and `PROBE_URL=http://127.0.0.1:8080/ npm run audit:boot:strict`.

**Post-deploy (CI, v1.89.2):** After **`deploy-pages`**, job **`audit-boot-post-deploy`** downloads artifact **`pages-site-probe`** (the same prepared `site/` uploaded to GitHub Pages), serves it with **`python -m server`** on the audit runner, and runs **`audit:boot:baseline`** against `http://127.0.0.1:9876/`. Live **`rianell.com`** HTML verify is **non-blocking** (Cloudflare **403** from GitHub Actions IPs). Strict production audit remains the local **`launch-server.ps1`** gate before push.

### CI dependency caching (v1.89.2)

Caches invalidate when lockfiles or pinned tool versions change (not every run):

| Cache | Key | Composite / action |
|-------|-----|------------------|
| npm | `package-lock.json` | `./.github/actions/setup-node-ci` |
| pip | `requirements.txt`, `.github/ci-pip-extras.txt` | `./.github/actions/setup-python-ci` |
| Playwright | `package-lock.json` hash | `./.github/actions/install-playwright-chromium` |
| Gradle | `package-lock.json` + `apps/rn-app/package.json` | `actions/cache` on Android APK job |
| Gitleaks / OSV | pinned release version | `security-audit.yml` |

Gate jobs (**unit-tests**, **prepare-minified-assets**, **expo-bundle-prod**, **deploy-pages**, **audit-boot-post-deploy**) cancel the workflow on failure so mobile/server/release jobs do not burn minutes after a failed gate. Benchmark jobs are intentionally **not** cancelled.

### On-device model clear/redownload (v1.85)

**Settings → Performance → Clear and redownload model** stops any in-flight download, clears IndexedDB + Cache API + assembled chunk cache, and starts a fresh download. See `summary-llm.js` (`clearAiModelCache`, `cancelAiModelDownload`, `resetAiModelDownloadState`).

### v1.53.0 LLM model scripts (Supabase Storage)

| Script | npm alias | Purpose |
|--------|-----------|---------|
| `scripts/download-llm-models.mjs` | `npm run models:download` | Mirror ONNX weights from Hugging Face into `apps/pwa-webapp/models/` (gitignored) |
| `scripts/upload-llm-models-supabase.mjs` | `npm run models:upload:supabase` | Upload to bucket `llm-models` with 47 MB chunking; reads `security/.env`; `--purge-local` deletes local weights |
| `scripts/verify-llm-models.mjs` | `npm run models:verify` | Verify manifest; checks local files or remote Supabase when `SUPABASE_URL` set |
| `scripts/verify-no-model-weights-in-git.mjs` | `npm run verify:no-model-weights-in-git` | Fail if git tracks ONNX/chunks under `models/` (only manifest + README allowed) |

**Llama 3.2 download** requires `HF_TOKEN` and accepted license on huggingface.co. **Never commit** service role key or weight files.

### Security verification scripts (v1.50.0+)

Run from repo root (also enforced in CI **`security-audit`** job):

| Script | npm alias | Purpose |
|--------|-----------|---------|
| `scripts/verify-privacy-docs.mjs` | `npm run verify:privacy-docs` | Required privacy/security docs + valid `ropa.json` |
| `scripts/verify-rls-baseline.mjs` | — | RLS baseline SQL doc intact |
| `scripts/verify-csp-connect-src.mjs` | `npm run verify:csp` | CSP `connect-src` coverage |
| `scripts/verify-no-service-role-in-clients.mjs` | — | No service_role / sb_secret / hardcoded keys in **tracked** client sources |
| `scripts/generate-security-inventory.mjs` | `npm run docs:security-inventory` | Regenerate [security-inventory.md](security-inventory.md) |

**Security unit tests:** `tests/unit/security/` (XSS import preview, cloud deletion tables, verify-script smoke). Included in `npm run test:unit`.
