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

1. **unit-tests** — `test:unit`, parity, `verify:i18n`
2. **benchmarks** — web PWA, tier matrix, AI engine probes
3. **expo-bundle-prod** — Hermes production bundles
4. **server-exe** — Windows x64/x86 server EXE
5. **commit-app-build** — APK, iOS zip, server EXE → `App build/`
6. **publish-release** — GitHub Release assets
7. **deploy-pages** — GitHub Pages → [rianell.com](https://rianell.com)
8. **commit-dependencies-doc** — refresh dependencies.md on drift
9. **sync-wiki-to-github** — push `wiki/` when changed (requires `WIKI_PUSH_TOKEN` secret)
10. **security-headers-report** — securityheaders.com → `security/*.md`

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

---

## Read more (technical)

- [Testing & configuration](https://github.com/Metaheurist/Rianell/blob/main/docs/testing-and-configuration.md)
- [Benchmarks README](https://github.com/Metaheurist/Rianell/blob/main/benchmarks/README.md)
- [Dependencies inventory](https://github.com/Metaheurist/Rianell/blob/main/docs/dependencies.md)
