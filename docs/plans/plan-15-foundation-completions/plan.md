---
execution_order: 15
section: 15
title: Foundation completions
status: done
source: ../MASTER.md
master_section: 15
feature_ids: [FC1, FC2, FC3, FC4, FC5, FC6, FC7, FC8, FC9]
depends_on:
  - plan-14-cross-cutting/plan.md
blocks:
  - plan-16-extended-metrics/plan.md
---

# Plan 15 - Foundation completions (FC1-FC9)

## Objective

Wire half-implemented foundation features: guided voice extraction, barcode food logging, consent audit trail, DEK wrapping, health data encryption columns, VAPID CI injection, iOS notification parity, GGUF loader, and dynamic `html lang`.

## Required features

| ID | Feature | Status |
|----|---------|--------|
| FC1 | Guided voice extraction wired to RN LogWizard | done |
| FC2 | Barcode food logging wired to PWA camera API | done |
| FC3 | consent_audit_log write path via RPC | done |
| FC4 | Passphrase-derived key wrapping for user_keys | done |
| FC5 | At-rest AES-GCM columns for health_data | done |
| FC6 | VAPID public key CI injection | done |
| FC7 | iOS notification scheduling parity | done |
| FC8 | GGUF transformers.js loader wired | done |
| FC9 | Dynamic `document.documentElement.lang` on locale change | done |

## Verify

```bash
npm run test:unit
$env:PROJECTS_EXTRA_VERIFY = "verify:i18n"
npm run projects:gate
```
