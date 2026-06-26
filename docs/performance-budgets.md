# Performance budgets (Plan 22)

| Metric | Budget | CI gate |
|--------|--------|---------|
| Lighthouse Performance | ≥ 90 | `scripts/audit/run-lighthouse-ci.mjs` |
| LCP | < 2500 ms | `scripts/audit/run-cwv-audit.mjs` |
| CLS | < 0.1 | CWV audit |
| INP | < 200 ms | CWV audit |
| Heap (ONNX + charts) | < 500 MB | `scripts/audit/memory-profile.mjs` (warning) |

Lazy-load markers: `lazy-charts.mjs`, `lazyLoadCharts()` in `app.js`.

Bundle split verify: `npm run verify:bundle-split`.
