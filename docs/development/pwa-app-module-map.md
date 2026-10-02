# PWA `app.js` module map

`apps/pwa-webapp/app.js` is the PWA entry module (`<script type="module" src="app.js?v=N">`). Self-contained domains have been moved into ES modules under `apps/pwa-webapp/modules/app/`. `build:web` bundles the entry and these modules into one fingerprinted `app.<hash>.min.js` (esbuild, `bundle: true`), so production still ships a single script.

## Rules for `modules/app/*.js`

- **Never import `app.js`.** The entry is loaded with a cache-busting query (`app.js?v=N`), so importing `./app.js` would make the browser evaluate a second copy of the app.
- Modules may import only from other `modules/app/*.js` files (and must stay acyclic).
- Modules contain declarations only. Side effects (`window.X = X`, event listeners, init calls) stay in `app.js` at their original positions, so evaluation order is unchanged.
- Bindings that `app.js` reassigns (`appSettings`, `logs`, `deferredPrompt`, values assigned after `installSettingsModule`) cannot be imported, because ES imports are read-only. Pass them in explicitly instead, as `registerSettingsModalHooks` does in `modal-host.js`.
- Inline `onclick` handlers in `index.html` resolve through `attachInlineHandlersToWindow()` in `app.js`, which publishes imported functions like any local one.
- Tests and verify scripts read the app source through `scripts/lib/app-source.mjs` (`readAppSource()` / `appSourceFiles()`), which covers `app.js` plus every `modules/app/*.js`. `tests/unit/pwa/app-window-bindings.test.mjs` pins the set of `window.*` bindings so an extraction cannot silently drop one.

## Extracted modules

| Module | Domain | Imports |
| --- | --- | --- |
| `platform.js` | Static host, service-worker host, native shell detection, portrait lock | — |
| `i18n-theme.js` | `tUi` / `tContent` translation helpers, locale and date formatting, theme colours, Apex chart theming | — |
| `logger.js` | `Logger` (dev-host log relay) and the bug-report console capture buffer | `platform` |
| `dom-safety.js` | `escapeHTML` / `escapeAttr`, SVG icons, modal focus trap, notify helpers, toggle-switch a11y | — |
| `modal-host.js` | Shared alert and confirm modals, `closeSettingsModalIfOpen` with injected settings hooks | `i18n-theme`, `logger`, `dom-safety` |
| `voice-input.js` | Speech-to-text buttons for eligible text fields | `i18n-theme`, `modal-host` |
| `scheduling.js` | `runCriticalTask`, `runBackgroundTask`, `waitForMainThreadHeavyWorkSlot` | — |
| `perf-benchmark.js` | Performance benchmark results modal and details view | `i18n-theme`, `logger`, `dom-safety`, `modal-host` |
| `service-worker.js` | Service worker registration and update flow, long-task observer | `platform`, `logger`, `modal-host` |
| `auth-ui.js` | Password visibility toggles and the local password strength meter | `logger`, `dom-safety` |
| `cookie-consent.js` | Cookie consent banner and cookie policy modal | `logger` |
| `donate.js` | Donate modal and PayPal SDK loader | `i18n-theme`, `dom-safety` |
| `pwa-install-guide.js` | Per-platform install guide modal, `file://` help | — |

## Still in `app.js` (coupled domains)

These domains read or write bindings that `app.js` reassigns, or depend on many other in-file functions. Each needs an explicit dependency-injection seam (like `registerSettingsModalHooks`) before it can move without changing behaviour.

- [ ] **Settings state and persistence:** `appSettings` is a reassigned `let`, and nearly every domain reads it.
- [ ] **Health-data consent:** writes `appSettings` (`syncHealthDataConsentToSettings`).
- [ ] **Log storage, rendering and filters:** `logs` is a reassigned `let`; the log wizard and edit modal mutate it.
- [ ] **Charts:** ApexCharts builders depend on `logs`, `appSettings` and chart instance state.
- [ ] **Home, weather and discovery cards:** depend on settings, logs and AI state.
- [ ] **AI analysis, summary and model download consent:** depend on `appSettings`, `currentAIAnalysis` and the lazy LLM loader.
- [ ] **AI share text** (`openShareModalForAIAnalysis`): reads `currentAIAnalysis`.
- [ ] **Tutorial modal:** reads and writes tutorial and settings state.
- [ ] **PWA install prompt:** `deferredPrompt` is reassigned by the `beforeinstallprompt` listener.
- [ ] **Export and import wizards:** call `exportData`, `importData` and the encrypted export flows, and read `appSettings`.
- [ ] **Boot sequence:** top-level init, `attachInlineHandlersToWindow()` and the DOMContentLoaded wiring.
