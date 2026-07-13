---
execution_order: 20
section: 20
title: Self-hosted & FHIR R4
status: done
source: ../MASTER.md
master_section: 20
feature_ids: [SH1, SH2, SH3, SH4, SH5]
depends_on:
  - plan-19-connectors/plan.md
blocks:
  - plan-21-security/plan.md
---

# Plan 20 - Self-hosted & FHIR R4 (SH1-SH5)

## Objective

Document Docker Compose self-hosting, FHIR R4 read server and inbound Bundle import, HL7 v2 ORU-R01 parsing, and Fasten Health compatibility.

## Verify

```bash
npm run test:unit
```
