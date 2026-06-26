---
execution_order: 21
section: 21
title: Security hardening & DAST
status: done
source: ../MASTER.md
master_section: 21
feature_ids: [SEC1, SEC2, SEC3, SEC4, SEC5, SEC6, SEC7, SEC8, SEC9, SEC10, SEC11, SEC12]
depends_on:
  - plan-20-selfhost-fhir/plan.md
blocks:
  - plan-22-performance/plan.md
---

# Plan 21 — Security hardening & DAST (SEC1–SEC12)

## Objective

Harden the stack with OWASP ZAP DAST CI, Dependabot, CSP reporting, SBOM generation, secure storage, MobSF audit, and prompt-injection guards.

## Verify

```bash
npm run test:unit
```
