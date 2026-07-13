# Build, Test, and CI

How Rianell is built, tested, and deployed from GitHub Actions.

---

## Key npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build:web` | Sync tokens/i18n → vendor bundle → minified hashed PWA |
| `npm run build:web:apk` | Smaller PWA build (`--skip-trace`) for Android dist |
| `npm run bundle:mobile:prod` | Expo export for Android + iOS |
| `npm run test:unit` | Node unit tests (`tests/unit/`) |
| `npm run verify:i18n` | Full locale/prompt/MOTD gate suite |
| `npm run verify:a11y-tokens` | WCAG contrast gate for `@rianell/tokens` theme pairs |
| `npm run verify:design-tokens` | Guardrail: no hardcoded RN card scaffolds or width-based progress in critical UI |
| `npm run sync:tokens` | Regenerate `apps/pwa-webapp/css/tokens.css` from `@rianell/tokens` |
| `npm run parity:*` | Platform parity checks |
| `npm run benchmark` | Performance benchmarks workspace |
| `npm run docs:dependencies` | Regenerate `docs/dependencies.md` |
| `npm run audit:boot:strict` | Playwright strict boot gate (local / CI parity) |
| `npm run stress:memory` | Playwright memory stress test - Tier 5 + 365-day data, 10 tab-switch cycles, heap growth < 80 MB threshold; writes `benchmarks/memory/stress-latest.json` (gitignored) |
| `scripts/dev/shutdown-pc.ps1` | Schedule delayed Windows shutdown (default 10 min); cancel with `shutdown /a` |
| `npm run verify:cspro` | CI check: live site must not serve `CSPRO: connect-src 'none'` |
| `npm run supabase:deploy:delete-user-data` | Deploy GDPR Edge Function to Supabase project |
| `npm run wiki:verify` / `wiki:sync` | Validate and push `wiki/` to GitHub Wiki |

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

### Phase 1 - Foundation (max 3 parallel)

- **unit-tests** - `test:unit`, `verify:a11y-tokens`, `verify:design-tokens`, parity, `verify:i18n`
- **prepare-minified-assets** - minified PWA + Capacitor dist → artifact `minified-prebuild` (copies `.well-known/security.txt` and `.nojekyll`; glob copy skips dot paths)
- **security-audit** - Gitleaks, OSV, npm/pip audit (reusable workflow)

### Phase 2 - Build lanes (max 7 parallel)

- **benchmarks-web** - starts when minify finishes (does not wait for unit tests)
- **deploy-pages** - GitHub Pages → [rianell.com](https://rianell.com) (push only; gated on Phase 1)
- **expo-bundle-prod** - Hermes production bundles (gate)
- **server-exe** - Windows x64/x86 (starts after unit tests + audit, not minify)
- **rn-build-version** - sequential RN build number (parallel with Expo export on mobile pushes)
- **commit-dependencies-doc** / **sync-wiki-to-github** - main push bots (after unit tests)

### Phase 3 - Downstream

- **benchmarks-expo** - Hermes bundle stats (non-blocking)
- **playwright-e2e** - PWA smoke + oasis particle specs against local probe (`workers: 1` on CI - see `benchmarks/playwright.config.ts`)
- **benchmarks-web** - Lighthouse + nav timings on minified PWA (`timeout-minutes: 25`; shared measure for `web-pwa` / `github-pages`; `BENCHMARK_LH_RUNS=2`)
- **rncli-android-apk** / **rncli-ios-zip** - native artifacts (parallel)
- **audit-boot-post-deploy** - boot audit on exact Pages `site/` (see below)

### Phase 4 - Bots and release

- **commit-benchmarks** - merge benchmark Markdown on main
- **commit-app-build** / **publish-release** - mobile push only (parallel; release uses artifacts API)
- **readme-build-info** - **web-only** main pushes (`mobile_release` false); mobile README updated in `commit-app-build`
- **security-headers-report** - securityheaders.com → `security/*.md` (after post-deploy audit)

### Bot push queue

Jobs that `git push` share concurrency group `ci-bot-push-${{ github.ref }}` so parallel doc/wiki/benchmark/artifacts commits do not race. Build jobs stay fully parallel.

### Cancel on gate failure

When a **gate** job fails (unit tests, minified assets, Expo bundle, deploy, post-deploy audit), the workflow is **cancelled** so Android APK, server EXE, and release jobs do not keep running. **Benchmark** jobs are not cancelled - they can finish independently.

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
| Expo / Metro | lockfiles change |
| Gradle (Android) | root lockfile or `apps/rn-app/package.json` changes |
| Android SDK | same as Gradle key (API 36 / NDK 27) |

**Android native build (v1.96.1):** Root `package.json` `overrides` pin `expo-modules-core@55.0.25` so `apps/rn-app` does not resolve SDK 56 Kotlin Promise stubs against RN 0.83. The Android APK job sets `RIANELL_EXPO_EXPORT_STUB_NATIVE_LLM=1` for Gradle Metro bundling (same as `run-mobile-export.mjs`).

**Live Cloudflare probe (v1.96.1):** `scripts/ci/deploy-probe-loop.mjs` uses `domcontentloaded`, goto retries, and `PROBE_GOTO_TIMEOUT_MS` / `PROBE_PASS_MS` env vars - `waitUntil: load` often times out on `rianell.com` from GitHub Actions.
| PyInstaller (Windows) | Python requirements / pip extras change |
| UPX (Chocolatey) | server-exe matrix (cached install path) |
| Gitleaks / OSV binaries | workflow pin version bumped |

Reusable actions: `.github/actions/setup-node-ci`, `setup-python-ci`, `install-playwright-chromium`, `prepare-pages-site`, `cache-expo`, `cache-android-sdk`.

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

Dependabot: `.github/dependabot.yml` (npm + github-actions weekly; pip at repo root). Ignores Expo `>=56`, Babel `>=8`, and `@testing-library/react-native` `>=14` until coordinated upgrades. Secret scanning path ignores for vendored Transformers.js: `.github/secret_scanning.yml`.

---

## PR checklist

- [ ] `npm run test:unit` passes
- [ ] `npm run verify:i18n` if strings/locales changed
- [ ] `npm run parity:web` (and mobile if RN touched)
- [ ] `npm run docs:dependencies` if manifests/deps changed
- [ ] No secrets in client code (`verify-no-service-role-in-clients` in CI)
- [ ] Optional: local `audit:boot:strict` via `launch-server.ps1` before large PWA boot changes

---

## Read more (technical)

- [Testing & configuration](https://github.com/Metaheurist/Rianell/blob/main/docs/testing-and-configuration.md)
- [Benchmarks README](https://github.com/Metaheurist/Rianell/blob/main/benchmarks/README.md)
- [Dependencies inventory](https://github.com/Metaheurist/Rianell/blob/main/docs/dependencies.md)
- [SECURITY.md - CI scanning](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
