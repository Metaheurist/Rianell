# PWA production audit (October 2026)

Scope: the installed PWA on phones and desktop (`apps/pwa-webapp`), the on-device LLM, the service worker, and CI. Shipped in v2.7.0; details per change are in the root [CHANGELOG](../../CHANGELOG.md) `[2.7.0]`.

## Executive summary

1. **Mobile crash loop (blank page, "A problem repeatedly occurred").** Installed PWAs downloaded and compiled the on-device model during boot, and three.js scenes opened WebGL contexts that were never released. On phones that is enough memory and GPU pressure for iOS/Android to kill the page, and the next launch repeated it. Fixed: no model work at boot on phones, desktop auto-load only after consent, WebGL scenes skipped on constrained devices and contexts released on dispose, and `modules/boot-guard.js` detects a killed load and starts the next launch in AI safe mode with a one-time "Rianell closed unexpectedly last time." notice.
2. **Model download stuck at 99%.** The UI showed byte progress only, so the long ONNX compile after the last byte looked frozen. On the ONNX path the warmup also deadlocked on the LLM work queue until a timeout. Fixed: explicit `downloading` / `preparing` / `ready` / `error` phases, an indeterminate "Preparing" state, a 90 s silence watchdog with Retry that resumes from cached files, and the warmup now calls the loaded engine directly.
3. **Old styles flashing / slow loads.** The service worker waited on cache writes before responding and could serve a stale `index.html` that booted the previous deploy's bundles. Fixed: responses return immediately with background cache writes, `index.html` revalidates, and hashed `app.<hash>.min.js` / `styles.<hash>.css` are served cache-first.
4. **Weather icon did nothing; toasts stacked.** Repeated taps started parallel location requests and each denial added a toast; Safari keeps reporting the permission as "prompt", so a denial was never remembered. Fixed: one request at a time with a busy state, the denial is remembered, a validated manual-city form (Open-Meteo geocoding, rendered with `textContent`) replaces the dead end, and identical toasts refresh in place (max three).
5. **Grey layer over Home.** When the browser dropped the Home ambient WebGL context, its 55% opacity canvas stayed on top. Fixed: scenes remove themselves on `webglcontextlost`; the ambient scene is skipped on constrained devices.

Alongside these: the on-device AI runs Transformers.js 4.3.0 in a worker with three pinned model packages (Qwen3.5-0.8B on phones, Qwen3.5-2B-ONNX-OPT on desktop, Qwen2.5-0.5B without WebGPU), see [research/llm-shortlist-2026-10.md](../research/llm-shortlist-2026-10.md). `app.js` was split into domain modules ([development/pwa-app-module-map.md](../development/pwa-app-module-map.md)), and CI gained a scoped ESLint gate.

## Security review (OWASP-aligned, scoped to these changes)

- **A08 software and data integrity:** model loads used `revision: 'main'`, so a push to a model repo could swap the weights. Every package is now pinned to a commit SHA; the worker rewrites unpinned `resolve/main` requests to that SHA and only fetches from `https://huggingface.co/`. The vendored runtime keeps its `vendor-manifest.json` sha256 values and the CDN fallback stays version-pinned.
- **A03 injection / XSS:** the manual city name is validated (`sanitizePlaceQuery`), sent with `encodeURIComponent`, and results are range-checked and rendered with `textContent`; only rounded coordinates are stored.
- **A05 security misconfiguration (CSP):** `connect-src` adds only `https://geocoding-api.open-meteo.com` and drops `https://raw.githubusercontent.com` (used only by the removed MLC engine). The worker is same-origin (`worker-src 'self'`). The live HTTP header on rianell.com is `frame-ancestors 'self'` only, so the meta-tag CSP governs fetches.
- **Privacy (GDPR Art. 9):** prompts and health context stay inside the worker and are never logged; worker errors are sanitised. The crash breadcrumb stores phase names and timestamps only.
- **Service worker cache:** only same-origin `GET` responses with `ok` and `type === 'basic'` are cached; `no-store`, partial and opaque responses are skipped; model weights and Supabase never enter the shell cache.
- **Supply chain:** `sharp` bumped to 0.35.4 (GHSA-rgj7-g3m4-5g8c, libheif).
- **Out of scope (not changed):** auth/JWT handling (client-side Supabase session), CORS and rate limiting; no server code was touched.

## CI and workflow findings

