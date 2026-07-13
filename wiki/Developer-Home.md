# Developer Home

Welcome to the **Rianell** monorepo - a personal health dashboard with a vanilla JS PWA, React Native (Expo) mobile apps, shared npm packages, and a Python dev server.

**Repository:** [github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell)

---

## Monorepo layout

```
Rianell/
├── apps/
│   ├── pwa-webapp/     # Web PWA (app.js, sw.js, AIEngine, cloud-sync)
│   └── rn-app/         # React Native / Expo mobile app
├── packages/
│   ├── shared/         # Log schema, i18n, privacy helpers
│   ├── ai-engine/      # Deterministic analysis pipeline
│   ├── cloud-sync/     # AES-GCM encrypt/decrypt
│   ├── llm/            # LLM interface (summaries, suggestions)
│   └── tokens/         # Design tokens → CSS
├── server/             # Python HTTP server + Tk dashboard (`dashboard_ui.py`)
├── supabase/           # Schema, edge functions
├── scripts/            # Build, i18n, parity, model upload
├── docs/               # Maintainer documentation (incl. design-token-contract.md)
├── wiki/               # This wiki (synced to GitHub Wiki)
├── benchmarks/         # Performance + AI benchmark runner
└── artifacts/          # CI artifacts (APK, iOS zip, server EXE)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | ≥ 24.14.1 (see `.nvmrc`) |
| **Python** | 3.8+ (server) |
| **Supabase** | Optional - cloud sync and LLM model hosting |

---

## Quick commands

From repository root after `npm ci`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Expo dev server (React Native) |
| `npm run dev:web` / `python -m server` | Local PWA via Python server |
| `npm run build:web` | Minified, content-hashed PWA build |
| `npm run test:unit` | Node unit tests |
| `npm run sync:tokens` | Regenerate PWA CSS vars from `@rianell/tokens` |
| `npm run verify:design-tokens` | Guardrail check on critical UI files |
| `npm run typecheck:mobile` | TypeScript check for RN app |
| `npm run verify:i18n` | Full i18n gate suite |
| `npm run parity:web` | Platform parity check (web) |
| `npm run wiki:verify` | Validate wiki source |
| `npm run wiki:sync` | Push `wiki/` to GitHub Wiki |

---

## Shared packages

Business logic lives in `packages/*` so web and mobile stay aligned:

- **`@rianell/shared`** - `normalizeLogEntry`, locale resolution, merge helpers
- **`@rianell/ai-engine`** - 10-layer analysis pipeline (bundled into PWA `AIEngine.js`)
- **`@rianell/cloud-sync`** - encrypted backup format
- **`@rianell/llm`** - prompt/summary interfaces

---

## Next steps

1. [[Developer-Setup]] - clone, env files, Supabase keys
2. [[Architecture-Overview]] - data flow and AI paths
3. [[Build-Test-and-CI]] - tests, benchmarks, GitHub Actions
4. [[Contributing]] - PR checklist and wiki workflow

---

## Deep documentation

- [Architecture standard](https://github.com/Metaheurist/Rianell/blob/main/docs/architecture-standard.md)
- [Project reference](https://github.com/Metaheurist/Rianell/blob/main/docs/project-reference.md)
- [Setup & usage](https://github.com/Metaheurist/Rianell/blob/main/docs/setup-and-usage.md)
- [Security](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)
