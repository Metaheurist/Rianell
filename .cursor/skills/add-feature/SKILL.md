---
name: add-feature
description: >-
  Scaffolds a new feature for the Rianell monorepo following the MASTER.md agent progress
  protocol. Use when adding a new feature ID, starting work on a plan, or when the user
  asks to implement something that maps to MASTER.md. Covers ID assignment, code placement,
  gate sequencing, CHANGELOG entry, and MASTER.md status updates.
disable-model-invocation: true
---

# Add Feature (Rianell MASTER.md protocol)

Scaffolds new feature work end-to-end: MASTER.md bookkeeping, code placement, gate run,
CHANGELOG update, and CI watch loop.

## Step 1 - Identify the feature

1. Read `docs/plans/MASTER.md` to find the relevant section and feature ID (e.g. `H2`, `L7`, `A3`)
2. Confirm the feature is not in the **Excluded (NR)** list:
   `H8, L4, L10, L12, I6, N8, CL3, RE2, RE3, T3-T6` - do not implement without a MASTER amendment
3. Check the plan file (`docs/plans/plan-XX-*/plan.md`) for implementation notes

If the feature doesn't yet have an ID, assign the next available ID in the correct section and
add a row to MASTER.md before proceeding.

## Step 2 - Mark in-progress

In `docs/plans/MASTER.md`:
- Set the **Plan status** → `in_progress`
- Set the feature's **Status** → `in_progress`

## Step 3 - Place the code

Follow the architecture rules from `docs/architecture-standard.md`:

| What you're adding | Where it goes |
|--------------------|--------------|
| New deployable UI surface | `apps/<name>/` + workspace entry in root `package.json` |
| Shared logic / utilities | `packages/<name>/src/` as `@rianell/<name>` |
| PWA-only feature | `apps/pwa-webapp/` (modules in `apps/pwa-webapp/modules/`) |
| RN-only feature | `apps/rn-app/src/` (screens, components, hooks) |
| Build / verify script | `scripts/<concern>/` |
| i18n strings | `i18n-packs/locale-packs/v1/en-GB.json` (canonical source) |

**Hard rule:** `packages/*` must never import from `apps/*`.

## Step 4 - Run the gate

```bash
npm run test:unit
node scripts/verify/doc-links.mjs --strict
# plus any feature-area gates (verify:i18n, verify:csp, etc.)
```

Gate must be green before proceeding.

## Step 5 - Update CHANGELOG

Add an entry to `CHANGELOG.md` under the current version heading:

```markdown
### vX.Y.Z - <Feature name>

- **<Area> (<platform>):** Brief description of what was implemented.
- **See:** [MASTER.md](docs/plans/MASTER.md) §<Section> <ID>.
```

## Step 6 - Mark done and commit

In `docs/plans/MASTER.md`:
- Set the feature's **Status** → `done` (or `deferred` with a one-line reason)
- If all features in the plan are done: set **Plan status** → `done`
- Update the **Progress summary** counts

Commit with message: `feat(<area>): <feature name> (<ID>)`

## Step 7 - Watch CI

Monitor CI until green. Record the run URL in MASTER.md §Section rollup CI column.

## Quick reference - npm scope and naming

- npm scope: `@rianell/`
- Directory names: kebab-case, no spaces
- i18n key format: `{namespace}.{semantic.slug}` (e.g. `wizard.saveEntry`)
