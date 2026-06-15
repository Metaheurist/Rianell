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
| `npm run parity:*` | Platform parity checks |
| `npm run benchmark` | Performance benchmarks workspace |
| `npm run docs:dependencies` | Regenerate `docs/dependencies.md` |
| `npm run audit:boot:strict` | Playwright strict boot gate (local / CI parity) |
| `npm run wiki:verify` / `wiki:sync` | Validate and push `wiki/` to GitHub Wiki |

---

## PWA build pipeline

1. `sync-tokens-to-pwa.mjs`
2. `generate-locale-overrides.mjs`
3. `sync-i18n-assets.mjs`
4. `build-pwa-vendor.mjs` (shared packages)
5. `apps/pwa-webapp/build-site.mjs` — esbuild, fingerprint JS/CSS, patch `index.html`

---

## CI workflow (`.github/workflows/ci.yml`)

Typical push/PR to `main`:

1. **prepare-minified-assets** — minified PWA + Capacitor dist → artifact `minified-prebuild`
2. **unit-tests** — `test:unit`, parity, `verify:i18n`
3. **security-audit** — Gitleaks, OSV, npm/pip audit (reusable workflow)
4. **benchmarks-web** / **benchmarks-expo** — performance reports (non-blocking for cancel)
5. **expo-bundle-prod** — Hermes production bundles
6. **server-exe** — Windows x64/x86 server EXE
7. **deploy-pages** — GitHub Pages → [rianell.com](https://rianell.com)
8. **audit-boot-post-deploy** — boot audit on exact Pages `site/` (see below)
9. **commit-app-build** — APK, iOS zip, server EXE → `App build/`
10. **publish-release** — GitHub Release assets
11. **commit-dependencies-doc** — refresh `docs/dependencies.md` on drift
12. **sync-wiki-to-github** — push `wiki/` when changed (requires `WIKI_PUSH_TOKEN`)
13. **security-headers-report** — securityheaders.com → `security/*.md`

### Cancel on gate failure

When a **gate** job fails (unit tests, minified assets, Expo bundle, deploy, post-deploy audit), the workflow is **cancelled** so Android APK, server EXE, and release jobs do not keep running. **Benchmark** jobs are not cancelled — they can finish independently.

### Post-deploy boot audit (v1.89.2)

1. **deploy-pages** runs **`prepare-pages-site`** (minified copy + Supabase inject) and uploads artifact **`pages-site-probe`** — the same bytes sent to GitHub Pages.
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
| PyInstaller (Windows) | Python requirements / pip extras change |
| Gitleaks / OSV binaries | workflow pin version bumped |

Reusable actions: `.github/actions/setup-node-ci`, `setup-python-ci`, `install-playwright-chromium`, `prepare-pages-site`, `cache-expo`, `cache-android-sdk`.

---

## Benchmarks

Workspace `@rianell/benchmark-runner` under `benchmarks/`:

```bash
npm run benchmark
npm run benchmark:tier-matrix
npm run benchmark:ai-all
```

Reports committed on `main` via CI when changed.

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
- [SECURITY.md — CI scanning](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
