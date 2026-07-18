# Platform

Rianell ships a single active client surface:

- **Web / PWA** - `apps/pwa-webapp/`

The former native (React Native / Capacitor) clients and their platform-parity tracking have been retired; Rianell is now web-only. The optional Python `server/` and the shared `@rianell/*` packages are unchanged.

---

## Shared logic

The PWA imports:

- `@rianell/shared` - schema, i18n, merge
- `@rianell/ai-engine` - analysis (bundled on web)
- `@rianell/cloud-sync` - encryption
- `@rianell/llm` - summaries

This keeps business rules in one place.

---

## Install

The PWA can be installed from the browser ("Add to Home Screen" / install prompt) for an app-like standalone experience. See [[Downloads]] and [[Getting-Started]].

---

## LLM download

The PWA downloads on-device model weights from Hugging Face and caches them via IndexedDB / Cache API. See [[Charts-and-AI]].
