# Security & performance index - all plans

Rollup of CVE/exploit surfaces and performance constraints per execution plan. Detail lives in each folder's [security-performance.md](./plan-01-platform-architecture/security-performance.md).

**Sources:** [docs/SECURITY.md](../SECURITY.md) · [docs/ai-security.md](../ai-security.md) · Firecrawl `.firecrawl/projects/` · OWASP MASVS · [FINAL-EXECUTION-CHECK.md](./FINAL-EXECUTION-CHECK.md)

**Policy:** [FREE-TIER-POLICY.md](./FREE-TIER-POLICY.md) - no paid third-party APIs in default path.

**CI CVE baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks - [security-audit.yml](../../.github/workflows/security-audit.yml)

---

## Critical dependency pins (cross-plan)

| Package | Pin | Plans affected | Action on CVE |
|---------|-----|----------------|---------------|
| `@huggingface/transformers` | 3.3.2 | 08 | Parity + golden prompts before bump |
| `onnxruntime-react-native` | ^1.22.0 | 08 | Gradle patch + RN matrix |
| ApexCharts (PWA lazy) | bundled | 09 | Sanitize user labels (C8) |
| Supabase client | publishable key + RLS | 06, 13 | Never service_role in client |

---

## Plan-by-plan summary

| Exec | Plan | Top CVE / exploit risks | Top perf risks |
|------|------|-------------------------|----------------|
| 01 | [Platform](./plan-01-platform-architecture/security-performance.md) | Storybook supply chain | Bundle size on T1 split |
| 02 | [i18n](./plan-02-accessibility-i18n/security-performance.md) | XSS in locale strings | 14-pack load on boot |
| 03 | [Settings](./plan-03-settings-onboarding/security-performance.md) | S8 import prototype pollution | Search index churn |
| 04 | [Logging](./plan-04-logging-data-capture/security-performance.md) | L5 SSRF, L11 prompt injection | L8 sub-entry scan cost |
| 05 | [Privacy](./plan-05-privacy-compliance/security-performance.md) | P4 weak KDF, P7 auth bypass | P2 log cap |
| 06 | [Cloud](./plan-06-cloud-sync/security-performance.md) | D6 link leakage, D5 formula injection | Sync backoff |
| 07 | [AI engine](./plan-07-ai-engine/security-performance.md) | A8 re-identification in export | Large-log analysis blocking |
| 08 | [LLM](./plan-08-llm-nlp/security-performance.md) | Transformers CVE | Model load blocking MOTD; N11 on-device only |
| 09 | [Charts](./plan-09-charts-analytics/security-performance.md) | C8 XSS in labels | ApexCharts memory |
| 10 | [Home](./plan-10-home-dashboard/security-performance.md) | H5 geolocation consent | Card reorder every render; Open-Meteo (no key) |
| 11 | [Notifications](./plan-11-notifications/security-performance.md) | R4 VAPID, PHI in body | Notification scheduling batch |
| 12 | [Clinician](./plan-12-clinician-sharing/security-performance.md) | CL2 QR PHI exposure | PDF on main thread |
| 13 | [Research](./plan-13-research-community/security-performance.md) | RE1 k-anonymity breach | Aggregation cache |
| 14 | [Cross-cutting](./plan-14-cross-cutting/security-performance.md) | X14.5 screening scope | Weekly flow step load |

---

## Firecrawl research cache

| File | Used by plans |
|------|---------------|
| `.firecrawl/projects/supabase-rls.md` | 06, 13 |
| `.firecrawl/projects/supabase-free-tier.json` | 06, 13 |
| `.firecrawl/projects/open-meteo-weather.json` | 10 |
| `.firecrawl/projects/web-push-mdn.md` | 11, 14 |
| `.firecrawl/projects/openfoodfacts.json` | 04 |
| `.firecrawl/projects/owasp-masvs-health.json` | 01-14 |
| `.firecrawl/projects/transformers-js-local.json` | 08 |

Refresh before dependency major bumps:

```bash
firecrawl search "<topic>" --limit 5 --scrape -o .firecrawl/projects/plan-NN-topic.json
node scripts/projects/generate-plan-folder-docs.mjs
```

---

## Pre-rollout checklist (every plan)

- [ ] Read plan [security-performance.md](./plan-01-platform-architecture/security-performance.md)
- [ ] `node docs/plans/plan-NN-*/scripts/verify-plan.mjs`
- [ ] `npm run projects:gate` → `POST_PLAN_GATE_OK`
- [ ] `npm audit --omit=dev` clean or accepted-risk noted in CHANGELOG
- [ ] Commit + `npm run projects:ci-watch` → `CI_GREEN`
