# Agent guide — Rianell monorepo

Read these docs **in order** before making structural changes:

1. **[docs/architecture-standard.md](docs/architecture-standard.md)** — canonical layout, dependency rules, migration log
2. **[docs/project-reference.md](docs/project-reference.md)** — features, versions, operational detail

## Execution order (architecture migration)

Phases **0–7** (foundation) → **18** (verify) → **8–13** (optimize) → **14** → **19** (verify) → **15–17** → **20** → **21** → **22** (deploy loop).

Do **not** skip verification checkpoints. Do **not** edit the plan file in `.cursor/plans/`.

## Quick gates

| Command | When |
|---------|------|
| `npm run test:unit` | Every phase |
| `npm run test:migration` | Phases 2–20 (removed Phase 21) |
| `npm run verify:migration:foundation` | After Phase 7 |
| `npm run verify:migration` | Phase 20+ |
| `npm run migrate:deploy-observe` | Phase 22 epic close |

## Conventions

- **`apps/`** — deployables (`@rianell/pwa-webapp`, `@rianell/rn-app`)
- **`packages/`** — shared `@rianell/*` libraries
- **`scripts/`** — nested by concern (`build/`, `i18n/`, `verify/`, `ci/`, `audit/`, `wiki/`, `models/`, `dev/`)
- **`artifacts/`** — CI binaries + `latest.json` (renamed from `artifacts/`)
- **`server/`** — Python HTTP (not an npm workspace)
- **`i18n-packs/`** — canonical locale source at repo root
