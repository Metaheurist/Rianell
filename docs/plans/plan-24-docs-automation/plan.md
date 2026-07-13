---
execution_order: 24
section: 24
title: Docs & changelog automation
status: done
source: ../MASTER.md
master_section: 24
feature_ids: [DC1, DC2, DC3, DC4, DC5]
depends_on:
  - plan-23-community/plan.md
blocks:
  - plan-25-migration/plan.md
---

# Plan 24 - Docs & changelog automation (DC1-DC5)

## Objective

Automate changelog generation, OpenAPI publish/validation, CONTRIBUTING guide, GitHub issue/PR templates, and README API badges.

## Verify

```bash
npm run test:unit
npm run verify:api-spec
```
