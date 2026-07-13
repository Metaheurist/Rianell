---
execution_order: 01
section: 13
title: Platform & architecture
status: done
source: ../MASTER.md
master_section: 13
feature_ids: [T1, T2]
depends_on: []
blocks: [plan-02-accessibility-i18n/plan.md, plan-03-settings-onboarding/plan.md]
---

# Plan 01 - Section 13: Platform & architecture

## Objective

Establish maintainable PWA structure and a documented design system before feature work across Home, Logging, Charts, and Settings. Runs first because incremental module extraction in `app.js` lowers cost of all subsequent UI plans.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| T1 | **Component extraction (PWA)** - split settings, wizard, charts into ES modules | L | Incremental only; no big-bang refactor |
| T2 | **Design system Storybook / catalog** - tokens + components documented | M | `@rianell/tokens` already synced to PWA |


## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | CVE + performance review (Firecrawl cross-ref) |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** - no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** - PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **External setup** - See [EXTERNAL-SETUP.md](../EXTERNAL-SETUP.md) (plan-specific section).

## Prerequisites

- None (first plan in execution order)
- Read [`docs/architecture-standard.md`](../../architecture-standard.md)

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA shell | `apps/pwa-webapp/app.js`, `apps/pwa-webapp/index.html`, `apps/pwa-webapp/event-handlers.js` |
| Tokens | `packages/tokens/`, `apps/pwa-webapp/css/tokens.css`, `scripts/build/sync-tokens-to-pwa.mjs` |
| Build | `apps/pwa-webapp/build-site.mjs`, `scripts/build/run-web.mjs` |

## Agent runbook (general)

1. Read [`MASTER.md`(../MASTER.md) §13, this plan, and `docs/platform-parity.json`
2. Inventory monolithic boundaries in `app.js` (settings carousel, log wizard, charts init)
3. **T1:** Extract one vertical slice at a time (e.g. settings module first); keep ES module imports working in PWA build
4. **T2:** Add Storybook or static component catalog wired to design tokens; document RN parity gaps
5. Verify: `npm run test:unit`, `npm run build:web` smoke
6. Update CHANGELOG only when user asks to commit

## Completion gates

- [x] T1: At least settings, wizard, or charts extracted to dedicated ES modules with no regressions
- [x] T2: Storybook/catalog documents tokens and primary UI patterns
- [ ] PWA build and unit tests pass
- [ ] Parity: no RN changes required unless shared package extracted

## Cross-plan notes

- **T1** unblocks faster delivery in plans 03-10 (Settings, Logging UI, Charts, Home)
- **T2** supports plan 02 (I5 chart palettes) and all new UI strings/components

## Agent execution

### Phase A - Inventory (before any extraction)

- [ ] Grep `apps/pwa-webapp/app.js` for `toggleSettings`, `LOG_WIZARD`, `switchTab('charts')` - note line ranges and shared state (`appSettings`, `logs`, `chartState`)
- [ ] Confirm PWA build entry: `apps/pwa-webapp/build-site.mjs` and how `app.js` is bundled
- [ ] List RN screens that mirror extracted PWA modules (Settings, Log wizard, Charts) for parity notes only - no RN refactor in this plan unless shared package extracted

### Phase B - T1: PWA component extraction (incremental)

**Order:** settings → wizard → charts (one vertical slice per PR/session)

#### T1.1 Settings module

- [ ] Create `apps/pwa-webapp/modules/settings.js` (or `settings/index.js`) exporting init/render handlers
- [ ] Move settings carousel open/close, pane navigation, and preference read/write from `app.js`
- [ ] Import module from `app.js`; keep global `appSettings` contract stable for `event-handlers.js`
- [ ] Smoke: open all 9 settings panes; save a preference; reload page

#### T1.2 Log wizard module

- [ ] Create `apps/pwa-webapp/modules/log-wizard.js` with step navigation, validation, save to IDB
- [ ] Wire `#logTab` / wizard DOM bindings via exported init function
- [ ] Smoke: complete full wizard save; verify export JSON unchanged shape

#### T1.3 Charts module (minimal)

- [ ] Extract chart tab init + view switcher into `apps/pwa-webapp/modules/charts.js`
- [ ] Leave ApexCharts lazy-load path intact
- [ ] Smoke: Balance / Individual / Combined views render

**T1 acceptance:** At least one of settings, wizard, or charts in dedicated ES modules; `npm run build:web` passes; no behavior regression in manual smoke.

### Phase C - T2: Design system catalog

- [ ] Add Storybook under `apps/storybook/` OR static catalog page under `apps/pwa-webapp/design-catalog/` (pick one; document choice in plan notes)
- [ ] Wire `@rianell/tokens` CSS variables; document primary components: buttons, cards, sliders, settings panes
- [ ] Document RN gap list (components not yet in RN design tokens)
- [ ] Add npm script e.g. `npm run storybook` or `npm run design-catalog` in root `package.json`

**T2 choice:** static catalog under `apps/pwa-webapp/design-catalog/` (dev-only; excluded from production mirror).

## Feature checklist (sync with MASTER)

| ID | Status | Agent notes |
|----|--------|-------------|
| T1 | done | settings overlay + carousel → `modules/settings.js` |
| T2 | done | static catalog at `apps/pwa-webapp/design-catalog/` (no Storybook dep) |

## Verification

```bash
npm run test:unit
npm run build:web
npm run parity:inventory:check   # baseline only; expect no new RN gaps from PWA-only work
```

## Master sync

On start: MASTER §Section rollup exec 01 → `in_progress`. On each ID done: MASTER §13 row → `done`. On all gates: exec 01 → `done`.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
# Optional: $env:PROJECTS_EXTRA_VERIFY = "verify:root-hygiene"
npm run projects:gate
```

Then: CHANGELOG → MASTER §13 → commit/push → `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- No big-bang `app.js` rewrite in one pass
- Do not change log schema or settings field names (plans 03-04 depend on stability)
