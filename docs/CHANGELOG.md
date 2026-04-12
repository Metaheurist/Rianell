## 📜 Changelog

Changelog is derived from project commit history. Versions follow semantic versioning (major.minor.patch).

**Latest: v1.46.27** - RN Jest: explicit `@react-native/babel-preset` for npm workspaces.

### v1.46.27 - 2026-04-12 - React Native tests: babel preset resolution

- **`apps/rn-app/package.json`:** Add **`@react-native/babel-preset@0.83.2`** as a **devDependency** (matches **`react-native`**). Under **npm workspaces**, `babel-preset-expo` could not resolve **`@react-native/babel-preset`** / **`@babel/plugin-transform-object-rest-spread`**, so **`jest`** failed on CI and locally. **[dependencies.md](dependencies.md)** updated via **`npm run docs:dependencies`**.

### v1.46.26 - 2026-04-12 - Python: cryptography >=46.0.7 (OSV)

- **`requirements.txt`:** Bump **`cryptography`** floor from **`>=46.0.6`** to **`>=46.0.7`** ([OSV: GHSA-p423-j2cm-9vmq](https://osv.dev/GHSA-p423-j2cm-9vmq)). **[dependencies.md](dependencies.md)** synced.

### v1.46.25 - 2026-04-12 - Python: cryptography minimum for OSV-Scanner

- **`requirements.txt`:** Raise **`cryptography`** from **`>=41.0.0`** to **`>=46.0.6`** so **OSV-Scanner** (and **`pip-audit`**) no longer report known **PyPI** advisories on the resolved floor. **[dependencies.md](dependencies.md)** table updated via **`npm run docs:dependencies`**.

### v1.46.24 - 2026-04-12 - Supply chain, dependencies doc automation, bug reports

- **[docs/project-reference.md](project-reference.md)** (**Troubleshooting**): Clarifies that the **Python dev `/api/reload` SSE** path is **loopback-only** (not GitHub Pages / rianell.com); documents **extension** noise (`SES` / lockdown), **service worker** update modal vs silent reload, **mobile memory** pressure (on-device LLM + charts + large logs), and the **styles failed** overlay.
- **[docs/app-and-features.md](app-and-features.md)**: Service worker bullet aligned with **rianell.com** / **\*.github.io** default registration; console section links to troubleshooting; PWA restart note.
- **GitHub Actions:** [`.github/workflows/security-audit.yml`](../.github/workflows/security-audit.yml) runs only as **`workflow_call`** / **`workflow_dispatch`** (no duplicate **`push`** / **`pull_request`** alongside **`ci.yml`**). **`commit-dependencies-doc`** job may refresh **[dependencies.md](dependencies.md)** on **`main`** / **`master`** after merges.
- **Dependencies / CI:** Root **`overrides`** pin **`@capacitor/assets`** to **`@capacitor/cli@7.6.1`** (drops nested **CLI 5.x** and **`tar@6.2.1`**); **`@trapezedev/project`** and **`mergexml`** pin **`@xmldom/xmldom@0.8.12`**. **`package-lock.json`** regenerated so **OSV-Scanner** no longer flags dev-only **`tar`** / **`@xmldom/xmldom`** advisories from those chains. `npm ls` may still report **`invalid`** for **`@xmldom/xmldom`** where upstream manifests request **`^0.7.x`**; the installed **0.8.12** is intentional.
- **Docs automation:** [`scripts/generate-dependencies-doc.mjs`](../scripts/generate-dependencies-doc.mjs) + **`npm run docs:dependencies`** regenerate **[dependencies.md](dependencies.md)**. **CI** verifies the file on **pull requests** and may commit updates on pushes to **main** / **master** (see **`commit-dependencies-doc`** in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).
- **Web / PWA (`apps/pwa-webapp/`):** Bug report modal — close control, scroll wrapper, optional fields under **More detail**, bug icon asset, **`styles.css?v=84`** cache bust; console log note clarified for dev/local server.
- **React Native (`apps/rn-app/`):** **`installBugReportConsoleCapture`** ([`src/utils/bugReportLogs.ts`](../apps/rn-app/src/utils/bugReportLogs.ts)) attaches recent **`console`** output for bug reports on launch.
- **Python server (`server/main.py`):** Bug report ingest accepts **`page_url`** from either **`url`** or **`page_url`** in the JSON payload (client naming parity).

### v1.46.23 - 2026-04-12 - Docs: toolchain and audit wording

- **[benchmarks/README.md](../benchmarks/README.md):** Prerequisites (**Node 24.14.1+**), how **`meta.node`** in reports relates to CI vs local runs.
- **[docs/testing-and-configuration.md](testing-and-configuration.md):** Short **Toolchain** note (Node 24.14.1+, unit vs mobile tests).
- **[docs/SECURITY.md](SECURITY.md):** Related-docs table now describes **`npm audit --omit=dev`** (production tree gate) alongside OSV and pip-audit.

### v1.46.22 - 2026-04-12 - Tooling: Node.js 24.14.1 LTS

- **Node / npm:** Root **`engines.node`** set to **`>=24.14.1`**. **`.nvmrc`** and **`.node-version`** at the repository root pin **24.14.1** for local development. **`package-lock.json`** regenerated under Node 24.
- **CI:** All **`actions/setup-node`** steps use **`node-version: "24.14.1"`** (`.github/workflows/ci.yml`, `security-audit.yml`, `expo-native-build.yml`, `legacy-capacitor.yml`). Header comment in **`ci.yml`** documents job Node vs `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`.
- **npm overrides:** **`@xmldom/xmldom`** pinned to **0.8.12** where the resolver honours it (legacy **@capacitor/assets** / Trapeze nested copies may still warn on a full `npm audit`).
- **Legacy Capacitor shell:** **`vite`** raised to **`^6.4.2`** (security patches in the 6.4 line).
- **React Native tests:** **`react-test-renderer`** pinned to **19.2.4** to match **`react`** and avoid peer resolution drift.
- **Security audit workflow:** **`npm audit`** gate uses **`--omit=dev`** so the job matches **production** install risk; dev-only advisory chains (e.g. Capacitor asset tooling) are reviewed separately. **`OSV-Scanner`** and **`pip-audit`** unchanged.
- **Benchmarks:** **`benchmarks/*/latest.*`** and **`compare.md`** on **`main`** continue to follow the **commit-benchmarks** CI lane; after this change, the next benchmark merge will record **`meta.node`** as **v24.14.1** (prior **`latest.run.json`** rows may still show Node 22.x from earlier CI).
- **Docs:** [README.md](../README.md) Node badge, [docs/setup-and-usage.md](setup-and-usage.md), [docs/dependencies.md](dependencies.md), [docs/project-reference.md](project-reference.md) updated for Node 24.14.1+.

### v1.46.21 - 2026-03-29 - PWA settings scroll, MOTD slingshot return, RN settings + MOTD parity

- **Web / PWA (`apps/pwa-webapp/styles.css`):** Settings modal on **narrow viewports** uses **`max-height`** with **`100dvh`** and safe-area terms so the card height is bounded. **`.settings-carousel-viewport`** uses **`overflow-x: clip`** (not **`overflow: hidden`** on both axes) so **vertical scrolling inside long panes** works on mobile Safari / PWA. **`.settings-carousel-pane`** uses **`height` / `max-height: 100%`**, **`contain: layout`** (replacing **`paint`**), **`overflow-y: auto`**, **`min-height: 0`**. **`index.html`** **`styles.css?v=82`**.
- **React Native (`apps/rn-app/src/screens/SettingsScreen.tsx`):** Each settings carousel pane’s inner **`ScrollView`** uses **`style={styles.paneScroll}`** (**`flex: 1`**) so tall tabs (e.g. Personal & cloud sync, Accessibility) scroll inside the modal instead of clipping.
- **Web / PWA MOTD (`apps/pwa-webapp/app.js`):** Each tap increments **`__motdSpringCharge`** (capped). Return-to-neutral uses **`k = 3.8 + charge × 1.05`** when **|ω|** is low, so **more taps produce a faster slingshot snap** back to default. Heartbeat coupling considers charge. **`index.html`** **`app.js?v=30`**.
- **React Native MOTD (`apps/rn-app/src/screens/HomeScreen.tsx`):** Same physics (**`springChargeRef`**, **`exp(-1.75)`** damping, spring only when **|ω| < 0.22**). **Removed** hold-to-repeat **`setInterval`** so each tap is one charge (matches web). Accessibility hint updated.

### v1.46.20 - 2026-03-29 - Web PWA: settings carousel side buttons fill window height

- **Web / PWA (`styles.css`):** **`.settings-carousel-side`** overrides global **`button { margin: 15px 0; min-height: 50px; width: 100%; }`** with **`margin: 0`**, **`min-height: 0`**, fixed width, **`padding: 0`**, no slide-in animation, no default box-shadow; **`::before`** ripple disabled; **`:hover` / `:active`** **`transform: none`** so the cyber-chrome button lift does not shift the rails. **`index.html`** **`styles.css?v=81`**.

### v1.46.19 - 2026-03-29 - Web PWA: settings section dots show icons without Font Awesome CSS

- **Web / PWA (`apps/pwa-webapp/app.js`):** **`ensureSettingsCarouselDots`** renders **Unicode glyphs** in the eight carousel buttons instead of **Font Awesome** `<i class="fa-…">` icons. Deferred Font Awesome (jsDelivr) or a stricter edge **CSP** previously left the dots as **empty circles**. **`styles.css`** adds **`.settings-carousel-dot__icon--glyph`** (emoji font stack). **`index.html`:** **`app.js?v=29`**, **`styles.css?v=80`**; **`app.min.js`** rebuilt.

### v1.46.18 - 2026-03-29 - Docs: Cloudflare CSP must match meta; Permissions-Policy `notifications`

- **Ops / edge:** **[security/cloudflare-headers-recommended.md](../security/cloudflare-headers-recommended.md)** explains that a **narrow HTTP `Content-Security-Policy`** from Cloudflare **combines** with the **`index.html` meta CSP** and blocks **jsDelivr**, **Google Fonts**, and **Font Awesome** (symptoms: script/style CSP violations, Supabase UMD load failure, MOTD LLM import failure). **Remove** duplicate HTTP CSP or **paste** the full policy from **`apps/pwa-webapp/index.html`**. **`Permissions-Policy`:** remove **`notifications=(self)`** if Chromium logs **Unrecognized feature: 'notifications'**.
- **Docs:** [docs/infrastructure-and-security-edge.md](infrastructure-and-security-edge.md), [docs/SECURITY.md](SECURITY.md) (CSP table links **`apps/pwa-webapp/index.html`**), [security/README.md](../security/README.md). **`apps/pwa-webapp/index.html`** comment points to the new guide.

### v1.46.17 - 2026-03-29 - Dependencies: `http-proxy-agent` override; documentation UK English

- **npm:** Root **`overrides`** now replace **`http-proxy-agent@5.0.0`** (from **`jsdom@20`** / **`jest-expo`**) with **`7.0.2`**, eliminating the vulnerable **`@tootallnate/once@<3.0.1`** chain in the lockfile; **`package-lock.json`** regenerated. **`npm audit`** reports **0** vulnerabilities; **`npm run test:mobile`** passes.
- **Docs:** [docs/SECURITY.md](SECURITY.md) documents the override and expected **`npm ls`** peer note; **`scripts/apply-uk-english-md.mjs`** run across all **`*.md`** files (UK spelling in prose; CSS **`overscroll-behavior`**, JSON **`sync_behavior`**, and code identifiers preserved).

### v1.46.16 - 2026-03-29 - Web MOTD 3D spin + docs: security header run history

- **Web / PWA (`apps/pwa-webapp/app.js`):** MOTD **`.motd-spin-host`** spin no longer uses a **±1.2 rad** angle clamp (which capped visible tilt ~70°). **Pointer** taps get **rapid-tap boost** like keyboard; angular velocity can carry **well past 360°** before friction; return-to-neutral **spring** applies only when **|ω|** is very low. Heartbeat coupling uses **|ω|** only. **`index.html`** `app.js?v=` **28**; **`app.min.js`** rebuilt.
- **Docs:** **`docs/infrastructure-and-security-edge.md`** — new **Automated header reports (CI)** with links to **`security/securityheaders-runs/run-*.md`** and **`security/README.md`**. **`docs/styling.md`** — MOTD tap spin behaviour.

### v1.46.15 - 2026-03-29 - Security Headers CI: relay scan page, browser-like live fetch

- **Problem:** **securityheaders.com** and sometimes the **live site** return **403** from GitHub Actions (bot / Cloudflare). Browser-only proxy sites (e.g. Proxyium) are **not** usable from CI (no stable API).
- **Fix (`scripts/fetch-securityheaders-report.mjs`):** After a failed **direct** scan fetch, try **HTML relays** in order: **AllOrigins**, **corsproxy.io**, **Codetabs** — then parse the SecurityHeaders scan page when any relay returns usable HTML. **Live header** fallback tries **`SECURITY_HEADERS_LIVE_URLS`** (CI: `https://rianell.com` then `https://www.rianell.com`) with a **Chrome-like** User-Agent. YAML may include **`securityheaders_scan_relay`**. **`security/README.md`** explains relays vs interactive proxies.

### v1.46.14 - 2026-03-29 - Docs: benchmark paths and repo tree

- **Changelog:** Older release notes (v1.46.4–v1.46.11) that referenced **`Benchmarks/`** or **`benchmark-runner/`** now point at **`benchmarks/`** so historical bullets match the post–v1.46.13 layout.
- **Project reference:** Repository tree includes **`benchmarks/`** (npm workspace **`@rianell/benchmark-runner`**: CI/local performance reports, scripts, reporters).
- **Setup guide:** **`docs/setup-and-usage.md`** describes **`benchmarks/`** and **`npm run benchmark`** under Installation.

### v1.46.13 - 2026-03-29 - Repo layout: unified `benchmarks/` workspace

- **Change:** **`benchmark-runner/`** and **`Benchmarks/`** are merged into one folder **`benchmarks/`** (npm workspace **`@rianell/benchmark-runner`** unchanged). Generated reports (**`web-pwa/`**, **`compare.md`**, etc.) live beside **`scripts/`** and **`reporters/`**.
- **Plumbing:** **`.github/workflows/ci.yml`**, **`README.md`**, **`docs/project-reference.md`**, **`.gitignore`**, **`package.json`** workspaces, **`tests/unit/workflows-ci-rncli.test.mjs`**, and benchmark scripts now use **`benchmarks/`** paths and **`node benchmarks/scripts/...`** in CI.

### v1.46.12 - 2026-03-29 - CI: Security Headers job tolerates securityheaders.com 403

- **Problem:** `curl` to **securityheaders.com** returned **403** on GitHub Actions (bot protection / Cloudflare).
- **Fix:** **`scripts/fetch-securityheaders-report.mjs`** now uses **Node `fetch`** with browser-like headers, then on failure writes a report from **`GET https://rianell.com`** response headers. Removed the separate curl step from **`.github/workflows/ci.yml`**. **`security/README.md`** updated.

### v1.46.11 - 2026-03-29 - CI: restore RN-only build counter + docs

- **README / CI:** **`rn-build-version`** job is **restored**. **Alpha RN Android / RN iOS** rows read **`version`** from the sequential counter (same as **`App build/RNCLI-Android/latest.json`** / iOS zips), **not** **`GITHUB_RUN_NUMBER`**. **Server** and **Web / PWA** rows still use the workflow run number. This keeps RN build counts meaningful (how many mobile artifact runs) while Server/Web stay aligned with overall CI runs.
- **Large-file fallback** (from v1.46.10) remains: small **`latest.json`** files still commit with README when binaries fail to push, so the sequential RN counter can advance.
- **Docs:** **`docs/next-phase-development-plan.md`** replaced with a short status note — **no active roadmap items**; pointers to CHANGELOG and feature docs. **`docs/project-reference.md`**, **`scripts/update-readme-build-info.mjs`**, **`benchmarks/README.md`**, **`docs/app-and-features.md`** updated for RN vs workflow numbering.
- **Tests:** **`tests/unit/workflows-ci-rncli.test.mjs`** expects **`rn-build-version`** + **`needs.rn-build-version.outputs.rn_build`**.

### v1.46.10 - 2026-03-29 - CI: RN Alpha build numbers + commit fallback

- **Root cause:** React Native CLI **`latest.json`** used a **sequential counter** read from the repo (`App build/RNCLI-Android/latest.json`). When **`commit-app-build`** hit GitHub **large-file** limits, the workflow only pushed **README.md**, so **`latest.json` never advanced** and the counter stayed at **1** while Server/Web followed **`GITHUB_RUN_NUMBER`** (e.g. 200+).
- **Fix (`.github/workflows/ci.yml`):**
  - Removed **`rn-build-version`**; **`rncli-android-apk`** and **`rncli-ios-zip`** set **`version`** (and iOS zip basename `<N>`) from **`github.run_number`**, matching **Server** `latest.json` and the **Web / PWA** row in the README build table for the same workflow run.
  - **Large-file fallback:** after a size/quota rejection, the fallback commit now stages **small metadata** — **`App build/RNCLI-Android/latest.json`**, **`App build/iOS/latest.json`**, and **`App build/Server/latest*.json`** — together with **`README.md`**, so GitHub Pages and the README badge stay consistent even when APK/zip binaries cannot be pushed to git.
- **Docs:** **`scripts/update-readme-build-info.mjs`** header comment; **`docs/next-phase-development-plan.md`** §2, §3.2, §6; **`benchmarks/README.md`** (CI build numbering note); **`docs/app-and-features.md`** release-channel table footnote; **`docs/project-reference.md`** checkpoint.
- **Tests:** **`tests/unit/workflows-ci-rncli.test.mjs`** — assert **`github.run_number`** stamping and fallback paths; **`rn-build-version`** assertions removed.

### v1.46.9 - 2026-03-29 - Benchmark history, comparison Markdown, CI merge

- **Benchmark tooling (`benchmarks/reporters/write-run-json.mjs`, `run-web-benchmarks.mjs`, `expo-bundle-stats.mjs`):** Each run writes **`benchmarks/<slug>/latest.run.json`** (schema version **1**) with Lighthouse + nav (web) or Hermes aggregates + bundle rows (Expo). Skipped Capacitor / missing Expo bundle still emit JSON with **`status: "skipped"`**.
- **CI merge (`benchmarks/scripts/merge-benchmark-ci.mjs`):** Merges **`latest.run.json`** into **`history.json`** per platform (dedupe by **`github_run_id`** or local sha+timestamp, cap **150** runs). Copies **`latest.run.json`** when Expo artifact is a flat folder. Runs **`generate-benchmark-compare.mjs`** then **`update-benchmarks-readme.mjs`**.
- **Comparison doc:** **[benchmarks/compare.md](../benchmarks/compare.md)** (tables + Mermaid **`xychart-beta`** line charts) driven by **[benchmarks/compare.config.json](../benchmarks/compare.config.json)** (`window`, `detail_windows`, `platforms`). **[benchmarks/README.md](../benchmarks/README.md)** links history/compare.
- **Workspace script:** `npm run compare --workspace=@rianell/benchmark-runner` regenerates **`compare.md`** from existing histories (optional local use).

### v1.46.8 - 2026-03-29 - Log inline edit: CSS classes instead of dark-only inline styles

- **Web / PWA / Capacitor legacy (`apps/pwa-webapp/app.js`, `styles.css`):** Expanded **log entry inline edit** markup to use shared **`.inline-edit-field`** (plus **`--energy`**, **`--pain`**, **`--notes`** where needed) on all number/text inputs and the notes **`<textarea>`**, removing **dark-theme `style=""`** attributes. **Pain location** and **notes** now pick up **`body.light-mode`** field colours like other controls. **Energy/clarity** and **steps** use **`inline-edit-field-wrap`** for consistent layout. **`body.light-mode .log-notes`** adjusts copy and panel tint so the note block stays readable when editing. Bumped **`styles.css?v=77`**.

### v1.46.7 - 2026-03-29 - Light mode readability and theme consistency

- **Web / PWA / Capacitor legacy (`apps/pwa-webapp/app.js`):** Added **`isWebAppLightMode`**, **`applyApexLineChartThemeToOptions`**, and **`applyApexRadarChartThemeToOptions`** so ApexCharts line and radar charts use dark green axes and grids in light mode instead of disabled `if (false)` branches. Chart cache signatures include a **`|lm1` / `|lm0`** suffix so toggling appearance refreshes colours. **`setAppearanceMode`** and the **system** **`prefers-color-scheme`** listener call **`refreshCharts()`** after **`applyAppearanceMode`**. Individual chart tooltips use theme-aware description colour.
- **Web CSS (`apps/pwa-webapp/styles.css`, `styles-charts.css`):** **`body.light-mode`** rules for **modal header/footer** (no dark sandwich), **`.field-hint`**, **modal inputs**, **log metric grid**, **combined chart metric selector**, **filter labels**, and deferred **chart container / chart info box / loading / prediction overlay**. Bumped **`styles.css?v=76`**, **`styles-charts.css?v=2`**.
- **React Native (`SettingsScreen.tsx`, `ChartsScreen.tsx`, `AiScreen.tsx`):** Section rows, hints, inline choices, data buttons, import modal, range chips, and balance labels use **`theme.tokens`** for text and surfaces in light mode.

### v1.46.6 - 2026-03-29 - PWA MOTD title in light mode

- **Web / PWA (`apps/pwa-webapp/styles.css`):** In **light mode**, the dashboard MOTD (`#dashboardTitle`) no longer uses the heavy 3D / black extrusion `text-shadow` stack, dark `filter`, or duplicate blur pseudo-layers. Copy uses **`var(--text-dark)`** with a **subtle** shadow so quotes stay readable on white and on mobile.

### v1.46.5 - 2026-03-29 - RN settings carousel icons

- **React Native Settings (`apps/rn-app/src/screens/SettingsScreen.tsx`):** The eight-pane carousel strip now shows **Ionicons** per section (mapping aligned with `settingsIconForTitle` in `apps/pwa-webapp/app.js`), replacing empty dot views and the redundant text-pill row. Active pane uses accent highlight; header meta uses ` - ` between index and title. **`SettingsScreen.test.tsx`** expectations updated for the meta string.
- **Validation:** `npm run typecheck:mobile`, `npm run test:mobile` pass.

### v1.46.4 - 2026-03-29 - Benchmark lib tracked, voice input on expo-speech-recognition, infra docs

- **CI / benchmarks:** `.gitignore` now scopes `lib/` to the repo root only so `benchmarks/scripts/lib/` (static server, Lighthouse, Playwright navigation helpers) is no longer ignored; files are committed so `node benchmarks/scripts/run-web-benchmarks.mjs` resolves on GitHub Actions.
- **React Native voice (`apps/rn-app/src/voice/VoiceNotesButton.tsx`):** Replaced deprecated `@react-native-voice/voice` with **`expo-speech-recognition`** (`ExpoSpeechRecognitionModule`, `useSpeechRecognitionEvent`), UK locale `en-GB`, typed event handlers; **`app.json`** uses the `expo-speech-recognition` config plugin with permission strings; **`jest.setup.ts`** mocks the new module.
- **Tooling:** **`jest-expo`** restored to **`~55.0.11`** (aligned with Expo SDK 55); **`apps/rn-app/tsconfig.json`** excludes `jest.setup.ts` and `**/*.test.*` from `tsc` so production typecheck matches CI expectations.
- **Documentation:** New **[docs/infrastructure-and-security-edge.md](infrastructure-and-security-edge.md)** (DNS, Cloudflare edge features, GitHub Pages - no secrets); linked from **[README.md](../README.md)**. README punctuation normalised on edited lines (` - ` instead of em dash where changed).
- **Validation:** `npm run typecheck:mobile`, `npm run test:mobile` pass.

### v1.46.3 - 2026-03-27 - RN settings eight-pane parity, native app install UI, log wizard suggest note

- **React Native Settings (`apps/rn-app/src/screens/SettingsScreen.tsx`):** Carousel now uses **eight** titled panes aligned with `data-settings-pane-title` in `apps/pwa-webapp/index.html`: Personal & cloud sync → AI & Goals → Display (daily reminders) → Customisation (appearance & team) → Accessibility → Data options (demo mode) → Performance (on-device AI model + benchmark) → Data management.
- **Native app installation (`apps/rn-app/src/settings/SettingsAppInstallSection.tsx`):** The **Data management** pane includes an **App installation** block for native builds: confirms native app context, shows **version / build** via `expo-constants`, and links to **GitHub releases** and the **Android APK** beta artifact when not already on Android (web hides PWA install rows when `isRianellNativeApp()`; RN replaces that with explicit native copy and outbound links).
- **Data management:** **Clear all data** button added (destructive confirm, `saveLogs([])`), matching the web danger-zone control; blocked in demo mode.
- **Log wizard (`apps/rn-app/src/screens/LogWizardScreen.tsx`):** **Suggest note** wired to `suggestLogNote` from `apps/rn-app/src/ai/llm.ts` with `loadCachedBenchmark`, `prefs` passed from `RootNavigator`; notes capped at **500** characters; control hidden when `aiEnabled === false`.
- **Navigation (`apps/rn-app/src/navigation/RootNavigator.tsx`):** `LogWizard` screen receives `prefs` so the wizard uses the same preferences as the tab navigator.
- **Tests:** `SettingsScreen.test.tsx` and `LogWizardScreen.test.tsx` updated; `expo-constants` mocked in settings tests.
- **Validation:** `npx jest src/screens/SettingsScreen.test.tsx src/screens/LogWizardScreen.test.tsx` passes.

### v1.46.2 - 2026-03-27 - CI release resilience + legacy Capacitor naming clarity

- **CI reliability (`commit-app-build`):** `.github/workflows/ci.yml` now tolerates GitHub large-file/quota push rejections (GH001/LFS/size-limit path) for full `App build/` commits and falls back to a README-only metadata push so post-build documentation still updates.
- **Release artifact clarity:** legacy artifacts in `publish-release` are now emitted with explicit `legacy-capacitor-android-*` and `legacy-capacitor-ios-*` names to avoid confusion with RN CLI outputs.
- **Docs/readme sync:** `scripts/update-readme-build-info.mjs` now labels legacy entries as **legacy Capacitor Android/iOS** in the README build-info block.

### v1.46.1 - 2026-03-27 - Documentation sync checkpoint

- **Docs alignment:** synchronised plan/parity/features/readme wording on the current RN notification diagnostics baseline, including compact summary + trajectory/stability visibility.
- **Scope:** documentation/changelog checkpoint only; no runtime behaviour changes in this entry.

### v1.46.0 - 2026-03-27 - Unknown-action session summary line

- **RN notifications (Phase E):** Settings now includes a compact unknown-action session summary line combining observability quality, drift status, and trajectory stability.
- **Diagnostics depth:** unknown-action diagnostics now provide a quick-read aggregate status while preserving detailed per-signal lines.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.99 - 2026-03-27 - Unknown-action trajectory stability note

- **RN notifications (Phase E):** Settings now derives and shows session trajectory stability (`stable` vs `shifted`) from first/latest unknown-action source.
- **Diagnostics depth:** unknown-action diagnostics now include trajectory-status context in addition to trajectory path, quality guidance, and drift indicators.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.98 - 2026-03-27 - Unknown-action source trajectory visibility

- **RN notifications (Phase E):** Settings now tracks and shows unknown-action source trajectory for the current session (first source to latest source).
- **Diagnostics depth:** unknown-action diagnostics now include source trajectory context in addition to quality-driven guidance and drift indicators.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.97 - 2026-03-27 - Unknown-action recommended next-check guidance

- **RN notifications (Phase E):** Settings now includes a recommended next-check message tied to unknown-action observability quality (`low`/`medium`/`high`).
- **Diagnostics depth:** unknown-action diagnostics now provide actionable in-app follow-up guidance in addition to counters, split/confidence signals, and drift severity.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.96 - 2026-03-27 - Unknown-action observability quality score

- **RN notifications (Phase E):** Settings now derives and shows an unknown-action observability quality score (`low`/`medium`/`high`) based on in-session unknown-action sample size.
- **Diagnostics depth:** unknown-action diagnostics now combine counts, source split, dominance confidence, minimum-sample warning, drift status, and a quick-read observability quality indicator.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.95 - 2026-03-27 - Documentation sync checkpoint

- **Docs alignment:** synchronised plan/parity/features/readme wording to reflect the current RN notification diagnostics baseline, including dominant-source confidence and low-sample warning context.
- **Scope:** documentation/changelog checkpoint only; no runtime behaviour changes in this entry.

### v1.45.94 - 2026-03-27 - Unknown-action minimum-sample confidence warning

- **RN notifications (Phase E):** Settings now shows a minimum-sample warning when unknown-action confidence is based on fewer than 3 events in the current session.
- **Diagnostics depth:** dominant-source confidence is now explicitly contextualized as preliminary on low sample sizes, reducing over-interpretation risk.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.93 - 2026-03-27 - Unknown-action dominant-source confidence hint

- **RN notifications (Phase E):** Settings now shows a dominant-source confidence hint for unknown reminder actions (`weak`/`medium`/`strong`) or a balanced-state message when startup/live shares are equal.
- **Diagnostics depth:** unknown-action diagnostics now combine counts, source percentages, drift status, and dominant-source confidence to make long-tail runtime drift interpretation faster.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.92 - 2026-03-27 - Unknown-action source split percentages

- **RN notifications (Phase E):** Settings now shows startup/live percentage split for unknown reminder actions in the current session.
- **Diagnostics depth:** unknown-action observability now includes both absolute counts and ratio-style source distribution, improving drift triage at a glance.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.91 - 2026-03-27 - Unknown-action drift status indicator

- **RN notifications (Phase E):** Settings now derives and shows an unknown-action stability status (`low`, `moderate`, `high drift`) from session unknown-action volume.
- **Diagnostics depth:** unknown-action diagnostics now include severity-like drift status in addition to count/source/last-seen/cause/reset details.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx permissions.test.ts RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.90 - 2026-03-27 - Documentation sync checkpoint

- **Docs alignment:** synchronised plan/parity/features/readme wording to reflect the latest Phase E notification diagnostics baseline (count, startup/live split, last-seen, source, cause hint, reset control).
- **Scope:** documentation/changelog checkpoint only; no runtime behaviour changes in this entry.

### v1.45.89 - 2026-03-27 - Unknown-action source breakdown counts

- **RN notifications (Phase E):** Settings now breaks unknown reminder action observations into source-specific counts (`startup` vs `live`) in addition to total count and last-seen/source context.
- **Diagnostics depth:** unknown-action diagnostics now include total count, startup/live split, last-seen time, latest source, likely-cause hint (when relevant), and reset control.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx permissions.test.ts RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.88 - 2026-03-27 - Unknown-action source context

- **RN notifications (Phase E):** unknown reminder-action diagnostics now include source context (`startup snapshot` vs `live listener`) so in-session drift origin is visible.
- **Diagnostics completeness:** Settings unknown-action diagnostics now include count, last-seen time, source, likely-cause hint (when relevant), and reset control.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx permissions.test.ts RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.87 - 2026-03-27 - Unknown-action last-seen context

- **RN notifications (Phase E):** Settings now records and displays the most recent in-session unknown reminder action observation time, alongside the existing counter and reset control.
- **Diagnostics depth:** unknown-action diagnostics now provide count + likely-cause hint + last-seen context + reset action in one place.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx permissions.test.ts RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.86 - 2026-03-27 - Unknown-action counter reset control

- **RN notifications (Phase E):** Settings now includes a reset action for the in-session unknown reminder action counter so diagnostics can be cleared after review.
- **UX continuity:** unknown-action diagnostics now include count, runtime-cause hint (when applicable), and explicit reset control in one place.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx permissions.test.ts RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.85 - 2026-03-27 - Unknown action drift hint

- **RN notifications (Phase E):** Settings now adds a conditional explanatory hint when unknown reminder actions are observed and dismiss semantics are unavailable, clarifying a likely runtime cause for unknown-action drift.
- **UX clarity:** unknown-action session counter now pairs with actionable context instead of a raw count alone.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx RootNavigator.test.tsx permissions.test.ts` and `npm run typecheck:mobile` pass.

### v1.45.84 - 2026-03-27 - Documentation checkpoint sync

- **Docs alignment:** refreshed plan/parity/features wording to keep Phase E notification long-tail status consistent after the latest runtime-capability and unknown-action observability increments.
- **Scope:** documentation/changelog checkpoint only; no runtime behaviour changes in this entry.

### v1.45.83 - 2026-03-27 - Unknown action session visibility

- **RN notifications (Phase E):** Settings now tracks and displays a session-local counter for unknown reminder actions so long-tail runtime action drift is visible in-app.
- **UI depth:** unknown-action fallback text is now complemented by concrete session observation count (`Unknown reminder actions observed this session: N`).
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx permissions.test.ts RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.82 - 2026-03-27 - Dismiss capability runtime visibility

- **RN notifications (Phase E):** `ReminderCapabilities` now reports dismiss-action support and `SettingsScreen` surfaces it in the runtime support line (`dismiss semantics yes/no`) to clarify notification behaviour by runtime.
- **Safety alignment:** this visibility complements dismiss-action safe-ignore handling so users can see when explicit dismiss semantics are available.
- **Validation:** `npm run test:mobile -- permissions.test.ts SettingsScreen.test.tsx RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.81 - 2026-03-27 - Dismiss action safe-ignore policy

- **RN notifications (Phase E):** reminder response mapping now treats dismissed/close-style action identifiers as `none`, preventing unintended Home fallback routing from dismissal events.
- **Consistency:** `mapNotificationResponseToReminderAction(...)` now applies default + dismissed identifier handling across both last-response and live-listener paths.
- **Validation:** `npm run test:mobile -- permissions.test.ts RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.80 - 2026-03-27 - Snooze response action mapping

- **RN notifications (Phase E):** notification response mapping now includes snoozed reminder notifications so taps on snooze reminders route through the same open-app action semantics (`default`) rather than being dropped as non-reminder IDs.
- **Hardening:** action mapping is now centralized in `mapNotificationResponseToReminderAction(...)` and reused by both startup-response and live-listener paths.
- **Validation:** `npm run test:mobile -- permissions.test.ts RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.79 - 2026-03-27 - Reminder action identifier normalization

- **RN notifications (Phase E):** reminder action parsing now normalizes runtime identifier variants (case and separator differences) before semantic mapping, reducing accidental `unknown` classification for known actions.
- **Coverage:** added `apps/rn-app/src/permissions/permissions.test.ts` for normalization behaviour (`log-now`, `later`, `default`, `unknown`, `none`) across representative identifier forms.
- **Validation:** `npm run test:mobile -- permissions.test.ts RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.78 - 2026-03-27 - Documentation sync checkpoint

- **Plan freshness:** refreshed `docs/next-phase-development-plan.md` status rollup text so the Phase E notifications summary explicitly includes duplicate-action burst suppression in root routing.
- **Docs alignment:** synchronised `README.md`, `docs/app-and-features.md`, and `docs/platform-parity.md` to the same latest milestone pointer and parity wording.
- **Scope:** documentation/changelog update only (no runtime behaviour changes in this checkpoint).

### v1.45.77 - 2026-03-27 - Reminder action burst de-dup guard

- **RN notifications (Phase E):** `RootNavigator` now suppresses immediate duplicate reminder actions within a short window to avoid double-routing on noisy runtime response streams.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.
- **Plan sync:** Phase E notifications work-item now includes duplicate-action burst handling in the current-done baseline.

### v1.45.76 - 2026-03-27 - Reminder action policy visibility

- **RN notifications (Phase E):** Settings now includes explicit action-policy copy for reminder responses (`log-now`, `later`, `default`, `unknown`) so route/fallback behaviour is visible in-app.
- **Plan sync:** `docs/next-phase-development-plan.md` notifications work-item now reflects the current state (capability visibility + action policy copy + remaining long-tail OS parity).
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.75 - 2026-03-27 - Unknown reminder action handling policy

- **RN notifications (Phase E):** unknown reminder actions now explicitly follow safe Home routing behaviour in root action handling.
- **Status transparency:** Settings now surfaces unknown-action fallback guidance alongside reminder action status.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.74 - 2026-03-27 - Reminder status clarity + listener fallback copy

- **RN notifications (Phase E):** settings now normalizes reminder action labels for user-readable status (e.g., `default` -> `Open app`).
- **Runtime nuance messaging:** added explicit copy for runtimes without action listeners, clarifying that action status may update on next app open.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.73 - 2026-03-27 - Runtime-adaptive snooze settings

- **RN notifications (Phase E):** Settings now guards snooze interval adjustments behind runtime snooze capability support.
- **Fallback clarity:** when snooze scheduling is unsupported, the UI now shows an explicit fallback note that `later` actions open Home.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.72 - 2026-03-27 - Documentation checkpoint sync

- **Docs refresh:** synchronised plan, parity, and features docs to keep the latest notification semantics milestones clear and consistent.
- **Status clarity:** retained explicit open backlog callouts (remaining OS-specific notification long-tail behaviour, charts chrome/prediction parity, AI depth, goals UX depth, and list virtualization decision follow-through).
- **Release pointer:** updated README latest-changes reference to this checkpoint.

### v1.45.71 - 2026-03-27 - Notification runtime capability status

- **RN notifications (Phase E):** added runtime capability reporting (`schedule`, Android channel, iOS category, action listener) and surfaced it in Settings.
- **User clarity:** notification section now includes a compact capability status line so behaviour differences across runtimes are visible in-app.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx RootNavigator.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.70 - 2026-03-27 - Snooze fallback resilience

- **RN notifications (Phase E):** `later` reminder actions now fall back to app-home open behaviour when snooze scheduling cannot be created at runtime.
- **User visibility:** Settings notification help text now explains this fallback behaviour explicitly.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.69 - 2026-03-27 - Configurable snooze interval

- **RN notifications (Phase E):** reminder snooze duration is now user-configurable via Settings and persisted in preferences (`notifications.snoozeMinutes`).
- **Action routing integration:** the `later` reminder action now uses the configured snooze interval instead of a fixed value.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx preferences.test.ts` and `npm run typecheck:mobile` pass.

### v1.45.68 - 2026-03-27 - Default reminder action routing

- **RN notifications (Phase E):** default reminder tap actions are now explicitly treated as open-app/home intent in root navigation handling.
- **Action semantics:** reminder handling now distinguishes all three primary action paths: `log-now` (open wizard), `later` (snooze), and `default` (foreground app home).
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.67 - 2026-03-27 - Reminder snooze action increment

- **RN notifications (Phase E):** `later` reminder actions now trigger a short one-time snooze reminder scheduling attempt (runtime-supported path).
- **Action handling depth:** root action routing now distinguishes route intent (`log-now`) from snooze intent (`later`) while still consuming handled actions.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.66 - 2026-03-27 - Notification action consumption follow-up

- **RN notification handling (Phase E):** reminder actions are now explicitly treated as consumable events via `clearLastReminderAction()` after handling.
- **Loop prevention:** root navigation action handling now clears non-`none` response state to reduce stale/replay action loops on subsequent app resumes.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.65 - 2026-03-27 - Notification action routing increment

- **RN notification routing (Phase E):** `RootNavigator` now reacts to reminder action responses and routes `log-now` actions to `LogWizard`.
- **Safety + lifecycle:** action handling is gated through route-intent helper logic and listener cleanup, with initial response handling guarded against repeat startup loops.
- **Validation:** `npm run test:mobile -- RootNavigator.test.tsx SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.64 - 2026-03-27 - Notifications action-response baseline

- **RN notifications (Phase E):** added reminder response handling helpers (`getLastReminderAction`, `subscribeReminderActions`) to capture action semantics from notification interactions.
- **Settings parity depth:** notifications pane now shows the last reminder action received (e.g., `Log now`) to make response-path behaviour observable in-app.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.63 - 2026-03-27 - Notifications OS semantics expansion

- **RN notifications (Phase E):** daily reminder scheduling now configures iOS notification category actions when available, in addition to Android channels.
- **Delivery diagnostics:** schedule results now report richer runtime semantics (`scheduled-ios-category`, `scheduled-channel-and-category`) and Settings displays matching status copy.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.62 - 2026-03-27 - Notifications delivery semantics pass

- **RN notifications (Phase E):** `permissions.ts` now configures an Android reminder notification channel when supported and returns structured scheduling/delivery results instead of a plain boolean.
- **Settings visibility:** `SettingsScreen` now surfaces delivery semantics text (Android channel configured vs basic scheduling) alongside existing schedule status.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.61 - 2026-03-27 - Parity checkpoint docs sync

- **Docs rollup:** synchronised `next-phase-development-plan.md`, `platform-parity.md`, and `app-and-features.md` to reflect the current RN parity checkpoint after `v1.45.60`.
- **Scope clarity:** kept open backlog explicit (notifications channel/OS delivery semantics, FlashList decision/profile thresholds, remaining charts/AI/goals depth items).
- **Execution focus:** documented the next active implementation target as notifications channel/delivery semantics where runtime support exists.

### v1.45.60 - 2026-03-27 - View Logs virtualization hardening

- **RN View Logs (Phase G/F):** `LogsScreen` now uses adaptive `FlatList` tuning by dataset size, adds `getItemLayout` row hints, and keeps clipped-subview batching tuned for large histories.
- **Test coverage:** `LogsScreen.test.tsx` now asserts large-list virtualization props are applied in all-range mode.
- **Validation:** `npm run test:mobile -- LogsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.59 - 2026-03-27 - Notifications scheduling parity increment

- **RN notifications (Phase E):** `SettingsScreen` now attempts to schedule/cancel a daily local reminder when notification permission is granted and reminder preferences change (enable, HH:MM time, sound).
- **Runtime-safe implementation:** `permissions.ts` now probes optional `expo-notifications` dynamically and falls back gracefully when unavailable.
- **Validation:** `npm run test:mobile -- SettingsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.58 - 2026-03-27 - AI feature-depth copy alignment pass

- **RN AI parity (Phase C):** updated `AiScreen` section helper copy to align more closely with web panel tone for findings, trends, flare-up, correlations, and grouped movement blocks.
- **Analysis wording depth:** updated correlation phrasing in `analyzeLogs.ts` to web-like directional strength language (e.g. "strongly/usually/sometimes goes up/down when"), and tightened grouped-movement fallback copy.
- **Validation:** `npm run test:mobile -- AiScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.57 - 2026-03-27 - AI screen summary memoization and refresh isolation

- **RN AI performance hardening (Phase F):** `AiScreen` now stores fetched logs once per refresh and derives `summarizeLogsForAi` output via `useMemo(logs, range)` instead of recomputing inside the fetch path.
- **Rerender isolation:** summary-note generation is now in a dedicated effect keyed to summary/model settings, reducing unnecessary work during pull-to-refresh and state transitions.
- **Validation:** `npm run test:mobile -- AiScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.56 - 2026-03-27 - `app.config.js` Supabase env parity guard

- **CI unit-test fix:** ensured `apps/rn-app/app.config.js` includes shared Supabase env fallbacks (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, legacy `SUPABASE_ANON_KEY`) in addition to `EXPO_PUBLIC_SUPABASE_*`.
- **Failure addressed:** resolves `tests/unit/mobile-expo-config.test.mjs` assertion failure expecting shared env support in `npm run test:unit`.
- **Validation:** `npm run test:unit` passes locally.

### v1.45.55 - 2026-03-27 - `build:web:apk` path compatibility hardening

- **CI build fix (`prepare-minified-assets`):** hardened `apps/pwa-webapp/build-site.mjs` to resolve the web root across both current (`apps/pwa-webapp`) and legacy (`apps/web`, `web`) layouts.
- **Failure addressed:** prevents minified bundle failures where esbuild attempted to resolve a stale path like `apps/web/.trace-build/app.js`.
- **Validation:** `npm run build:web:apk` succeeds locally after the fix.

### v1.45.54 - 2026-03-27 - Charts motion polish (reduced-motion-aware)

- **RN Charts (Phase B polish):** `ChartsScreen` now uses conditional `LayoutAnimation` on view/range/refresh/data updates, with transitions automatically minimised when OS reduced-motion is enabled via `AccessibilityInfo`.
- **Accessibility parity increment:** added reduced-motion status copy in Charts to make animation behaviour explicit.
- **Validation:** `npm run test:mobile -- ChartsScreen.test.tsx` and `npm run typecheck:mobile` pass.

### v1.45.53 - 2026-03-27 - CI unit-tests path fix (`apps/pwa-webapp` + `apps/rn-app`)

- **Unit test fix:** updated legacy hardcoded paths in `tests/unit/app-functionality.test.mjs`, `tests/unit/async-storage-expo-plugin.test.mjs`, and `tests/unit/mobile-expo-config.test.mjs` from old `web/` and `apps/mobile/` locations to current `apps/pwa-webapp/` and `apps/rn-app/`.
- **Workflow impact:** resolves `ENOENT` failures in the `npm run test:unit` CI step in `.github/workflows/ci.yml`.
- **Validation:** local `npm run test:unit` passes with all tests green.

### v1.45.52 - 2026-03-27 - CI root install stability (prepare-minified-assets + unit-tests)

- **CI fix (`.github/workflows/ci.yml`):** regenerated root `package-lock.json` from current workspaces to remove stale lock metadata and stabilize root `npm ci` in both `prepare-minified-assets` and `unit-tests` jobs.
- **Failure pattern addressed:** GitHub Actions `EUSAGE` lock mismatch showing missing workspace package/dependency entries (`mobile`, `rianell-shell`, and RN dependency tree).
- **Validation:** local `npm ci` and `npm run test:unit` pass on the regenerated lockfile.

### v1.45.51 - 2026-03-27 - Unit-tests workflow install gate sync

- **CI fix (`unit-tests` / root install):** committed root and RN workspace manifest updates (`package.json`, `apps/rn-app/package.json`) so the existing root `package-lock.json` and workspace graph remain in sync for `npm ci`.
- **Failure resolved:** prevents GitHub Actions `EUSAGE` lock mismatch in runs that reported missing workspace packages (`mobile@1.0.0`, `rianell-shell@1.0.0`) and related RN dependencies.
- **Validation:** confirmed local `npm ci` succeeds on the synced workspace state.

### v1.45.50 - 2026-03-27 - Security-audit lockfile sync + docs update

- **CI dependency gate fix:** refreshed root `package-lock.json` so workspace manifests and lockfile are in sync, unblocking `npm ci --omit=dev` in `.github/workflows/security-audit.yml`.
- **Validation:** confirmed local parity with the workflow path (`npm ci --omit=dev` then `npm audit --audit-level=high --omit=dev`) and no high/critical vulnerabilities on the production tree.
- **Documentation sync:** updated `docs/next-phase-development-plan.md` with an explicit security-audit fix note and kept parity status text aligned across docs.

### v1.45.41 - 2026-03-27 - Documentation rollup for active RN parity track

- **Docs-only sync:** refreshed parity and scope wording across docs pages to match the active implementation track on RN.
- **AI/LLM parity status:** documented that RN has baseline `AIEngine`-style deterministic helpers and LLM wrapper hooks (summary/MOTD/suggest) with model-tier selection, while full web AI depth is still tracked as open parity work.
- **Demo + performance settings parity:** documented demo-mode lifecycle parity and benchmark-tier model selection parity as implemented, with benchmark-detail UI parity still in backlog.
- **Install UX scope:** reiterated that RN does not show in-app install/download buttons; install/download entry points remain web/PWA-facing.
- **Cross-doc alignment:** synchronised references between `README.md`, `docs/next-phase-development-plan.md`, `docs/app-and-features.md`, `docs/platform-parity.md`, and `docs/setup-and-usage.md`.

### v1.45.40 - 2026-03-27 - Docs sync: RN parity track + scope clarifications

- **Plan/docs alignment:** clarified RN parity status for **AIEngine + LLM hooks**, **demo mode**, **benchmark tier + model selection settings**, and **performance-settings backlog** in `docs/next-phase-development-plan.md`.
- **Product scope clarification:** RN keeps **install/download UX out of app settings** (already installed native app); install/download entry points stay web/PWA-facing.
- **Parity references:** refreshed cross-links in `README.md`, `docs/app-and-features.md`, and `docs/platform-parity.md` so parity expectations point to the active RN plan/changelog sections.

### v1.45.39 - 2026-03-27 - RN AIEngine + LLM parity baseline

- **RN AIEngine parity scaffold:** added `src/ai/engine.ts` with web-aligned helper surface for deterministic predictions and note generation (`predictFutureValues`, `suggestLogNote`, `generateAnalysisNote`).
- **RN LLM feature wiring:** added `src/ai/llm.ts` with model-tier resolution (`preferredLlmModelSize` + benchmark), optional remote endpoint support (`EXPO_PUBLIC_LLM_ENDPOINT` / `LLM_ENDPOINT`), cache/timeout handling, and fallback for **summary note**, **suggest note**, and **MOTD**.
- **UI parity increment:** `AiScreen` now renders a generated **Summary note**; Home card now shows MOTD from LLM wrapper (fallback-safe) while preserving existing deterministic analysis blocks.
- **Tests/config/docs:** added `engine.test.ts` and `llm.test.ts`, updated screen tests for AI/Home integration, and extended RN env/app config extras for LLM endpoint plumbing.

### v1.45.38 - 2026-03-27 - RN demo mode parity toggle

- **RN demo mode:** added Settings toggle that ports demo-mode behaviour intent from web/Capacitor by loading a rebased premade sample history, refreshing demo logs on app launch, and restoring backed-up user logs when disabled.
- **RN data safeguards:** import/export actions are blocked while demo mode is active (demo data is treated as disposable showcase data).
- **Tests/docs:** added `src/demo/demoMode.test.ts`, extended preferences/settings tests, and updated parity plan notes for demo-mode progress.

### v1.45.37 - 2026-03-27 - RN removes in-app install/download buttons

- **RN Settings scope:** removed in-app **Install & downloads** buttons from `SettingsScreen` (native app is already installed; install UX stays on web/PWA surfaces).
- **Tests/docs:** updated Settings screen tests and next-phase plan language to reflect Data-only pane and product scope decision.

### v1.45.36 - 2026-03-27 - RN benchmark tiers + model selection settings parity

- **RN performance benchmark:** added `src/performance/benchmark.ts` with cached local benchmark result, tier classification (1-5), device class, and recommended model tier.
- **RN settings parity:** `SettingsScreen` now includes a **Performance** section with on-device model selection (`recommended`/`tier1..tier5`), benchmark run button, and cache-clear action.
- **Preferences parity plumbing:** added `performance.preferredLlmModelSize` to RN preferences persistence and defaults.
- **Tests/docs:** added `benchmark.test.ts` and updated parity plan notes in `docs/next-phase-development-plan.md`.

### v1.45.35 - 2026-03-27 - RN boot loading screen parity scaffold

- **RN loading screen:** added `apps/rn-app/src/components/BootLoadingScreen.tsx` and wired it in `App.tsx` while preferences load, replacing the blank boot view.
- **Parity intent:** loader uses tokenized colors plus animated orbit/sun drawn objects to mirror web/Capacitor loading motif; marked as in-progress for exact burst/flood transition and reduced-motion parity.
- **Plan docs:** updated `docs/next-phase-development-plan.md` to explicitly track loading-screen parity work under motion/animation and Phase E backlog.

### v1.45.34 - 2026-03-27 - Expo bundle workflow path/autolinking fix

- **CI / expo-bundle-prod:** run Expo export directly from `apps/rn-app` (not legacy `apps/mobile`) and verify `expo-modules-autolinking` presence to avoid `Cannot find module 'expo-modules-autolinking/exports'` regressions.
- **RN dependency:** `apps/rn-app/package.json` now includes `expo-modules-autolinking` explicitly.
- **Guards:** added `tests/unit/package-scripts-mobile-path.test.mjs` and extended `tests/unit/workflows-ci-rncli.test.mjs` to lock path + export command expectations.

### v1.45.33 - 2026-03-27 - RN modal parity: bug report + logs detail modal

- **Home modal parity:** added in-app RN **Bug report modal** with submit + fallback to SECURITY doc on failure.
- **View Logs modal parity track:** added RN **entry detail modal** with share/delete actions from each row, plus text-filter/range/sort baseline already landed.
- **Plan/docs:** updated `docs/next-phase-development-plan.md` with modal parity progress and remaining gaps (edit flow parity, remaining web-only modal surfaces).

### v1.45.32 - 2026-03-27 - RN bug report modal parity + plan updates

- **Modal parity (Home):** replaced the RN `SECURITY.md` shortcut with an in-app **Bug report modal** (title/description/steps/expected/actual), including submit-to-endpoint flow and fallback action to open security docs if submission fails.
- **Tests:** extended `HomeScreen.test.tsx` to verify bug modal open + submit path.
- **Plan/docs:** updated `docs/next-phase-development-plan.md` to mark bug-report modal parity as landed and keep remaining modal backlog explicit.

### v1.45.31 - 2026-03-27 - RN View Logs text filter + Supabase source parity

- **Mobile / View Logs (Phase G):** added text filter on `LogsScreen` (notes/symptoms/stressors/date/flare match), with updated count semantics and focused Jest coverage.
- **Supabase env parity:** RN now resolves Supabase credentials from the same shared names used by web/Capacitor (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, legacy `SUPABASE_ANON_KEY`) while keeping `EXPO_PUBLIC_SUPABASE_*` support.
- **CI + docs/tests:** RN bundle/prebuild workflow env updated to use shared Supabase secrets; docs updated (`next-phase-development-plan.md`, `setup-and-usage.md`, `.env.example`, `README.md`) and unit tests extended for config/workflow guards.

### v1.45.30 - 2026-03-27 - RN Supabase env/source parity with web/Capacitor

- **RN config plumbing:** `apps/rn-app/app.config.js` now resolves Supabase credentials from both Expo-specific vars (`EXPO_PUBLIC_SUPABASE_*`) and shared vars used by web/Capacitor (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, legacy `SUPABASE_ANON_KEY`).
- **CI:** RN bundle and RN CLI prebuild jobs in `.github/workflows/ci.yml` now pass the same `SUPABASE_*` secrets already used by Pages/Capacitor config injection.
- **Docs/tests:** updated `apps/rn-app/.env.example`, `SettingsCloudPane` hint/tests, `tests/unit/mobile-expo-config.test.mjs`, and Supabase notes in `docs/next-phase-development-plan.md` + `docs/setup-and-usage.md`.

### v1.45.29 - 2026-03-27 - RN View Logs Phase G + docs sync

- **Mobile / View Logs (Phase G):** `LogsScreen` now includes **date-range presets** (Today / 7 / 30 / 90 / All), **Newest/Oldest** sort, **pull-to-refresh**, and a filtered/total count line ("Showing *n* of *m* entries").
- **Tests:** Added `logsViewHelpers.test.ts`; updated `LogsScreen.test.tsx` for range-aware dates, empty-state copy, and dev sample log behaviour; fixed sort chip spacing for broader RN compatibility.
- **Docs:** Updated **`docs/next-phase-development-plan.md`** (§4.2, §4.3, Phase G), plus pointers in `README.md`, `docs/app-and-features.md`, and `docs/platform-parity.md`.

### v1.45.28 - 2026-03-27 - CI: fix RN CLI Android APK collection path

- **`rncli-android-apk`:** **Collect APK + latest.json** globs **`apps/rn-app/android/app/build/outputs/apk/debug/*.apk`** (default job `cwd` is repo root). Previously used `app/build/...` as if the shell ran inside `android/`, so **`assembleDebug`** succeeded but the copy step found **no APKs**.
- **Tests:** `tests/unit/workflows-ci-rncli.test.mjs` asserts the glob path.
- **Docs:** **`docs/next-phase-development-plan.md`** §6.

### v1.45.27 - 2026-03-27 - Platform folder names and path plumbing

- **Renames:** `web/` → **`apps/pwa-webapp/`** (static PWA, GitHub Pages parity reference); `apps/mobile/` → **`apps/rn-app/`** (React Native / Expo); `react-app/` → **`apps/capacitor-app/`** (legacy Vite + Capacitor).
- **Workspaces:** root **`package.json`** now lists **`apps/*`** and **`packages/*`** only (no top-level `react-app` entry).
- **Build & tooling:** `build-site.mjs`, `copy-webapp.js`, `prepare-android-assets.mjs`, icon scripts, **`smoke-function-trace`**, **`check-platform-parity`**, Python **`server/`** default **`WEB_DIR`**, **`launch-server.ps1`**, **`.gitignore`**, **`.github/workflows`**, and **`tests/unit`** paths updated.
- **Docs:** **`docs/next-phase-development-plan.md`** §1–2, §6; **`README`**, **`docs/app-and-features.md`**, **`docs/setup-and-usage.md`**, **`docs/project-reference.md`**, **`docs/platform-parity.md`**.

### v1.45.26 - 2026-03-27 - React Native Home: top chrome buttons (web / Capacitor parity)

- **Web reference:** `web/index.html` **`.header-buttons-wrap`** — **Goals & targets** (bullseye), **Report a bug** (`?`), **Settings** (cog).
- **Mobile (`HomeScreen`):** top-right row of three **44×44** chrome buttons (accent border + glow shadow): **Targets** → **`Charts`** tab with **`{ initialView: 'balance' }`**; **?** → **`Linking.openURL`** to repo **`docs/SECURITY.md`** (in-app bug modal deferred to Phase E); **Settings** → **Settings** tab.
- **Navigation:** **`MainTabParamList`** exported from **`RootNavigator`**; **`Charts`** accepts optional **`initialView`** (`ChartViewMode`); **`ChartsScreen`** syncs view from **`route.params`**.
- **Tests:** `HomeScreen.test.tsx` (header actions + FAB); **`ChartsScreen.test.tsx`** mocks **`useRoute`** for Jest without a navigator.
- **Docs:** **`docs/next-phase-development-plan.md`** §4.3, §5 Phase E; **`docs/app-and-features.md`**, **`docs/platform-parity.md`**, **`README.md`**.

### v1.45.25 - 2026-03-27 - npm overrides, Dependabot/tar fix, single lockfile, RN shell polish

- **Supply chain / npm (repo root):**
  - **`package.json` `overrides`:** patched **`tar`**, **`handlebars`**, **`brace-expansion`** / **`minimatch`**, **`http-proxy-agent`**, **`@tootallnate/once`**, **`semver`**, **`send`**, **`replace.minimatch`**; **`@capacitor/assets` → `@capacitor/cli` via `$@capacitor/cli`** with root devDependency **`@capacitor/cli@7.6.1`** so assets no longer pull **CLI 5.x + `tar@6`**.
  - **Single `package-lock.json`:** removed nested **`react-app/package-lock.json`** and **`apps/mobile/package-lock.json`** (workspaces use root lock only; reduces duplicate Dependabot noise).
  - **`npm audit --omit=dev`:** **0** vulnerabilities on the production tree (CI gate). Full `npm audit` may still list **moderate** dev-only paths (Jest / RN tooling) until upstream bumps.
- **CI / workflows:**
  - **`.github/workflows/security-audit.yml`:** one step — **`npm ci --omit=dev && npm audit --audit-level=high --omit=dev`**; `setup-node` cache path **`package-lock.json`** at repo root.
  - **`.github/workflows/ci.yml`:** removed redundant **`npm ci`** under **`react-app`** (root **`npm ci`** installs all workspaces).
- **Mobile (`apps/mobile`):**
  - **Explicit deps** for hoisted installs: **`jest`**, **`@react-navigation/core`**, **`babel-preset-expo`**, **`stacktrace-js`**, **`@ungap/structured-clone`**, **`react-freeze`**, **`warn-once`**.
  - **Shell UX:** tab **labels** + **`headerShown: false`** on tabs; **`useBottomTabBarHeight()`** + **Beta** chip on Home FAB; **Charts → Balance** **Targets** snapshot (default **7/10** line + marker; web Goals persistence → Phase E).
  - **`RootNavigator`:** **`TabBarIconProps`** for strict TypeScript on tab icons.
- **Docs:** **`docs/next-phase-development-plan.md`** §6 (dependency & supply chain); **`docs/SECURITY.md`** (npm audits); **`README.md`**, **`docs/app-and-features.md`**, **`docs/platform-parity.md`** pointers.

### v1.45.24 - 2026-03-26 - Mobile: tab icons, settings slides, Supabase auth

- **Navigation (`RootNavigator`):** **`@expo/vector-icons` / Ionicons** for bottom tabs (home, list, charts, sparkles, settings).
- **Settings:** horizontal **carousel** (web-style): pane tabs + prev/next + dots; panes **Personal & cloud** ( **`SettingsCloudPane`** ), **AI & theme**, **Accessibility**, **Data & install**.
- **Cloud login:** **`@supabase/supabase-js`** + **`expo-constants`**; **`apps/mobile/app.config.js`** exposes **`EXPO_PUBLIC_SUPABASE_URL`** / **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**; **`src/cloud/supabaseClient.ts`**; sign-in / sign-up / sign-out when configured; hint when unset. **`apps/mobile/.env.example`**; **`.gitignore`** includes **`.env`**.
- **Tests:** `SettingsScreen.test.tsx` (carousel navigation), `SettingsCloudPane.test.tsx`, `supabaseClient.test.ts`; **`jest.setup.ts`** mocks **`expo-constants`** + Ionicons; **`tests/unit/mobile-expo-config.test.mjs`** asserts **`app.config.js`**.
- **Docs:** **`docs/next-phase-development-plan.md`** §2, §4.3, Phase E.

### v1.45.23 - 2026-03-26 - Docs + tests: shell parity, CI testing strategy, HomeScreen

- **Docs**:
  - **`docs/next-phase-development-plan.md`**: §**4.3** Shell UX parity (Home, nav, themes/fonts, settings gaps: bug report, goals, LLM); **Phase E** (shell) and **Phase F** (performance); **§6** Testing strategy (Jest + Node unit + CI matrix); §**7** tests agreement.
- **Tests**:
  - **`apps/mobile/src/screens/HomeScreen.test.tsx`**: title, today status, FAB → `LogWizard`.
  - **`tests/unit/mobile-expo-config.test.mjs`**: `app.json` registers **`withAsyncStorageLocalRepo`**; plugin source contains **`shared_storage`** marker.
- **Mobile**: **`RootNavigator.test.tsx`**: AI tab visible when **`aiEnabled`** default true.

### v1.45.22 - 2026-03-26 - Mobile Android: Async Storage v3 Gradle fix

- **Mobile / CI**:
  - **`@react-native-async-storage/async-storage` v3** requires **`org.asyncstorage.shared_storage:storage-android`** from the package’s **`android/local_repo`** (not Maven Central alone).
  - **`apps/mobile/plugins/withAsyncStorageLocalRepo.js`**: Expo config plugin injects `maven { url "${rootDir}/../node_modules/@react-native-async-storage/async-storage/android/local_repo" }` into root **`android/build.gradle`** (after `jitpack`).
  - **`app.json`**: registered **`plugins`** entry for the plugin; **`android.package`** set by prebuild for reproducible native IDs.
- **Docs**: **`docs/next-phase-development-plan.md`** §2 + §6 (CI gate note).

### v1.45.21 - 2026-03-26 - README CI tables + RN build sequence

- **README / `scripts/update-readme-build-info.mjs`**:
  - **CI builds** table: **Alpha** React Native CLI **Android APK** and **iOS** zip (from `App build/RNCLI-Android/` and `App build/iOS/`), plus Server + Web rows.
  - **Legacy builds** table: Capacitor **Android** + **iOS** metadata under `App build/Android/` and **`App build/Legacy/Capacitor-iOS/`** (frozen last Capacitor iOS manifest).
- **CI (`.github/workflows/ci.yml`)**:
  - **`rn-build-version`**: bumps a **sequential RN build** (1, 2, 3…) from `App build/RNCLI-Android/latest.json`; **`rncli-android-apk`** / **`rncli-ios-zip`** use it for `latest.json` and zip names (no longer `GITHUB_RUN_NUMBER` for RN artifacts).
  - **`publish-release`**: legacy release assets use **`App build/Legacy/Capacitor-iOS/`** instead of treating **`App build/iOS/`** as Capacitor.
- **App build**: removed checked-in **`App build/iOS/latest.json`** until the next mobile CI run repopulates RN iOS; legacy iOS tracker moved to **`App build/Legacy/Capacitor-iOS/latest.json`**.
- **Tests**: `tests/unit/workflows-ci-rncli.test.mjs` asserts **`rn-build-version`** wiring.

### v1.45.20 - 2026-03-26 - Documentation: next-phase plan (B/C steps)

- **Docs**:
  - **`docs/next-phase-development-plan.md`**: §4.1 clarifies **Charts** lite parity vs **Apex-class** visual work; **AI** points at `AiScreen` / `analyzeLogs.ts`. **Phase B** adds **Done when (lite)** + ordered **Next steps (visual)** (library spike → combined → individual → balance → polish). **Phase C** adds explicit work items (lite done, copy + feature parity + `aiEnabled` remaining).

### v1.45.19 - 2026-03-26 - Documentation: app-and-features Charts (RN Phase B)

- **Docs**:
  - **`docs/app-and-features.md`**: Split **React Native** copy into **Log today wizard** vs **Charts & AI (Phase B)**; document range a11y, spark bars, web hex colors, and value/delta formatting aligned with web.
  - **`README.md`**: Latest changes pointer.

### v1.45.18 - 2026-03-27 - Mobile Charts (Phase B) metric colors

- **Mobile / Charts**:
  - **`CHART_METRIC_HEX`** in `summarizeCharts.ts` (mood/sleep/fatigue/steps/hydration — same hex as web combined charts).
  - **Mini spark bars** use per-metric colors; **trend rows** get a **3px left border** in the same color.
  - Unit test for `CHART_METRIC_HEX` keys.
- **Docs**:
  - **`docs/next-phase-development-plan.md`**: Phase B work items + §4.1.

### v1.45.17 - 2026-03-27 - Mobile Charts (Phase B) value/delta formatting

- **Mobile / Charts**:
  - **`formatChartMetricValue`** / **`formatChartMetricDelta`** in `summarizeCharts.ts`: **steps** use rounded integers + `toLocaleString()`; **hydration** use `X.X glasses` (aligned with `web/app.js` chart helpers); mood/sleep/fatigue stay one decimal.
  - **`ChartsScreen`** uses these formatters for avg/current/delta lines.
  - Unit tests in `summarizeCharts.test.ts`.
- **Docs**:
  - **`docs/next-phase-development-plan.md`**: Phase B work items + §4.1 Charts line; marks Phase B as **active**.

### v1.45.16 - 2026-03-27 - CI: RN CLI Android job (setup-java)

- **CI / `.github/workflows/ci.yml`**:
  - **`rncli-android-apk`**: Removed **`cache: gradle`** from `actions/setup-java@v4`. The Gradle wrapper only exists **after** `npx expo prebuild`, so the cache step had no matching files at checkout and failed the job.
- **Tests**:
  - **`tests/unit/workflows-ci-rncli.test.mjs`**: Asserts `ci.yml` does not reintroduce `cache: gradle` (regression guard).

### v1.45.15 - 2026-03-27 - Charts tab accessibility (Phase B)

- **Mobile / Charts**:
  - **Range** chips: `accessibilityLabel` (`Charts date range N days` / `all time`), **`accessibilityState.selected`**.
  - **View** chips: **`accessibilityState.selected`** (labels already present).
  - **`ChartsScreen.test.tsx`**: asserts range + view labels.
- **Docs**:
  - **`docs/next-phase-development-plan.md`**: §4.1 Charts line updated.

### v1.45.14 - 2026-03-27 - Documentation sync

- **Docs**:
  - **`docs/app-and-features.md`**: New **React Native — Log today wizard** paragraph (steps, pain diagram / web outline, energy tiles, Charts/AI, test commands); **Project structure** expanded for `apps/mobile/`.
  - **`docs/about-and-support.md`**: Replaced stale version-stamped block with **documentation pointers** (next-phase plan, app-and-features, mobile issue hints).
  - **`docs/next-phase-development-plan.md`**: Last-updated line.
- **README.md**: “Latest changes” line aligned with this release.

### v1.45.13 - 2026-03-27 - Log wizard pain diagram (Step 3) visual parity

- **Mobile / Log wizard (Phase A — Step 3)**:
  - Pain diagram uses the **same outline path** as web (`web/index.html`), **viewBox 0 0 140 280**, and **vertical scale** on interactive regions so the figure fills the canvas; **accessibilityHint** on the diagram container.
- **Docs**:
  - **`docs/next-phase-development-plan.md`**: Step 3 checklist + Phase A work item updated.

### v1.45.12 - 2026-03-27 - Energy step parity polish + AI refresh test

- **Mobile / Log wizard (Phase A — Step 4)**:
  - **Energy & mental clarity**: short helper line under the title; **accessibility labels** on fatigue, sleep, and mood fields; **thicker group-colored border** when an energy tile is selected.
- **Mobile / AI Analysis (Phase C)**:
  - Range chips: **`accessibilityLabel`** + **`accessibilityState.selected`**.
  - **`AiScreen.test.tsx`**: pull-to-refresh triggers a second `loadLogs` call.
- **Docs**:
  - **`docs/next-phase-development-plan.md`**: Steps **4.1 / 4.2** and Phase A Step 4 work item updated.

### v1.45.11 - 2026-03-27 - Plan sync (wizard 6–9) + Charts test

- **Docs**:
  - **`docs/next-phase-development-plan.md`**: Section **4.2** marks Log wizard **steps 6–9** complete (lifestyle clamp-on-save, food/exercise/meds clear-all + count badges; covered by `LogWizardScreen.test.tsx`). Section **4.1** Charts line clarifies what is implemented vs Apex/visual parity. Phase A work items updated for steps 6–9.
- **Mobile / Charts (Phase B)**:
  - **`ChartsScreen.test.tsx`**: Asserts **pull-to-refresh** triggers a second `loadLogs` call.

### v1.45.10 - 2026-03-27 - Documentation sync

- **Docs**:
  - **README.md**: “Latest changes” line aligned with changelog (native Settings data management + install/download parity).
  - **app-and-features.md**: Documented React Native (`apps/mobile`) Settings **Data management** (JSON export/import, merge/replace) and **Install & downloads** (same public `latest.json` resolution as web, opens in system browser); **Project structure** lists `apps/mobile/`.
  - **next-phase-development-plan.md**: Repo state updated to record completed native Settings parity (Phase D); Phase D status line; clarified manifest wording (avoid ambiguous glob in prose).

### v1.45.9 - 2026-03-27 - Settings install & downloads (native)

- **Mobile / Settings (Phase D)**:
  - **Install & downloads**: fetches the same public `latest.json` manifests as web Settings (rianell.com) and opens the resolved APK / iOS zip URL via the system browser.
  - Added `buildDownloads.ts` + unit tests.
- **Docs**:
  - Updated `docs/next-phase-development-plan.md` Phase D checklist.

### v1.45.8 - 2026-03-27 - Settings data management (native)

- **Mobile / Settings (Phase D)**:
  - **Data management**: export logs as JSON via the system share sheet; import from pasted JSON with **merge** (new dates only) or **replace all** (with confirmation).
  - Added `logExportImport.ts` helpers + unit tests; `SettingsScreen` section replaces the old parity placeholder.
- **Docs**:
  - Updated `docs/next-phase-development-plan.md` Phase D progress.

### v1.45.7 - 2026-03-27 - Charts empty state (no data in range)

- **Mobile / Charts**:
  - When the selected range has **no log entries**, Charts shows a single **empty-state** message instead of five zero-point metric rows.
  - Added `ChartsScreen.test.tsx` for the empty state.

### v1.45.6 - 2026-03-26 - Charts Balance view metric filtering

- **Mobile / Charts (Phase B)**:
  - **Balance** view now lists only **mood, sleep, and fatigue** trends (aligned with web balance chart excluding steps/hydration from the balance summary list).
  - Added `filterTrendsForChartView` in `summarizeCharts.ts` with unit tests; refreshed Charts screen copy per view mode.
- **Docs**:
  - Deduplicated checklist lines in `docs/next-phase-development-plan.md` and noted Charts progress.

### v1.45.5 - 2026-03-26 - RN CLI artifacts + Log wizard parity polish

- **CI / Release (native mobile)**:
  - Removed token-gated EAS binaries and switched to **React Native CLI** artifact generation in CI (Android APK + iOS emulator Xcode project zip) using `expo prebuild` + native toolchains.
  - Added a small unit test to prevent accidental removal of RN CLI jobs from the release pipeline.
- **Mobile / Log wizard parity (Phase A)**:
  - **Stress & triggers**: grouped picker + search + collapsible section + selected/clear parity.
  - **Symptoms & pain**: introduced a tap-to-cycle body diagram, aligned semantics to **good / discomfort / pain**, and added “Use diagram text”.
  - **Energy & mental clarity**: added collapsible tile picker and icon tiles, plus group-colored tile borders.
  - **Steps 6–9 UX**: added clear-all controls (food/exercise/meds), count-badge clear affordance shown at **1+**, and tests to lock these behaviours in.
- **Docs**:
  - Updated `docs/next-phase-development-plan.md` with Phase A progress notes.

### v1.45.4 - 2026-03-26 - CI/security hardening + Expo parity UX updates

- **CI / Security**:
  - Hardened `security-audit.yml` by running npm audits with `--omit=dev` to avoid legacy Capacitor-only dev transitive vulnerabilities failing the high-severity gate.
- **CI / Release**:
  - Added `eas-native-binaries-prod` to `ci.yml` to build Expo iOS + Android production binaries via EAS and include them in GitHub Release assets.
- **Mobile / Parity**:
  - Improved Log today wizard step parity (energy/stressors and lifestyle sub-steps) and added clear-all controls for selected symptoms/stressors.
  - Added Charts view toggle (`Balance / Individual / Combined`) UI parity control.
- **Docs**:
  - Updated `docs/next-phase-development-plan.md` with the latest parity checklist progress.

### v1.45.3 - 2026-03-24 - Expanded app functionality unit tests

- **Tests / Unit coverage**:
  - Expanded `tests/unit/app-functionality.test.mjs` with behaviour assertions for:
    - in-place theme switching (no forced reload in `setGlobalTheme`),
    - Home-only MOTD title/quote guards,
    - voice input permission gate flow wiring,
    - settings hint copy for live theme apply,
    - CSS contracts for textarea mic icon centering and single-row settings icon rail.
- **Docs**:
  - Updated docs pages to include the expanded unit-test scope and command usage.

### v1.45.2 - 2026-03-24 - CI unit tests for app functionality

- **CI / Workflow**:
  - Added a dedicated `unit-tests` job to `.github/workflows/ci.yml`.
  - New test path runs `npm run test:unit` on push and pull requests.
  - Android, iOS, Server EXE, and Pages deploy jobs now depend on unit-test success.
- **Tests / App functionality**:
  - Added Node unit tests (`tests/unit/app-functionality.test.mjs`) to verify core app wiring:
    - bug report modal ids and launch binding,
    - supported global theme options,
    - presence of key runtime hooks (theme switch, MOTD title update, bug-report submit, voice input init).
  - Added root script `test:unit` in `package.json`.

### v1.45.1 - 2026-03-24 - Theme switch UX + mobile settings alignment

- **Web / Theme switching**:
  - Removed forced page reload on global theme change.
  - Theme now applies instantly in-place (background update) without restarting the app shell.
  - Updated settings helper text to describe live apply behaviour.
- **Web / Settings (mobile)**:
  - Fixed settings section icon row wrapping where the last icon could drop onto a second line on narrow screens.
  - Header icon strip now remains a single row and allows horizontal overflow scroll when needed.
- **Web / MOTD visibility**:
  - Dashboard quote rendering now stays scoped to the Home tab only.
  - Non-Home tabs consistently show the base app title without carrying MOTD text.

### v1.45.0 - 2026-03-24 - Bug reports, STT permissions, and theme cleanup

- **Bug report pipeline (web + server + Supabase)**:
  - Added a new top-right **`?`** bug report entry button (alongside Targets and Settings) with shared chrome/theme styling.
  - Added a dedicated bug report modal with structured fields and submit flow.
  - Added console snapshot capture on submit (bounded client buffer of recent `console.log/info/warn/error` lines), stored in bug report payload as `console_output`.
  - Added server endpoint **`POST /api/bug-report`** with validation and Supabase insert into `public.bug_reports`.
  - Added per-IP rate limiting for bug report submissions: **5 requests / 24h**.
  - Updated Supabase schema (`supabase/Schema.sql`) with `public.bug_reports` table including `console_output`, metadata, timestamps, and primary key.
- **Theme parity / visual consistency**:
  - Reworked **rainbow** theme tokens to be genuinely multicolour/flashy instead of blue-dominant accents.
  - Removed hardcoded notification permission status colors and migrated to theme-driven state classes.
  - Removed remaining hardcoded install-surface accents so install hints/buttons respect active theme tokens.
- **Speech-to-text (STT) reliability**:
  - Voice input now requests/checks microphone permission before starting recognition.
  - Added fallback permission handling across browser APIs and optional Capacitor/community speech plugin permission methods when present.
  - Improved user-facing errors for denied permission, unsupported engines/webviews, and missing microphone capture states.

### v1.44.2 - 2026-03-24 - Theme parity and settings/navigation polish

- **Web / Theming parity**:
  - Removed remaining hardcoded mint accents from key flows so selected global themes apply consistently (including **mono**).
  - ECG pulse, active navbar tabs, goals/targets progress block, loading overlay ring/accent layers, and chart empty-state/tooling accents now follow theme tokens.
  - Added early theme bootstrapping in `index.html` so loading overlay uses the saved theme before app init completes.
- **Web / Settings UX**:
  - Replaced settings carousel dots with clickable **mini icon** indicators per section.
  - Mini icons now support direct jump-to-section navigation from the settings header area.
- **Web / Cloud sync**:
  - Expanded cloud settings payload to include user settings stored outside `rianellSettings` (for example tutorial/special toggles and feature flags), so settings round-trip more completely across devices.
  - Added restore path for those extra keys on cloud load.
- **Web / MOTD title styling**:
  - Updated MOTD quote/title rendering to a **single-tone** theme colour with stronger layered 3D depth/extrusion and cleaner readability.

### v1.44.1 - 2026-03-24 - AI summary reliability and orbit-ring water flow polish

- **Web / AI Analysis**:
  - Fixed a Summary note edge case where the note could stay on **"Generating summary..."** if the LLM promise never resolved.
  - Added request-staleness guards and timeout-based fallback so Summary note always returns to a valid value (LLM text when available, otherwise rule-based note).
- **Web / Loading overlay**:
  - Loading orbit ring arc now uses animated layered conic gradients to create a **flowing water** motion while still filling to 100% via `--loading-progress`.
  - `prefers-reduced-motion` handling keeps decorative ring flow disabled for accessibility.
- **Web / God mode**:
  - Function trace toggle now uses a theme-matched switch control style for visual consistency with the rest of the mint UI.

### v1.44.0 - 2026-03-24 - PyQt6 tinker, server EXE release path, icon + loader refresh

- **Server / Tinker dashboard (PyQt6)**:
  - Rebuilt the dashboard from Tkinter to **PyQt6** with modern dark mint styling.
  - Preserved existing controls/actions (server status, watchdog controls, Supabase tools, DB viewer, logs).
  - Database viewer now uses Qt table multi-select with selection count and Ctrl+A handling.
  - Log pane rendering changed so only bracket tags (`[INFO]`, `[ERROR]`, etc.) are color-highlighted while the rest of each line remains default text color.
  - Fixed Qt key handling crash (`QKeyEvent.StandardKey` -> `QKeySequence.StandardKey`).
- **CI / Release**:
  - Added a dedicated Windows **PyInstaller** server binary path in CI.
  - Server EXE artifacts are now prepared and included in GitHub release assets.
  - README build-info generator now supports a **Server** build channel by reading `App build/Server/latest.json`.
- **Icons / Branding**:
  - Added `scripts/generate-icon-set.mjs` and `npm run icons:generate` to regenerate base icon sizes from a single source image.
  - Regenerated base and beta icon sets from a new source image.
  - Beta icon badge updated to **theme green** and moved to the **top-right** corner.
  - Floating `+` beta tag (`.app-beta-badge`) updated to the same green theme palette.
- **Web / Loading overlay**:
  - Removed the old straight fluid progress bar.
  - Loading progress now uses the **planet orbit ring** as a curved progress arc (circular progress around the planet).
  - Benchmark and startup loading progress updates now drive the orbit-ring progress element and ARIA values.

### v1.43.0 - 2026-03-24 - Loader swirl, log review UX, tinker refresh

- **Web / Loading overlay**: Orbit widget is larger; small orbit dot glow refined; main planet now shows a visible liquid-style swirl/wobble animation. `prefers-reduced-motion` disables decorative liquid sub-animations.
- **Web / Log wizard**:
  - **Skip** on optional steps now clears that step’s inputs/items first, then advances (discard-on-skip behaviour).
  - Step 10 **Review** changed from a dense line list to section cards with friendlier labels, optional empty-state hints, and improved mobile readability.
- **Web / AI Analysis (mobile)**: Pain-by-body-part table now fits slide width on narrow screens (no sideways inner scroll for the card); responsive column sizing and badge scaling.
- **Web / Goals**: Default targets (only when user has never saved goals) are now **10,000 steps**, **9 glasses hydration**, **sleep score 5**, **3 good days/week**.
- **Server / Tinker dashboard**:
  - Updated visual styling to a darker mint-accent theme.
  - Added button icons for key actions.
  - Database viewer keeps multi-row selection (`extended`) and now includes explicit **Ctrl/Shift + Ctrl+A** guidance and select-all shortcut binding.
  - Server log pane now applies full-line colour by severity (console-like), with token highlighting layered on top.
- **Docs**: README, styling guide, and security notes updated for these behaviours.

### v1.42.0 - 2026-03-23 - Settings modal, tile pickers, AI swipe cue, tutorial, docs

- **Web / Settings**: Modal uses **shared surface tokens** (`--modal-surface`, `--surface-border`, `--surface-outer-glow`) instead of a separate blue-grey panel and heavy neon-only glow; header and close button align with **button chrome** tokens. **Carousel** panes use **`contain: paint`**, **`min-width: 0`**, **`overflow-x: clip`** on the viewport, and **`visibility: hidden`** on **`[aria-hidden="true"]`** panes so the next section’s copy does not bleed at the edge.
- **Web / Settings copy layout**: **`.settings-hint`** is **left-aligned** (no right-aligned body text). Rows that are helper-only (no toggle) use a **column** layout via **`.settings-option-with-hint:not(:has(.toggle-switch))`**. Toggle rows get **gap**, **`min-width: 0`**, and **`flex-shrink: 0`** on switches so labels do not crush controls.
- **Web / Log & tile pickers**: Symptom / energy / stressor modal triggers use **pill** layout (icon + label + chevron), not full-width bars (see **`docs/styling.md`**).
- **Web / AI Analysis (mobile)**: **Card-edge peek** (narrower panes + gap) and a **dot row** under the track signal multiple slides without instructional copy. **Scroll index** uses pane geometry (`aiMobilePagerGetActiveIndexFromScroll`) so height sync and chrome stay correct when panes are not full width. Optional **first-visit shimmer** only (no chevrons); dismiss on scroll or timeout; **`localStorage`** `healthApp_aiSwipeCueSeen`; **`prefers-reduced-motion`**; hidden **≥ 769px** where **‹ ›** apply.
- **Web / Tutorial**: Removed bottom **step dots**; navigation remains **‹ ›**, swipe, and keyboard.
- **Docs**: New **[styling.md](styling.md)**; **[README.md](../README.md)** and **[project-reference.md](project-reference.md)** updated. **`styles.css` / `app.js` `?v=`** bumps in **`index.html`** as shipped.
- **Build**: **`npm run build:web`** after **`app.js`** changes; refresh **`web/app.min.js`** for releases.

### v1.41.0 - 2026-03-23 - AI analysis, Settings carousel, a11y, copy

- **Web / AI Analysis**: **At a glance** plain-language strip above dense results; section **intros**; **Typical / Latest / Outlook** labels and **visible status chips** (not colour-only) on trend cards; **aria** improvements (regions, list semantics, correlation expanders as **buttons** with `aria-expanded`, pain table **caption** + **`scope="col"`**); desktop **timeline** (coloured vertical rail + dots) with **scroll snap** between sections (respects **`prefers-reduced-motion`**).
- **Web / Settings**: Modal split into **sections**; desktop **‹** / **›** controls; **swipe** between sections on narrow viewports; header **section index** (e.g. `1 / 8`); focus trap limited to the active pane; **`inert`** on inactive panes where supported.
- **Web / pickers**: Selected **food, exercise, stressor, symptom, energy & clarity** tiles show a **corner checkmark**; stressor/symptom tooltips say **Toggle**.
- **Web / UI**: Floating **+** FAB cluster inset **further from the screen edge** (safe area + padding); **`styles.css`** cache bump in **`index.html`**.
- **Copy style**: Replaced Unicode **em dash** (`U+2014`) with ASCII **hyphen-minus** across the repo (user-facing strings, comments, docs).
- **Docs**: **[README.md](../README.md)**, **[app-and-features.md](app-and-features.md)**, this changelog.
- **Build**: Run **`npm run build:web`** before release; **`web/app.min.js`** remains gitignored (generate locally/CI).

### v1.40.0 - 2026-03-23 - README & changelog

- **Docs**: Root **[README.md](../README.md)** now summarises **direct legacy load** on Android APK vs **React + iframe** on web/dev, **`npm run build:apk`**, and **debug (CI) vs release/AAB** with a link to **[docs/setup-and-usage.md](setup-and-usage.md#nav-react-android)**.

### v1.39.0 - 2026-03-23 - Android WebView performance

- **Capacitor / React**: **`react-app/src/main.tsx`** redirects native platforms to **`legacy/index.html`** immediately; **`app-web.tsx`** loads the React + iframe shell only for browser/Vite. Avoids nested WebView + iframe on APK/iOS.
- **Web**: **`isRianellNativeApp()`** treats **`window.Capacitor.isNativePlatform()`** as authoritative. New **`web/android-update-check.js`** replaces the React-only APK update modal ( **`App` / `Browser`** plugins). **`performance-utils`**: stricter AI defer and **`isRianellCapacitorAndroid()`**; **`index.html`** skips idle **`summary-llm.js`** preload on Capacitor Android; **`rel=preload`** for main script (patched to **`app.min.js`** in **`copy-webapp.js`**). **`styles.css`**: **`overscroll-behavior-y: contain`** on **`.app-main-scroll`**. **`workers/io-worker.js`**: note on payload size for WebView.
- **Android patch**: **`patch-android-sdk.js`** ensures **`android:hardwareAccelerated="true"`** on **`<application>`** when absent.
- **Docs**: **`docs/setup-and-usage.md`** - native vs iframe behaviour, release/debug/AAB, profiling, regression checklist.

### v1.38.0 - 2026-03-23 - MOTD selection

- **Web**: Dashboard preset MOTD (when the on-device LLM does not replace it) picks a **random** line from **`web/motd.json`** **once per full page load**; the same line is reused for repeated `updateDashboardTitle` calls in that session. **`web/motd.json`** `description` updated.


### v1.37.0 - 2026-03-22 - Icons, repo cleanup

- **Web**: Regenerated **`web/Icons/Icon-*.png`** from **`logo-source.png`**; **`scripts/generate-icons.mjs`** and **`scripts/generate-native-icons.mjs`** removed (use **`npm run build:android`** / **`prepare-android-assets.mjs`** + **`@capacitor/assets`** for native; edit **`web/Icons/`** and **`logo-source.png`** directly for future PWA changes).
- **Repo**: Removed legacy **`web/Icons/generate_icons.py`**. Root **`package.json`**: dropped **`generate:icons`** / **`generate:native-icons`** scripts.


### v1.36.0 - 2026-03-22 - APK / native shell performance

- **Legacy web bundle (iframe)**: Root **`npm run build`** runs **`build:web`** first, then **`react-app`** copies **`web/app.min.js`** into **`public/legacy/`** and rewrites **`legacy/index.html`** to load it instead of **`app.js`** (production/`vite build` only; **`npm run dev`** still uses full **`app.js`** for debugging). Much smaller script download and parse on device.
- **React shell (Vite)**: **`manualChunks`** for React and **`@capacitor/*`**; **`target: es2020`**, esbuild minify for the shell bundle.
- **Capacitor**: **`backgroundColor`**, **`android.webContentsDebuggingEnabled: false`** (less WebView debugging overhead on debug APKs; set **`true`** in **`capacitor.config.ts`** when you need Chrome `chrome://inspect`).
- **Gradle (patch)**: **`patch-android-sdk.js`** appends parallel build + cache + JVM heap hints when missing (speeds **`assembleDebug`** in CI).


### v1.35.0 - 2026-03-22 - Android launcher icon pipeline

- **Android / Capacitor**: PWA icons under `web/Icons/` are not applied to the native project by `cap sync` alone. **`scripts/prepare-android-assets.mjs`** builds **`react-app/assets/logo.png`** (from **`web/Icons/logo-source.png`**, or **`Icon-512.png`**, or a flat placeholder), then **`@capacitor/assets`** generates **mipmap** / adaptive icon and splash assets before **`cap sync`**. Root **`npm run build:android`** and CI **`android`** job run this sequence.
- **Dependencies**: **`react-app`**: devDependency **`@capacitor/assets`**. **`.gitignore`**: **`react-app/assets/logo.png`** (generated locally/CI).


### v1.34.0 - 2026-03-22 - MOTD quotations content

- **Web**: **`web/motd.json`** preset list replaced with **144 attributed quotations** (historical / widely published sources). Licensing for redistribution remains your responsibility; see the file’s `description` field.
- **Repo**: No redundant scripts to remove beyond what **v1.33.0** already dropped; **`scripts/`** retains **`smoke-function-trace.mjs`** and related tooling.


### v1.33.0 - 2026-03-22 - MOTD JSON, legacy copy

- **Web**: Dashboard MOTD fallback lines load from **`web/motd.json`** (fetched before `loadSettings()`); minimal inline fallback if fetch fails. Preset list still rotates per calendar day until the on-device LLM replaces it (when AI is enabled).
- **React / Capacitor**: **`motd.json`** is included in **`react-app/copy-webapp.js`** static root files so **`/legacy/`** builds serve the file.
- **Repo**: Removed redundant **`scripts/extract-motd-to-json.mjs`** (edit **`web/motd.json`** directly or use your editor’s JSON formatter).


### v1.32.0 - 2026-03-22 - Function trace, CI web build

- **Web (debug)**: Build-time **function trace** (Babel AST) for first-party `web/**/*.js` with excludes (vendor/min bundles, workers, service worker, `trace-runtime.js`). **`web/trace-runtime.js`** loads before other app scripts; **`trace-runtime.js`** is never instrumented so hooks exist before any wrapped code. Toggle **Function trace** (verbose `console.debug` per function) only in **God mode** (backtick `` ` `` **with demo mode on**); persisted as `localStorage.rianellFunctionTrace`. Gated by **`window.__rianellFnTraceOn`** (demo + toggle); **console-only** - no `Logger`, no `fetch` (no network for tracing).
- **Build**: Root **`npm run build:web`** runs **`web/build-site.mjs`** (mirror to **`web/.trace-build/`** + minify **`app.js`** → **`app.min.js`**). **`npm run smoke:trace`** checks the transform output parses.
- **CI**: **`deploy-pages`** runs **`npm ci`** (cached from **`package-lock.json`**) then **`node web/build-site.mjs --site site`** so the live site matches the local web build (instrument + minify), then rewrites **`index.html`** to **`app.min.js`**.
- **README**: Changelog and [GitHub Pages](setup-and-usage.md#github-pages-app-at-repo-root) / [Performance](app-and-features.md#performance-optimisation-stack) updated for this pipeline.


### v1.31.0 - 2026-03-22 - Donate, wizard buttons, selected lists

- **Donate**: PayPal **JavaScript SDK** with Smart Payment Buttons when `paypal-client-id` (or `window.__PAYPAL_CLIENT_ID__`) is set; amount chips; fallback hosted donate URL if unset. CSP extended for PayPal script and API hosts.
- **Log wizard**: **Back** / **Skip** / **Next** use a **three-column grid** and visibility (not `display:none`) so the row does not collapse to one full-width button on early steps; step 0 **Back** acts as **Close** (home).
- **UI**: Selected stressors/symptoms (and edit lists) **`.item-tag`** rows match card styling; mobile **selection-summary-sticky** uses glass blur instead of flat `#0a0a0a`.


### v1.30.0 - 2026-03-22 - Mobile shell, charts metrics, console hygiene

- **Web (mobile)**: Viewport-locked **`.app-shell`**, single scroll on **`.container`**; **+** FAB **fixed** over content above bottom tabs; bottom bar as flex footer. Tab switching resets main scroll for consistency.
- **Web (charts)**: “Select metrics to display” uses the **main scroll** on narrow screens (no inner metric panel scroll).
- **Web (console)**: Broader **`unhandledrejection`** filters for extension noise (`tabs:outgoing.message.ready`, `VM… vendor.js`, etc.).
- **Web (nav)**: Neutral focus rings on bottom tab buttons (avoid global green `--shadow-focus` glow).


### v1.28.3 - 2026-03-22 - Dashboard bracket log format

- **Server**: **`BracketLevelFormatter`** (`server/config.py`) prefixes dashboard lines with **`[LEVEL]`** (two spaces before the timestamp); **`EmojiLogFormatter`** remains for **file** and **stream** handlers only. Console and `logs/*.log` keep emoji; Tkinter **Server Logs** uses ASCII brackets and coloured tags (`BRACKET_*` in `server/main.py`).
- **Server**: Log pane font set back to **Consolas**; leading `[INFO]` / `[ERROR]` / etc. highlight with level-appropriate colours.


### v1.28.2 - 2026-03-22 - Server dashboard log emoji

- **Server**: Tkinter **Server Logs** pane uses a Segoe UI–family font (`Segoe UI`, `Segoe UI Emoji`, or `Segoe UI Symbol` when installed) so level emojis render; monospace **Consolas** does not show emoji in Tk `Text` on Windows (`server/main.py`).
- **Server**: `EmojiLogFormatter` inserts **two spaces** after the emoji for a clear gap before the timestamp (`server/config.py`).


### v1.29.0 - 2026-03-22 - Mobile nav, console log colours, README

- **Web**: Bottom **Home / Logs / Charts / AI** bar and floating **+** are **siblings** of `.app-shell` in `index.html` so fixed tab labels and icons render correctly on mobile WebKit; minor stacking CSS (`isolation` / `z-index` on tab buttons). Log entry is opened via **+** (no Log tab).
- **Server**: `ConsoleColorBracketFormatter` colours **`[LEVEL]`** in the terminal (blue INFO, red ERROR, etc.); `EmojiLogFormatter` remains for **file** logs only (no ANSI in files). Respects `NO_COLOR` and `FORCE_COLOR`.
- **README**: App overview diagram and [App shell](app-and-features.md#app-shell-and-log-experience-web-ui) / [Logging](project-reference.md#logging) sections updated to match.


### v1.28.1 - 2026-03-22 - Server logs & charts visibility

- **Server**: `EmojiLogFormatter` in `server/config.py` prepends a per-level emoji to every `Rianell` log line (file, console, Tkinter dashboard); `server/main.py` uses the same formatter for the dashboard `TextHandler`.
- **Charts tab**: `updateChartEmptyState` calls `enforceChartSectionView` when data appears; `.chart-container.hidden` and chart container IDs use `display: none !important` so Combined / Balance / Individual panels do not stack visibly when switching modes.


### v1.28.0 - 2026-03-22 - Performance overhaul

- **Web**: Centralised log reads, chart in-place updates, AI/precompute dedupe and scheduling, virtualised View Logs append, deferred chart CSS and idle `summary-llm` load, IndexedDB mirror, IO workers, optional SW, perf marks / long-task observer.
- **Server**: gzip static assets; cache headers for static extensions.
- **CI**: esbuild minify + HTML rewrite on GitHub Pages deploy; root `npm run build:web` for local minified bundle.


### v1.27.5 - 2026-03-22 - Documentation

- **README**: Added AI Analysis tab screenshot under [AI analysis](app-and-features.md#ai-analysis); image stored at `docs/images/ai-analysis.png`.


### v1.27.4 - 2026-03-22 - Documentation

- **README**: Added **View logs** bullet and screenshot (date filters and entry card) under [App shell and log experience (web UI)](app-and-features.md#app-shell-and-log-experience-web-ui); image stored at `docs/images/view-logs.png`.


### v1.27.3 - 2026-03-22 - Documentation

- **README**: Added tile picker (card selector) screenshot for **energy & mental clarity** under [App shell and log experience (web UI)](app-and-features.md#app-shell-and-log-experience-web-ui); image stored at `docs/images/card-selector-energy-clarity.png`.


### v1.27.2 - 2026-03-22 - Documentation

- **README**: Added Home tab screenshot under [App shell and log experience (web UI)](app-and-features.md#app-shell-and-log-experience-web-ui); image stored at `docs/images/home-dashboard.png`.


### v1.27.1 - 2026-03-22 - Documentation

- **README**: Added screenshot of the Health App Server Dashboard (Tkinter control panel) under [Server Dashboard Features](setup-and-usage.md#server-dashboard-features); image stored at `docs/images/server-dashboard.png`.


### v1.28.0 - 2026-03-22 - #Demo onboarding, donate modal, MOTD

- **`#Demo` deep link**: The first time a user opens the app via **`/#Demo`** (not via the Settings demo toggle alone), after demo mode loads they get **random Goals & targets** once and the **tutorial** if it was not already completed (`rianellDemoHashOnboardingDone`, `rianellDemoHashPendingOnboarding` in sessionStorage across the reload).
- **Donate**: Settings **Donate** opens the PayPal modal reliably (wired in `event-handlers.js`); floating **×** on the iframe; optional auto-close on PayPal `postMessage` heuristics.
- **Dashboard MOTD**: Preset line rotates **once per calendar day**; shimmer/fade animation removed so text updates are an instant swap.


### v1.27.0 - 2026-03-22 - Charts tab views, demo mode

- **Charts tab**: Balance / Combined / Individual now show **only** the active chart layout. Visibility is enforced after chart builds and background preload; **`chartView`** drives refresh (legacy **`combinedChart`** is normalised on settings load). Individual lazy charts stay hidden when another mode is active.
- **Demo mode**: With demo mode enabled, **each full page load** regenerates demo health logs (same rules as enabling demo: desktop `generateDemoData`, mobile premade + date rebase). Initial load skips reading stored `healthLogs` in demo mode so async decompression cannot overwrite fresh demo data.


### v1.26.0 - 2026-03-22 - UI, MOTD, first paint, extensions

- **Mobile bottom nav**: Increased flex `gap` between items so tab buttons are not visually squashed on small screens.
- **Mobile header**: Goals and Settings controls use **in-flow layout** above the green dashboard title (≤768px) instead of overlapping long/wrapped MOTD text.
- **Dashboard MOTD**: Removed personalised “Welcome to {name}'s health”; header uses **preset lines** (one per calendar day) plus optional LLM line **after** `body.loaded` so startup does not double-load the Transformers pipeline with `preloadSummaryLLM`. Tab title remains **Rianell**.
- **First paint**: Inline critical CSS in `index.html` for `html`/`body` and `#loadingOverlay` so the loading screen is **dark with spinner** before `styles.css` loads (avoids a white flash).
- **Extensions**: Early `unhandledrejection` listener plus a stronger handler in `app.js` to **suppress noisy extension promise rejections** (e.g. `tabs:outgoing.message.ready`, `vendor.js`). Optional: use a profile without extensions for a clean console when debugging.


### v1.25.0 - 2026-03-22 - `server/launch-server.ps1` for Windows

- **Windows launcher**: Added `server/launch-server.ps1` to start the Health App server from the repo root (`python -m server` or `py -3 -m server` when `python` is not on PATH). README documents usage with Windows PowerShell and `pwsh`, and optional `$env:PORT` / `$env:HOST`.


### v1.24.0 - 2026-03-21 - Tile picker dialog, mobile chips, dashboard MOTD

- **Tile picker (`<dialog>`)**: Replaced native `<details>` chip sections with a shared **full-screen bottom sheet** (centred max-width panel from 768px up). Triggers use buttons with `aria-expanded`; content is **teleported** into `#tilePickerSheet` and restored on close so chip grids keep stable IDs. Food/exercise modals and the edit-entry form use the same pattern; closing a parent modal closes the sheet. `collapseSectionContent` closes the sheet when collapsing a section. Removed the old `makeAccordion` / one-open-details wiring.
- **Mobile-centric chips**: Horizontal scroll strips, scroll snap, denser tiles, and softer open shadows on small viewports; optional debounced **filter** inputs per chip area (food, stressors, symptoms, exercise).
- **Dashboard MOTD**: `summary-llm.js` exposes `generateMotdWithLLM`; `updateDashboardTitle()` loads the script when needed and sets a short on-device motivational line per full page load (skipped when `deferAI` is true).


### v1.23.0 - 2026-02-24 - Developer in God mode, GPU stability graph, better GPU utilisation

- **Developer settings moved to God mode**: The "Clear performance benchmark cache" and "View last benchmark details" buttons (and hint) are no longer in Settings; they now live in **God mode** (press <kbd>`</kbd>). Benchmark modal and empty-state copy updated to say "God mode (` key)" instead of "Settings → Developer". README Settings and Device performance sections updated.
- **GPU stability graph**: The Performance & AI benchmark modal (brief and "View last benchmark details") now includes a **Stability (GPU)** panel when detailed results are expanded. The benchmark runs the GPU test 5 times and stores `gpu.scoreSamples`; a sparkline and stats (Backend, Samples, Mean ms) are shown. Layout: three panels (Test results, Stability CPU, Stability GPU) on wide screens; grid wraps on smaller viewports.
- **Better GPU utilisation**: WebGPU adapter and WebGL context request **high-performance** power preference. TensorFlow.js WebGL backend uses `WEBGL_POWER_PREFERENCE: 'high-performance'` and is enabled when the benchmark reports a good GPU (not only on desktop). TF WebGL is warmed early (idle callback or timeout) when GPU is good and AI is enabled so the first analysis avoids cold init. AIEngine exposes `warmGPUBackend()`.


### v1.22.0 - 2026-02-24 - Tier 5 maxed, GPU detection & acceleration, accelerated UI

- **Tier 5 maxed**: Desktop and mobile tier 5 profiles now use maximum resources-highest chart point limits (400/450 desktop, 280/300 mobile), fastest preload and stagger delays (300 ms chart, 400 ms AI, 15–18 ms lazy stagger), and full animations. Overrides (e.g. tablet) no longer reduce chart capacity below tier 5 when the effective tier is 5.
- **GPU detection and benchmark**: After the CPU benchmark, a quick GPU check runs (WebGPU adapter request or WebGL clear loop). Result is cached with the benchmark (cache version bumped to 4). Profile exposes `gpuBackend` ('webgpu' | 'webgl' | 'none') and `gpuGood`; tier 4 devices with a good GPU are treated as effective tier 5 for charts and AI.
- **GPU-accelerated AI**: Summary/suggest LLM (Transformers.js) loads with `device: 'webgpu'` or `device: 'webgl'` when the benchmark reports GPU available; on failure the app falls back to CPU (WASM). Same model IDs and in-memory cache behaviour; no cache migration.
- **Transformers.js upgrade**: Upgraded from @huggingface/transformers@3.2.0 to **@3.3.2** for stable WebGPU/WebGL device support; 3.4.x is avoided due to a known ONNX Runtime Web issue (`n.env is not a function`).
- **Accelerated UI and charts**: When tier is 5 or GPU is good, the chart section gets class `chart-gpu-accelerated` so chart containers use `translateZ(0)` for compositor layer promotion. Critical-path work (combined chart build and AI preload) is scheduled with `scheduler.postTask(..., { priority: 'user-blocking' })` when available (Chrome), otherwise deferred once.
- **Benchmark modal**: New line shows GPU status-e.g. "GPU: WebGPU available, used for AI" or "GPU: Not available (using CPU for AI)". Profile JSON in details includes `gpuBackend` and `gpuGood`.
- **Docs**: README Device performance section describes GPU and tier 5; on-device LLM uses Xenova FLAN-T5 small/base by tier (tier 5 uses **base** because **large** can 401 from the browser); browsers do not expose CPU frequency/turbo (app uses tier + GPU and optional Scheduler API).


### v1.21.0 - 2026-02-24 - Escape toggles Settings on desktop, benchmark progress bar, device hardware detection

- **Escape key on desktop**: Escape now **opens** Settings when it is closed and no other modal is open; it still **closes** Settings when open. On mobile, Escape continues to close Settings only. Desktop is detected via `DeviceModule.platform.platform === 'desktop'` or non-mobile User-Agent.
- **Benchmark progress indicator**: While the performance benchmark runs on first load, the loading overlay shows a **progress bar** (0–100%) and the existing text ("Measuring performance… X% · &lt;current test&gt;"). The bar is visible only during the benchmark phase and completes to 100% before the overlay is removed.
- **Device hardware detection**: Optional UAParser.js v1.x for OS, device type/vendor/model, and CPU architecture; **estimated memory bucket** when `navigator.deviceMemory` is missing (e.g. iOS). Benchmark modal and env snapshot show OS, device, CPU, and "estimated: low/medium/high" RAM. Tier heuristic and profile memory overrides use the estimated bucket so iOS and other no–deviceMemory environments get better default tiers.
- **README**: Settings & UI now document Escape key behaviour; Device performance section updated with progress bar and tier range; changelog v1.21.0 added.


### v1.20.0 - 2026-02-24 - Benchmark-driven AI model selection and brief benchmark UI

- **Performance & AI benchmark modal**: Modal title and framing updated to "Performance & AI benchmark". Default view is **brief**: one-line summary (device, tier, class, **Recommended AI model: small/base**) and a line stating the device can run the recommended on-device model (flan-t5-small/base). **"See detailed benchmark results"** expandable section contains the test bars, stability (CPU) panel, and "Chosen optimisation profile" JSON so details are optional.
- **AI-oriented benchmark**: Benchmark messaging and profiles are oriented around **on-device AI runnability**; each tier profile includes `llmModelSize` ('small' | 'base') used for the summary/suggest LLM. Device-benchmark comment and UI copy reflect this.
- **On-device AI model in Settings**: Settings → Performance → **On-device AI model** dropdown: "Use recommended (for this device)", "Small (faster, lower memory)", "Base (better quality)". Stored as `appSettings.preferredLlmModelSize`; hint shows "Recommended: flan-t5-…" when the benchmark is ready, or "Run benchmark (reload app) to see recommendation."
- **Model resolution and cache**: `summary-llm.js` resolves model in order: user override (`preferredLlmModelSize` 'small'/'base') → benchmark profile `llmModelSize` → deviceClass fallback. `getOptimizationProfile()` in `performance-utils.js` now returns `llmModelSize`. Changing the setting calls `clearSummaryLLMCache()` so the next summary/suggest loads the chosen model.
- **README**: AI analysis and Device performance sections updated; changelog v1.20.0 added.


### v1.19.0 - 2026-02-23 - Benchmark-driven device classifier and expansive settings

- **Device benchmark module** (`web/device-benchmark.js`): Classifies platform as **mobile** or **desktop** (including Capacitor native app), runs a short CPU benchmark to determine a performance **tier (1–4)**, and caches the result in localStorage. Exposes `DeviceBenchmark.runBenchmarkIfNeeded`, `isBenchmarkReady`, `getPerformanceTier`, `getFullProfile`, `getLegacyDeviceClass`, `clearBenchmarkCache`, etc.
- **Expansive profiles**: Separate **MOBILE_PROFILES** and **DESKTOP_PROFILES** tables (4 tiers each) drive chart points, AI preload, DOM batching, demo data days, load timeout, LLM model size, and related options. When the benchmark is ready, `performance-utils.js` uses these profiles via `getOptimizationProfile()` and `getDeviceOpts()` and syncs `platform.deviceClass` from the benchmark tier.
- **Load gating**: App load handler runs the benchmark first (when `DeviceBenchmark` is present). Loading text shows “Measuring performance…” during the run. If the result was **not** cached (first run), a modal shows the detected device class (platform + tier + class) for user acknowledgment; on OK the result is saved and the app continues. If cached, the app proceeds without the modal.
- **Developer**: (Moved to God mode in v1.23.0.) Clearing “Clear performance benchmark cache” forces the benchmark and device-class modal to run again on next reload.
- **Alert modal callback**: `showAlertModal(message, title, onClose)` now accepts an optional third argument; when provided, the OK button (and overlay/Escape close) invokes the callback before closing, used for the device-class acknowledgment flow.
- **README**: New “Device performance (benchmark)” and Developer setting documented; changelog entry for v1.19.0.


### v1.18.0 - 2026-02-23 - Tab defaults and chart first-load fix

- **Charts tab**: Always opens in balance view when the tab is clicked; preference is saved so balance is the default each time.
- **View Logs tab**: Defaults to last 7 days when the tab is opened (was today).
- **Individual charts first load**: Only the combined chart is built during the loading overlay; the 14 individual charts are built after the overlay is removed and layout is complete (rAF + 80 ms delay when view is individual), so they get correct dimensions and no longer appear blank until the user switches view and back.


### v1.17.0 - 2026-02-23 - Dependencies: Dependabot alerts resolved

- **npm (react-app)**: Upgraded Vite 5 → 6.4 (esbuild 0.25+, fixes moderate CORS advisory) and all @capacitor/* 6 → 7 (fixes high: minimatch ReDoS, tar path traversal). Regenerated package-lock.json; `npm audit` reports 0 vulnerabilities.
- **Node**: Root `package.json` engines set to Node >=20 for Vite 6 compatibility. README and local setup now state Node.js 20+.
- **React/Capacitor**: @vitejs/plugin-react ^4.5.0; build and audit verified.


### v1.16.0 - 2026-02-23 - Performance, memory caps, loading UX, disclaimer, CSP

- **Loading overlay**: Kept visible until combined chart and summary LLM preload are ready (or 12s timeout); loading text set to "Loading charts and AI…". Ensures the app does not appear until the main heavy work is done.
- **CPU and polling fixes**: Chart container readiness in `loadChart` now capped at 40 retries (2s) to avoid unbounded 50ms polling and 100% main-thread usage. `updateCharts` ApexCharts retry capped at 24 (12s) when the library is not yet loaded.
- **Memory caps**: `DOMBatcher` in `performance-utils.js` flushes when pending updates exceed 150 to avoid unbounded growth when the tab is backgrounded (rAF throttled). `DataCache` limited to 80 keys with LRU eviction. Periodic cleanup (60s) also clears `PerformanceMonitor.marks` when size exceeds 20 to prevent leak.
- **Supabase**: `initSupabase` in `cloud-sync.js` skips creating the client when URL or anon key is missing or placeholder; logs one warning instead of repeated "supabaseUrl is required" errors.
- **CSP**: `connect-src` in `index.html` updated to allow `https://cas-bridge.xethub.hf.co` and `https://*.xethub.hf.co` so the in-browser summary LLM can fetch Hugging Face model assets.
- **Disclaimer**: Full disclaimer text ("For patterns only… You can share this at your next visit. AI data (e.g. prediction weights) is stored on your device and, when signed in, backed up to your cloud account.") applied to plain-text export, print report footer, and both PDF export paths in `export-utils.js` and `app.js` so it matches the AI Analysis on-screen disclaimer.


### v1.15.0 - 2026-02-23 - Defer app reveal, chart fix, config resilience, docs

- **Defer app reveal until charts and AI ready**: The loading overlay stays visible until the combined chart (and its data/predictions) and the summary LLM pipeline are ready, or a 12s timeout. This avoids the UI stuttering while heavy chart and AI work run on first load. `summary-llm.js` exposes `window.preloadSummaryLLM()`; the load handler in `app.js` awaits charts + AI with `Promise.race([ Promise.allSettled([chartsReady, aiReady]), timeout ])` then reveals the app and runs the rest of init.
- **Combined chart fix**: `deviceOpts` was used in `createCombinedChart` without being defined, causing `ReferenceError` and breaking balance/combined charts. It is now set at the start of the function via `PerformanceUtils.getDeviceOpts()` with a safe fallback.
- **Supabase config resilience**: Inline script in `index.html` sets `window.SUPABASE_CONFIG` to a fallback before loading `supabase-config.js`, so a syntax error in that file (e.g. smart quotes) no longer breaks the page. Non-ASCII characters (emoji) in `supabase-config.js` comments were replaced with ASCII so the file parses everywhere.
- **GitHub secrets**: Deploy workflow already injects `SUPABASE_URL` and `SUPABASE_ANON_KEY` from repository secrets into the built site; README and comments clarify that tokens come from GitHub secrets at deploy time.
- **README**: Features section expanded to document all app features (tracking, charts, AI, goals, cloud, install options, server, security). Version set to 1.15.0.


### v1.14.1 - 2026-02-23 - Neural network optimisation and loading states

- **Neural network optimisation** (`web/AIEngine.js`): Added `yieldToMain()` and yield between analysis layers in `NeuralAnalysisNetwork.forward()` so the main thread can update the UI during analysis, reducing perceived lag and avoiding a frozen page.
- **AI Summary loading**: Loading state shows "Analysing your health data…" and waits one frame (`requestAnimationFrame` + `setTimeout`) before starting analysis so the message is visible; existing pulse animation on the loading icon retained.
- **Combined chart loading**: When predictions are computed (cache miss), a "Calculating predictions…" overlay with spinner is shown on the combined chart container and removed when done, so chart view no longer feels stuck during prediction runs.
- **Suggest note**: Already showed "Generating…" for the LLM path; no change.


### v1.14.0 - 2026-02-23 - Background loader module, slower rate, optional worker

- **Background loader module** (`web/background-loader.js`): Device-aware scheduling for chart and AI preload; loads after `performance-utils.js`, exposes `BackgroundLoader.scheduleChartPreload` and `BackgroundLoader.scheduleAIPreload`.
- **Slower preload rate**: Chart preload uses device-based stagger (low 280 ms, medium 200 ms, high 120 ms) and gap after combined (350 / 260 / 180 ms); profile `chartPreloadDelayMs` for initial delay.
- **performance-utils.js**: `platform.hardwareConcurrency` and `getOptimizationProfile().useWorkers` added for loader (worker path was never wired; AI preload runs on main thread only).
- **app.js**: Chart and AI preload delegate to `BackgroundLoader` when present; `getAIPreloadData`/`setAICache` for worker path; fallbacks when loader missing.


### v1.13.9 - 2026-02-23 - Throttle preload to avoid UI freeze

- **Chart preload**: Combined chart and individual charts no longer run in one blocking burst. Combined chart is deferred with `requestIdleCallback` (or `setTimeout(0)`); a 220 ms gap follows before the first individual chart; each subsequent chart is staggered by 180 ms (was 80 ms) so the app stays responsive.
- **AI preload**: An extra idle callback (or short delay) before running AI preload ensures the sync work does not block the same frame as chart preload or startup.


### v1.13.8 - 2026-02-23 - Device-based optimisation, chart & AI preload

- **Device opts**: `PerformanceUtils.getDeviceOpts()` in `performance-utils.js` returns `{ reduceAnimations, maxChartPoints, deferAI, batchDOM }` from device class and `prefersReducedMotion`. Low: 30 chart points, animations off, AI deferred; medium: 80 points, batch DOM; high: 200 points, full features.
- **Charts**: All chart options (combined, balance, individual) preload in the background when the Charts tab is opened so switching view is instant. Chart data point caps and animation toggles use `getDeviceOpts()` (and existing viewport caps). Combined and balance charts respect `reduceAnimations`; individual charts use device-based max points.
- **AI analysis**: AI analysis runs in the background (e.g. after load) and is cached so opening the AI tab shows results immediately when the cache matches the date range. On low devices (`deferAI`), the summary note uses the rule-based fallback only (no in-browser LLM load); AI tab open delay is increased to avoid blocking.
- **Log list**: `renderLogEntries` uses `domBatcher.schedule()` when `batchDOM` is true (low/medium) for fewer layout thrashing and smoother scrolling.
- **UI motion**: Heartbeat animation and AI summary UI respect `reduceAnimations` (and existing `prefersReducedMotion` / optimisation profile) so low-end and reduced-motion users get a calmer experience.


### v1.13.7 - 2026-02-23 - Version bump

- **Version**: Bump to 1.13.7 for release tracking.


### v1.13.6 - 2026-02-23 - README and changelog

- **README**: Changelog updated with version summaries; UK English retained.
- **Versioning**: Bump to v1.13.6 for documentation and release tracking.


### v1.13.5 - 2026-02-23 - Per-platform optimisation and hardware detection

- **Platform and capabilities**: Central layer in `performance-utils.js` exposes `PerformanceUtils.platform` (and `window.PlatformCapabilities`) with `deviceClass` ('low' | 'medium' | 'high'), `platform` (ios/android/desktop), `isTouch`, `isStandalone`, `prefersReducedMotion`, and optional `connection`. Single source of truth for hardware and platform used by LLM and charts.
- **Lazy-load LLM on low-end**: On low device class, `summary-llm.js` is not loaded in initial page; it is loaded on demand when the user first uses AI (Summary note or Suggest note). Medium/high devices load it up front for snappier AI.
- **Chart optimisations**: Charts use `deviceClass` to cap data points (low → max 30 points; medium/high keep existing 50/30 by viewport). When `prefersReducedMotion` is true, ApexCharts animations are disabled for that chart.


### v1.13.4 - 2026-02-23 - LLM model by device performance

- **Summary/Suggest LLM**: In-browser model is now chosen by device performance (RAM, CPU cores, mobile heuristic). Low-end and mobile use flan-t5-small; medium/high use flan-t5-base for better quality. Pipeline is cached by model id. If flan-t5-base fails to load, the app retries once with flan-t5-small before falling back to rule-based note.


### v1.13.3 - 2026-02-23 - Summary note and Suggest note LLM improvements

- **Summary note**: Improved LLM prompt and context for a clearer, patient-friendly 2–3 sentence summary; optional line from top stressor in context; strip trailing incomplete sentences from output.
- **Suggest note (log entry)**: "Suggest note" now uses the in-browser LLM (same model as Summary note) when available, with rule-based fallback; short timeout and token limit for snappy response; "Generating…" on button during LLM call.
- **Optimisation**: Shared LLM pipeline for both Summary and Suggest note; no duplicate model load.


### v1.13.2 - 2026-02-23 - CI: fix iOS/Android build push

- **CI**: iOS and Android build workflows now fetch and rebase onto `origin/main` before committing, so the "Update iOS build" / "Update Android APK" push no longer fails when `main` has moved (remote rejected: expected older commit). Removed stash-based rebase; commit is made on top of latest `main`.


### v1.13.1 - 2026-02-23 - AI summary value highlighting, README UK English

- **AI summary readability**: Stress and triggers, Symptoms and where you had pain, Pain patterns, Pain by body part, Nutrition, Exercise, Top foods, and Top exercises now use the same value markup as “What we found” (e.g. `ai-brackets-highlight` for parenthesised values, percentages, and counts) so key figures are easier to scan.
- **README**: Converted to UK English (e.g. visualisation, synchronisation, anonymised, analyse, licence).


### v1.13.0 - 2026-02-23 - AI optional, summary LLM, notifications

- **AI optional**: Settings toggle "Enable AI features & Goals" – when off, hides AI Analysis tab, chart predictions, and Goals (targets button and progress). Stored in settings and synced to cloud.
- **Tutorial**: First card "Enable AI & Goals?" (Enable / Skip for now). If skipped, all AI-related tutorial slides are omitted (View & AI, Settings & data, Data options, Goals).
- **Summary LLM**: In-browser small LLM (Transformers.js, flan-t5-small) for the AI summary note; data-rich context (trends, flares, insights) for short, insightful 2–3 sentence summary. Fallback to rule-based note on error or timeout.
- **Goals & cloud**: Goals and targets saved to cloud (Supabase app_settings) with localStorage; sync on save and on load when signed in.
- **Notifications**: "Enable sound notifications" now respected – notifications use `silent: false` when sound is on (including on mobile). Heartbeat-monitor style sound (Web Audio, lub-dub) plays when reminder fires and app is in foreground, and when enabling sound in Settings. AudioContext unlocked on permission request for mobile.
- **Server**: No server files in repo root; run with `python -m server` (see v1.12.0).


### v1.12.0 - 2026-02-23 - Security, CI & docs

- **Security**: Remove exposed Supabase URL/keys and default encryption key from repo; rewrite git history to redact secrets; document connecting your own API and encryption keys.
- **GitHub Pages**: Deploy workflow injects Supabase config from repository secrets so production site works without committing credentials.
- **Server**: Move server logic into `server/` package; root entry point removed (run with `python -m server`).
- **Install modal**: Post-tutorial install modal (shown once) with web/Android/iOS install options; added to God mode – test all UI.
- **UK English**: User-facing copy and docs use UK spelling (anonymised, optimisation, centre, etc.); schema/code identifiers unchanged.
- **CI**: Android/iOS workflows use pull–rebase before push and stash to avoid unstaged-changes errors; Android compileSdk set to 36.
- **Builds**: Android APK and iOS (Xcode project zip, simulator) output to `App build/Android/` and `App build/iOS/` with `latest.json`; Settings modal uses newest build.
- **README**: Changelog in collapsible sections; God mode and post-tutorial install modal documented.


### v1.11.0 - 2026-02-22 - React shell & neural pipeline

- **React & Android**: React (Vite) shell wrapping web app in iframe; Capacitor 6 for Android; GitHub Actions build APK on push to `main`, output to `App build/Android/`.
- **AI**: Neural-style pipeline for AIEngine (layers: input, trend, correlation, pattern, risk, cross-section, advice, interpretation, summary).
- **UI**: Install web app (PWA) and Install on Android in Settings; styles and README updates.


### v1.10.0 - 2026-02-19 - Goals, medications & sharing

- **Features**: Goals and targets (steps, hydration, sleep, good days); medications; offline queue; sharing.
- **Demo**: Improved flare modelling and smoothing in demo data.


### v1.9.0 - 2026-02-18 - Settings & modals

- **Settings**: Refactor settings modal, tabs and UI styles.
- **Modals**: Fix modal open/close, expose handlers, delegate clicks correctly.


### v1.8.0 - 2026-02-03 - Sharing, consent & God mode

- **Sharing**: Sharing UI and AI PDF export.
- **Consent**: Cookie consent banner; GDPR/cookie policy.
- **Testing**: God mode – test all UI (backtick ` key) to trigger tabs, modals, charts, AI range, form sections.
- **AI**: Enhanced AI analysis and flare detection; UI improvements.


### v1.7.0 - 2026-02-02 - Tutorial

- **Onboarding**: Tutorial for new users; UI updates; tutorial mode (slides: Welcome, Log Entry, View & AI, Settings & data, Data options, Goals, You're all set).


### v1.6.0 - 2026-02-01 - Food, pain & UI

- **Food**: New food log input via tiles; food variety update.
- **Pain**: New pain diagram model; joints in pain diagram.
- **UI**: General UI fixes and app.js updates.


### v1.5.0 - 2026-01-05 - Setup

- Setup added (documentation/setup flow).


### v1.4.0 - 2026-01-03 - Cloud & server

- **Cloud**: User-specific encryption and cloud data management.
- **Server**: Server UI with DB control; bug fixes.
- **Repo**: Remove ignored files from Git tracking.


### v1.3.0 - 2026-01-02 - AI & anonymised data

- **AI**: Optimised AI engine with new models and model selection.
- **Data**: Anonymous dataserver for global prediction models.
- **Server**: Test server multithread; filters fixed.
- **Docs**: README and app documentation updates.


### v1.2.0 - 2026-01-01 - Stability & security

- **Security**: Security update.
- **UI**: Settings modal consistent layer; mobile UI optimisation; UI fixes; UI glitches fixed.
- **Server**: Logger error fixed for multithread.
- **Misc**: Caching bug fixed; demo mode logger updates; log file updates.


### v1.1.0 - 2025-12-31 - Cloud, AI models & demo

- **Cloud**: Cloud sync; SHA-256 for data; Google Drive sync.
- **AI**: Custom condition and tailored LLM; new models (Xenova/LaMini-Flan-T5-783M, GPT, ONNX medical notes); model caching and config; prediction models and data filters; model reset; filters for graphs; BPM animation and AI analysis in view logs.
- **Data**: Data sample script; handling for no data; data deletion protocol; incompatibility fix on imported data.
- **Features**: Demo mode; exercise and food track; optimised prediction patterns and log cards.
- **Fixes**: Stack overflow for encryption solved; AIEngine and app.js updates.


### v1.0.0 - 2025-12-30 - Initial release

- **Core**: Initial commit; health tracking; data visualisation; server for development/testing.
- **AI**: New container for AI logic; AI modal (fixed and UI updates).
- **UI**: Settings and text highlight fix; UI updates; old build added.



