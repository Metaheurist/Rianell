---
execution_order: 18
section: 18
title: REST API & webhooks
status: done
source: ../MASTER.md
master_section: 18
feature_ids: [API1, API2, API3, API4, API5, API6]
depends_on:
  - plan-17-nutrition/plan.md
blocks:
  - plan-19-connectors/plan.md
---

# Plan 18 — REST API & webhooks (API1–API6)

## Objective

Ship API keys and webhook schema, REST edge functions, OpenAPI 3.1 spec, key management UI, outbound webhook engine, and delivery log UI.

## Verify

```bash
npm run test:unit
npm run verify:api-spec
```
