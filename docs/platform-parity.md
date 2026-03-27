# Platform parity

This document defines the expected behavior contract across:

- Web / PWA
- Android (Capacitor)
- iOS (Capacitor)

The machine-readable source is `docs/platform-parity.json`. CI parity gates validate key hooks and platform config wiring in each mobile job.

## Current contract

- `notifications`: native plugin path enabled, with web fallback.
- `speech_to_text`: browser API based (`SpeechRecognition`) with explicit microphone permission preflight and plugin-aware permission fallback checks when native speech plugins are present; support still varies by engine/WebView.
- `clipboard_share_download`: supported with fallback paths where available.
- `sync_behavior`: foreground/interval behavior; no guaranteed OS background sync.
- `local_storage_and_idb`: supported across all targets (subject to platform quota/eviction policies).

### v1.44.2 parity update

- Cloud sync now includes additional user setting keys stored outside `rianellSettings`, improving cross-device settings parity for authenticated users.
- Native-first notification permission handling and native daily scheduling remain in place for mobile runtime consistency.

### v1.45.26 parity note (Home header chrome)

- **Web:** fixed **`.header-buttons-wrap`** (Goals & targets, Report a bug, Settings) sits beside scroll content (`apps/pwa-webapp/index.html`).
- **React Native:** the same three actions appear on **Home** as a top-right **chrome** row: **Goals** → Charts **Balance** + targets UI; **?** → security reporting doc; **Settings** → Settings tab. Full **Goals** modal and **bug report** modal parity remain Phase E.

### v1.45.29 parity note (View Logs Phase G)

- **Web:** View Logs supports date ranges, sorting, filtering, rich cards, and entry actions.
- **React Native:** `LogsScreen` now matches core controls for **range presets**, **sort**, and **refresh** with explicit selected-state accessibility labels; remaining parity backlog is text filter, card detail depth, and edit/delete/share actions.

### v1.45.40 parity note (AI + performance settings scope)

- **React Native:** baseline parity now includes `AIEngine`-style deterministic helpers and LLM wrapper hooks (summary/MOTD/suggest), plus benchmark-tier model selection settings.
- **Open parity:** full web benchmark detail modal (graphs/stability) and deeper AI runtime parity are still tracked in `docs/next-phase-development-plan.md` (Phase C/E/F).
- **Scope clarification:** RN keeps install/download affordances on web/PWA surfaces; native app settings do not show install buttons.

### v1.45.25 parity note (React Native shell)

- Native **bottom tabs** align with web primary navigation intent (Home, logs, charts, optional AI, settings). **Charts → Balance** exposes a **Targets** row (default wellness line) as a stepping stone toward full **Goals & targets** parity with web.

### v1.45.0 parity update

- Voice input now performs explicit microphone permission checks before recognition start, with clearer denied/unsupported feedback.
- Where Capacitor/community speech plugins are available at runtime, their permission APIs are checked/requested before falling back to browser media permission flow.

## CI enforcement

The mobile jobs run:

- `node scripts/check-platform-parity.mjs android`
- `node scripts/check-platform-parity.mjs ios`

These checks fail the build when expected parity hooks or generated native config markers are missing.

## Release traceability

`publish-release` includes `release-assets/Meta/platform-parity.json` so each release has a versioned parity snapshot.