- CI on `main` was green before this work; the only recurring failure was the **Dependabot update job**. Every run since 29 Sept failed on the `sharp` security update with `EOVERRIDE: Override for sharp@0.35.4 conflicts with direct dependency`: `overrides.sharp` repeated a literal range next to the direct dependency. Fixed by making the override `$sharp` (the pattern the repo already uses for `@babel/core`). The rule is now in [wiki/Build-Test-and-CI.md](../../wiki/Build-Test-and-CI.md).
- **Open Dependabot security PRs** with green CI: [#105](https://github.com/Metaheurist/Rianell/pull/105) browserslist (high), [#106](https://github.com/Metaheurist/Rianell/pull/106) undici (high), [#107](https://github.com/Metaheurist/Rianell/pull/107) baseline-browser-mapping (moderate), [#108](https://github.com/Metaheurist/Rianell/pull/108) brace-expansion (medium). All are dev-only transitive packages; `npm audit` reports exactly these four.
- **Lint:** there was no linter. `npm run lint` (ESLint 10 flat config, `@eslint/js` recommended) now runs in the `1 · Unit tests` job, scoped to the split-out modules, the LLM worker/client, `summary-llm.js`, `ui-feedback.js`, `sw.js` and new scripts. Its first run found a real bug: `summary-llm.js` referenced `getTodayDateStr`, which is not a global in the IIFE production bundle, so the daily AI home-question cache rolled over at UTC midnight.
- **Live CSP checker false positive:** `verify-csp-connect-src-live` reports "missing connect-src hosts" for rianell.com because the HTTP header has no `connect-src` directive at all. It is advisory only, but it should recognise that case.
- **Local boot audit noise:** `audit:boot:strict` on the development machine passed with warm boot around 0.6-0.8 s in most runs, but some runs took about 3.4-3.6 s (`SLOW_BOOT`) and one hung with no browser attached. This happened before and after the final changes and while other Playwright workloads ran, so it reads as local contention; the script would benefit from an overall timeout.

## Metrics, before and after

- **Boot (local `audit:boot:strict`):** tracked baseline (`audit-history/baseline.json`, 2026-06-15, baseline profile) warm 4,960 ms, guest 2,722 ms. Now (strict profile, typical runs): warm 583-803 ms, guest 570-726 ms. The profiles differ, so treat this as direction rather than an exact delta.
- **Transformers.js runtime:** `vendor/transformers/transformers.min.js` 818,493 bytes (3.3.2) to 581,935 bytes (4.3.0); gzip 207,203 to 169,497 bytes.
- **LLM glue:** `summary-llm.js` 92,248 to 83,744 bytes; 12,496 bytes of MLC/GGUF/ladder scripts deleted, and the WebLLM runtime and model libraries are no longer fetched from jsDelivr / raw.githubusercontent.com.
- **Model downloads:** phones about 483 MB (Qwen2.5-0.5B q4f16) to about 470 MB (Qwen3.5-0.8B q4f16); desktop about 1.2 GB (Qwen2.5-1.5B) to about 1.3 GB (Qwen3.5-2B-ONNX-OPT). The no-WebGPU model is now cached instead of re-downloaded (about 760 MB) every session.
- **Generation (desktop GPU benchmark):** median 1.5 s (small) and 1.6 s (large) per task; see the research doc for the full table.

## Action list

### P0

- Merge the Dependabot security PRs [#105](https://github.com/Metaheurist/Rianell/pull/105)-[#108](https://github.com/Metaheurist/Rianell/pull/108).
- Verify on real devices (an iPhone with an installed PWA and a 4 GB Android phone): no crash loop after force-closing during a model download, the safe-mode notice appears once, and Qwen3.5-0.8B loads on WebGPU or falls back to WASM cleanly. The benchmark ran only on a desktop GPU.

### P1

- Benchmark generation latency on phones; the desktop numbers do not predict mobile latency.
- Tune the chat prompt for Qwen3.5-0.8B: one of two grounded chat answers was an "I am an AI" refusal.
- Add an overall timeout to `scripts/audit/audit-boot-full.mjs` and record CI boot numbers as the new baseline.
- Capture the screenshots listed below.
- Widen the ESLint scope file by file as legacy modules are cleaned up.

### P2

- Teach `verify-csp-connect-src-live` that a header without `connect-src` does not restrict fetches.
- `tests/unit/pwa/hold-repeat.test.mjs` hung once in a full local run under heavy load (it passes alone in about 1 s); give its timer-based test a per-test timeout.
- `tests/unit/pwa/hold-repeat.test.mjs` hung once in a full local run under heavy load (it passes alone in about 1 s); give its timer-based test a per-test timeout.
- Regenerate `docs/architecture/codebase-interaction-map.md` (it still lists the deleted MLC/GGUF/ladder files).
- Revisit Gemma 4 E2B when Transformers.js ships its chat template, and LFM2.5 if its card adds it/nl/pl/pt and the `lfm1.0` licence is cleared.
- Continue moving domains out of `app.js` (coupled domains are listed in the module map).

## Screenshot requirements (repo docs and rianell.com)

Take each on a phone (installed PWA) and on desktop unless noted, in light and dark themes.

- **Settings > Performance, on-device AI model:** Downloading (determinate bar), Preparing (indeterminate "Preparing on-device AI…"), Ready, and Error with the Retry action ("AI model setup failed. Check your connection and try again."). The panel no longer has the "How summaries run" picker or the large-model-on-WASM toggle; replace any older screenshots that show them.
- **Home weather:** the enable button in its busy state, the manual-city form ("City or town", "Show weather", "Use my location") including the not-found message, and the enabled weather strip.
- **Crash-recovery notice:** the one-time "Rianell closed unexpectedly last time." notice with its "Copy report" action (phone only).
- **Toasts:** a single toast after tapping the same action repeatedly, showing de-duplication.
- **Home (phone):** Home without the grey overlay, to replace any screenshot captured with the ambient WebGL layer.
