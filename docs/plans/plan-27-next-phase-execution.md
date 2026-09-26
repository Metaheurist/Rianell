--- /dev/null
+++ b/docs/plans/plan-27-next-phase-execution.md
@@ -0,0 +1,35 @@
+# Plan 27: Next Phase Execution (Active)
+
+**Status:** `pending`
+**Target Version:** v2.7.0
+**Last Updated:** 2026-08-05
+
+## Scope
+This plan operationalizes the active workstreams defined in [`docs/next-phase-development-plan.md`](../next-phase-development-plan.md). It bridges the gap between the closed v1.x program and current npm v2.6.0 maintenance.
+
+## Workstream 1: Discoverability & SEO Gaps
+**Source:** [`next-phase-development-plan.md` §1](../next-phase-development-plan.md#1-discoverability--seo-remaining-gaps)
+
+- **Action:** Propose unit tests for `BreadcrumbList`, `MedicalWebPage`, and `FAQPage` structured data injection in landing pages.
+- **Test Proposal:** `tests/unit/seo-structure.test.js` -> Verify JSON-LD validity via schema.org types.
+- **Doc Update:** Update `docs/plans/plan-02-accessibility-i18n/plan.md` (legacy) or create new SEO-specific doc referencing these schemas.
+
+## Workstream 2: Internationalization Depth (Ollama Tier-C)
+**Source:** [`next-phase-development-plan.md` §2](../next-phase-development-plan.md#2-internationalization-depth-ollama-tier-c)
+
+- **Action:** Define script updates for `scripts/i18n/generate-locale-overrides.mjs` to support empty `ga`/`ar`/`he` backfill.
+- **Unit Test:** `tests/unit/i18n-tier-c-validation.test.js` -> Check coverage thresholds against `--max-pct`.
+
+## Workstream 3: Server Observability
+**Source:** [`next-phase-development-plan.md` §3](../next-phase-development-plan.md#3-observability-server-side-privacy-safe)
+
+- **Action:** Draft configuration for `@sentry/node` in `server/` (devDependency only).
+- **Constraint:** Strictly no health data capture per [`security-privacy.mdc`](../../.cursor/rules/security-privacy.mdc).
+
+## Dependency Direction
+- All tests and docs remain under `docs/plans`, `tests/unit`, or `scripts/`.
+- No product code edits in `apps/pwa-webapp` until this plan is approved.
