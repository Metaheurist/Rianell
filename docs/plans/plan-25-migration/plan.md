---
execution_order: 25
section: 25
title: Data migration toolkit
status: done
source: ../MASTER.md
master_section: 25
feature_ids: [DM1, DM2, DM3, DM4, DM5, DM6, DM7, DM8, DM9]
depends_on:
  - plan-24-docs-automation/plan.md
blocks:
  - plan-26-accessibility-ui/plan.md
---

# Plan 25 — Data migration toolkit (DM1–DM9)

## Objective

Expand migration adapters (Apple Health, Google Fit, Oura, Garmin, Whoop, Cronometer, MyFitnessPal, Daylio) and wire a unified PWA migration wizard.

## Verify

```bash
npm run test:unit
```
