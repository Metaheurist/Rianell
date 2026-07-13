---
execution_order: 22
section: 22
title: Performance optimization
status: done
source: ../MASTER.md
master_section: 22
feature_ids: [PF1, PF2, PF3, PF4, PF5, PF6, PF7]
depends_on:
  - plan-21-security/plan.md
blocks:
  - plan-23-community/plan.md
---

# Plan 22 - Performance optimization (PF1-PF7)

## Objective

Optimize bundle size and runtime: lazy chart loading, CWV/Lighthouse CI gates, memory profiling, WebP/AVIF icons, and perf budget contracts.

## Verify

```bash
npm run test:unit
```
