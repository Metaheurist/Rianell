# Agent guide — Rianell monorepo

Read these docs **in order** before making structural changes:

1. **[docs/architecture-standard.md](docs/architecture-standard.md)** — canonical layout, dependency rules, migration log
2. **[docs/project-reference.md](docs/project-reference.md)** — features, versions, operational detail
3. **[docs/plans/MASTER.md](docs/plans/MASTER.md)** — feature rollout tracker (plans 01–14 complete)

## Execution order (architecture migration)

Phases **0–7** (foundation) → **18** (verify) → **8–13** (optimize) → **14** → **19** (verify) → **15–17** → **20** → **21** → **22** (deploy loop) → **23** (root hygiene).

Do **not** skip verification checkpoints. Do **not** edit the plan file in `.cursor/plans/`.

## Quick gates

| Command | When |
|---------|------|
| `npm run test:unit` | Every phase |
| `npm run verify:root-hygiene` | Phase 23+ (root layout) |
| `npm run verify:migration:foundation` | After Phase 7 |
| `npm run verify:migration` | Phase 20+ |
| `npm run migrate:deploy-observe` | Phase 22 epic close |
| `npm run migrate:root-hygiene-observe` | Phase 23 local sign-off |

## Conventions

- **`apps/`** — deployables (`@rianell/pwa-webapp`, `@rianell/rn-app`)
- **`packages/`** — shared `@rianell/*` libraries
- **`scripts/`** — nested by concern (`build/`, `i18n/`, `verify/`, `ci/`, `audit/`, `wiki/`, `models/`, `dev/`, `migration/legacy/`)
- **`artifacts/`** — CI binaries + `latest.json` (renamed from legacy `App build/`)
- **`audit-history/`** — boot audit JSON (`baseline.json` tracked; `latest-boot-audit.json` gitignored)
- **`server/`** — Python HTTP (not an npm workspace)
- **`i18n-packs/`** — canonical locale source at repo root
