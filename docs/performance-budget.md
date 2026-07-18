# Performance budget - Rianell PWA

**Last updated:** 2026-06-23  
**Status:** Launch audit Phase 5 - targets for CI boot audit and manual Lighthouse runs.  
**Related:** [infrastructure-and-security-edge.md](infrastructure-and-security-edge.md) · `audit-history/` boot JSON

---

## 1. Core Web Vitals (desktop, throttled Fast 3G + 4× CPU)

| Metric | Budget | Measurement |
|--------|--------|-------------|
| **LCP** | ≤ 2.5 s | Largest paint of home hero or MOTD after `body.loaded` |
| **CLS** | ≤ 0.1 | No layout shift from tab bar / loading overlay removal |
| **TBT** | ≤ 300 ms | Main thread blocked during boot until `data-benchmark="main-ready"` |
| **INP** | ≤ 200 ms | First tab switch after load |

---

## 2. Boot timeline (PWA)

| Milestone | Budget | Hook |
|-----------|--------|------|
| First paint (shell) | ≤ 1.0 s | `body` theme critical CSS |
| `main-ready` | ≤ 4.0 s | `data-benchmark="main-ready"` on cold cache |
| Charts lazy (if enabled) | ≤ 1.5 s after tab open | Intersection observer in `app.js` |
| Transformers.js fetch | **0 ms at boot** | Only after AI consent + `preloadSummaryLLM` |

---

## 3. Asset budgets

| Asset class | Budget |
|-------------|--------|
| Initial HTML + critical CSS | ≤ 120 KB gzip |
| `app.*.min.js` (entry) | Monitor via `benchmarks-web` job |
| HF model weights | On demand; not in Pages deploy |

---

## 4. Regression gates

- **CI:** `audit-boot-post-deploy` records boot milestones; compare to `audit-history/baseline.json`.
- **Local:** `npm run audit:boot:strict` before release.
- **Manual:** Chrome Lighthouse → Performance ≥ 80 on `rianell.com` (informational).

---

## 5. Optimization levers

- Preconnect: Supabase, jsDelivr, Open-Meteo (`index.html`)
- Lazy loaders: `performance-utils.js` (`ensureSupabaseLoaded`, `ensureApexChartsLoaded`, `ensureAIEngineLoaded`)
- Transformers: dynamic import in `summary-llm.js` only
- Cloudflare cache rules - [cloudflare-headers-recommended.md](../security/cloudflare-headers-recommended.md)
