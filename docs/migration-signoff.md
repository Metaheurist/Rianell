# Architecture migration sign-off

Generated snapshot for Phases 0–22 of the codebase architecture standard refactor.

## Verification commands

| Gate | Command |
|------|---------|
| Foundation (Phase 18) | `npm run verify:migration:foundation` |
| Release model (Phase 19) | `npm run verify:migration:release` |
| Full sign-off (Phase 20) | `npm run verify:migration` |
| Deploy observe (Phase 22, local) | `npm run migrate:deploy-observe` |

## Automated matrix (Phase 20)

- `npm run test:unit`
- `npm run verify:csp`
- `npm run verify:privacy-docs`
- `npm run parity`
- `npm run typecheck`
- `node scripts/verify/doc-links.mjs --strict`
- `npm run wiki:verify`
- `npx turbo run build --dry-run` (when `turbo.json` present)

## Operator checklist (Phase 22 remote stages)

1. Merge architecture refactor to **`main`** and push.
2. Confirm GitHub Actions **`main`** workflow fully green.
3. Confirm GitHub Pages deploy live at [rianell.com](https://rianell.com/).
4. Apply Cloudflare **301** for legacy artifact URLs → `/artifacts/*` (see [security/cloudflare-headers-recommended.md](../security/cloudflare-headers-recommended.md)).
5. Run production boot probe: `PROBE_URL=https://rianell.com/ node scripts/ci/deploy-probe-loop.mjs`.
6. Confirm GitHub Releases assets downloadable from README manifest links.

## Temporary migration tests (Phase 21)

`tests/unit/migration/` removed; durable checks promoted to:

- `tests/unit/workflows-ci-rncli.test.mjs` — `artifacts/` paths, no legacy artifact directory name
- `tests/unit/workspaces-packages.test.mjs` — PWA + build-tools workspace
- `tests/unit/security/verify-scripts.test.mjs` — verify script smoke
- CI `doc-links --strict` step
